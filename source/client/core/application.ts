import { desktop, system } from "@phreshos/client"
import type {
    AppearanceUpdate, AuthenticationCredentials, Cleanup, Connection, DesktopPreferencesUpdate, Endpoint, IconSize, Launch, PermissionName,
    PermissionRequestInput, Permissions, Process, Program, ProgramLogRecord, Session, SystemLogRecord, WindowLayer
} from "@phreshos/core"

/** An installed Program with what Settings shows and changes about it. */
export type ProgramDetails = Readonly<{
    program: Program
    permissions: Permissions
    startup: Launch | null
    /** When it was pinned to the Taskbar, or `null` when it is not. */
    pinnedAt: Date | null
    /** When it was first installed. */
    installedAt: Date | null
}>

/** How many bytes a Program keeps in the System, and how many of them are its cache. */
export type ProgramStorage = Readonly<{ total: number, cache: number }>

/** A valid Session with the browser Connections it signs in. */
export type SessionDetails = Readonly<{
    session: Session
    connections: readonly Connection[]
    /** Now while a browser uses it; otherwise when the last one left. */
    lastActiveAt: Date | null
}>

/** One side of a Process as it is now; `null` when its Program does not declare that side. */
export type EndpointState = Readonly<{ running: boolean, service: string | false }> | null

/** A live Process with its Program and the state of its two sides. */
export type ProcessDetails = Readonly<{
    process: Process
    program: Program
    server: EndpointState
    client: EndpointState
}>

/** A running Client's Window as one Process page shows it. */
export type WindowDetails = Readonly<{ layer: WindowLayer, minimized: boolean, maximized: boolean }>

/** A Service held now: its name, the side of the Process holding it, that Process, and its Program. */
export type ServiceDetails = Readonly<{
    name: string
    endpoint: "server" | "client"
    process: Process
    program: Program
}>

/** Owns Settings operations and reads, and coordinates them with their System authority. */
export default class Application {

    /** What this System is: its name, version, and release. */
    public about() {
        return system.about()
    }

    /**
     * The System at a glance: how many Programs are installed and running, how many start with the
     * System, how many sessions are signed in, and the newest records of what happened.
     */
    public async glance() {
        const [programs, startups, processes, sessions, recent] = await Promise.all([
            system.program.list({ installed: true }),
            system.program.list({ installed: true, startup: true }),
            system.process.list(),
            system.authentication.sessions(),
            system.logs.query<SystemLogRecord>("SELECT * FROM logs WHERE level IN ('info', 'warning', 'error') ORDER BY createdAt DESC LIMIT 5")
        ])
        return { programs: programs.length, processes: processes.length, startups: startups.length, sessions: sessions.length, recent }
    }

    /** Calls `change` when what the glance counts changes. */
    public followGlance(change: () => void) {
        const stops = [
            ...(["install", "uninstall", "changeStartup"] as const).map(event => system.program.subscribe(event, () => change())),
            ...(["create", "exit"] as const).map(event => system.process.subscribe(event, () => change())),
            ...(["sessionCreate", "sessionEnd"] as const).map(event => system.authentication.subscribe(event, () => change())),
            system.logs.subscribe("log", () => change())
        ]
        return () => stops.forEach(stop => stop())
    }

    /** This System's own icon. */
    public icon(size?: IconSize) {
        return system.icon(size)
    }

    /** Changes part of the System Appearance; what is left out stays as it is. */
    public updateAppearance(appearance: AppearanceUpdate) {
        return system.appearance.update(appearance)
    }

    public updateDesktopPreferences(preferences: DesktopPreferencesUpdate) {
        return desktop.preferences.update(preferences)
    }

    public async upload(file: File) {
        return (await system.uploads.write(file)).file
    }

    /** Whether an upload is still there. */
    public async uploadExists(file: string) {
        return await system.uploads.stat(file) !== null
    }

    /** Every Program the System knows, installed or attached from its project, by name. */
    public async programs(): Promise<ProgramDetails[]> {
        const programs = await system.program.list()
        const details = await Promise.all(programs.map(program => this.program(program)))
        return details.sort((first, second) => first.program.name.localeCompare(second.program.name))
    }

    public async program(program: Program): Promise<ProgramDetails> {
        const [permissions, startup, pinnedAt, installedAt] = await Promise.all([
            program.permissions.all(), program.startup.get(), program.pinnedAt(), program.installedAt()
        ])
        return { program, permissions, startup, pinnedAt, installedAt }
    }

    /** Calls `change` whenever the installed Programs, or what Settings shows about them, change. */
    public followPrograms(change: () => void) {
        const stops = (["create", "forget", "install", "uninstall", "pin", "changePermissions", "changeStartup"] as const)
            .map(event => system.program.subscribe(event, () => change()))
        return () => stops.forEach(stop => stop())
    }

    public allow<Name extends PermissionName>(program: Program, name: Name, permission?: PermissionRequestInput<Name>) {
        return program.permissions.allow(name, permission)
    }

    public deny(program: Program, name: PermissionName) {
        return program.permissions.deny(name)
    }

    /** Removes the owner's decision, so the Program's declaration applies again. */
    public reset(program: Program, name: PermissionName) {
        return program.permissions.reset(name)
    }

    public async storage(program: Program): Promise<ProgramStorage> {
        const [total, cache] = await Promise.all([program.storageSize(), program.cache.size()])
        return { total, cache }
    }

    /** Ends the Program's Processes and empties what it keeps; the owner's choices and its logs stay. */
    public clearStorage(program: Program) {
        return program.clearStorage()
    }

    /** Empties its cache, which it can make again; its Processes go on. */
    public clearCache(program: Program) {
        return program.cache.clear()
    }

    public pin(program: Program, pinned: boolean) {
        return program.pin(pinned)
    }

    /** Uninstalls a Program; `purge` also removes its storage. */
    /** Ends a Program's Processes and has the System forget it, such as one attached from its project. */
    public forget(program: Program) {
        return program.forget()
    }

    public async uninstall(program: Program, purge: boolean) {
        for await (const _chunk of program.uninstall({ purge })) { /* The owner sees the result, not the command's output. */ }
    }

    /**
     * Starts the Program's default launch with the System. Only the Program knows any other way to
     * start itself, so the owner can ask for the default one alone.
     */
    public setStartup(program: Program) {
        return program.startup.set()
    }

    public removeStartup(program: Program) {
        return program.startup.remove()
    }

    /** The installed Programs, as they are; what they open comes with them. */
    /** Every Program the System knows, installed or attached from its project. */
    public known() {
        return system.program.list()
    }

    /** The default Program of each media type and family. */
    public openingDefaults() {
        return system.opening.defaults()
    }

    /** Calls `change` whenever a default changes. */
    public followOpeningDefaults(change: () => void) {
        return system.opening.subscribe("changeDefault", () => change())
    }

    public setOpeningDefault(type: string, program: Program) {
        return system.opening.setDefault(type, program)
    }

    public clearOpeningDefault(type: string) {
        return system.opening.clearDefault(type)
    }

    public authentication() {
        return Promise.all([system.authentication.state(), system.authentication.requirements()])
            .then(([state, requirements]) => ({ state, requirements }))
    }

    public setCredentials(credentials: AuthenticationCredentials) {
        return system.authentication.setCredentials(credentials)
    }

    /** Every valid Session with its Connections, and the one this Desktop is signed in with. */
    public async sessions() {
        const [sessions, current] = await Promise.all([
            system.authentication.sessions(),
            desktop.connection().then(connection => connection.session())
        ])
        const details = await Promise.all(sessions.map(async session => {
            const [connections, lastActiveAt] = await Promise.all([session.connections(), session.lastActiveAt()])
            return { session, connections, lastActiveAt }
        }))
        return { sessions: details as readonly SessionDetails[], current: current?.identity ?? null }
    }

    /** Every live browser Connection, with the Session it is signed in with, if any. */
    public async connections() {
        const connections = await system.authentication.connections()
        return Promise.all(connections.map(async connection => ({ connection, session: await connection.session() })))
    }

    /** Every live Process, by Program name and then by start. */
    public async processes(): Promise<ProcessDetails[]> {
        const details = await Promise.all((await system.process.list()).map(process => this.processDetails(process)))
        return details.sort((first, second) => first.program.name.localeCompare(second.program.name)
            || first.process.startedAt.getTime() - second.process.startedAt.getTime())
    }

    /** One live Process with where it came from, or `null` once it has ended. */
    public async process(identity: string) {
        const process = await system.process.find(identity)
        if (!process) return null
        const [details, parent, installedAt] = await Promise.all([this.processDetails(process), process.parent(), process.program().installedAt()])
        const installed = installedAt !== null
        // Only a running Client has a Window to read.
        const window = details.client?.running ? await this.windowDetails(process) : null
        // Installed: its Program has a page under Programs; otherwise it runs from a project.
        return { ...details, parent, options: process.options, opened: process.opened, installed, sandbox: details.program.client?.sandbox ?? null, window }
    }

    private async windowDetails(process: Process): Promise<WindowDetails | null> {
        const window = process.client.window
        try {
            const [layer, minimized, maximized] = await Promise.all([window.layer(), window.minimized(), window.maximized()])
            return { layer, minimized, maximized }
        }
        // The Client stopped between the two reads.
        catch { return null }
    }

    /** Calls `change` as `followProcesses` does, and also when this Process's Window is minimized or maximized. */
    public followProcess(identity: string, change: () => void) {
        const stopProcesses = this.followProcesses(change)
        let stopWindow: Cleanup | null = null
        let following = true
        void system.process.find(identity).then(process => {
            if (!following || !process) return
            const window = process.client.window
            const stops = [window.subscribe("minimize", () => change()), window.subscribe("maximize", () => change())]
            stopWindow = () => stops.forEach(stop => stop())
        }, () => undefined)
        return () => {
            following = false
            stopProcesses()
            stopWindow?.()
        }
    }

    private async processDetails(process: Process): Promise<ProcessDetails> {
        const program = process.program()
        const state = async (declared: boolean, endpoint: Endpoint): Promise<EndpointState> => declared
            ? { running: await endpoint.running(), service: await endpoint.service() }
            : null
        const [server, client] = await Promise.all([state(program.server !== null, process.server), state(program.client !== null, process.client)])
        return { process, program, server, client }
    }

    /** Calls `change` when a Process starts or ends, or one of its sides starts or stops. */
    public followProcesses(change: () => void) {
        const sides = new Map<string, Cleanup>()
        let following = true
        const watch = (process: Process) => {
            if (!following || sides.has(process.identity)) return
            const program = process.program()
            const endpoints = [program.server && process.server, program.client && process.client].filter(endpoint => !!endpoint)
            const stops = endpoints.flatMap(endpoint => (["start", "stop"] as const).map(event => endpoint.lifecycle.subscribe(event, () => change())))
            sides.set(process.identity, () => stops.forEach(stop => stop()))
        }
        const stops = [
            system.process.subscribe("create", process => { watch(process); change() }),
            system.process.subscribe("exit", ({ process }) => {
                sides.get(process.identity)?.()
                sides.delete(process.identity)
                change()
            })
        ]
        void system.process.list().then(processes => processes.forEach(watch), () => undefined)
        return () => {
            following = false
            stops.forEach(stop => stop())
            sides.forEach(stop => stop())
        }
    }

    public endProcess(process: Process) {
        return process.exit()
    }

    /** The newest lines a Program printed, newest first: those of one Process, or of all of them. */
    public output(program: Program, process: string | null, limit: number) {
        return process === null
            ? program.logs.query<ProgramLogRecord>("SELECT * FROM logs ORDER BY createdAt DESC LIMIT ?", [limit])
            : program.logs.query<ProgramLogRecord>("SELECT * FROM logs WHERE process = ? ORDER BY createdAt DESC LIMIT ?", [process, limit])
    }

    /** Calls `record` with each line the Program prints from now on: of one Process, or of all of them. */
    public followOutput(program: Program, process: string | null, record: (record: ProgramLogRecord) => void) {
        return program.logs.subscribe("log", line => { if (process === null || line.process === process) record(line) })
    }

    /** Every Service held now, read from the running Processes: by name. */
    public async services(): Promise<ServiceDetails[]> {
        const processes = await system.process.list()
        const held = await Promise.all(processes.flatMap(process => {
            const program = process.program()
            return ([["server", program.server && process.server], ["client", program.client && process.client]] as const)
                .flatMap(([endpoint, side]) => side ? [(async () => {
                    const name = await side.running() ? await side.service() : false
                    return name === false ? [] : [{ name, endpoint, process, program }]
                })()] : [])
        }))
        return held.flat().sort((first, second) => first.name.localeCompare(second.name))
    }

    /** Signs in a connected browser without a password, such as one the owner approves from here. */
    public signInConnection(connection: Connection) {
        return connection.signIn()
    }

    public followSessions(change: () => void) {
        const stops = (["sessionCreate", "sessionEnd", "connectionCreate", "connectionDisconnect"] as const)
            .map(event => system.authentication.subscribe(event, () => change()))
        return () => stops.forEach(stop => stop())
    }

    public signOut(session: Session) {
        return session.signOut()
    }

    public signOutAllSessions() {
        return system.authentication.signOutAllSessions()
    }

    /** The newest System log records, newest first. */
    public logs(limit: number) {
        return system.logs.query<SystemLogRecord>("SELECT * FROM logs ORDER BY createdAt DESC LIMIT ?", [limit])
    }

    public followLogs(record: (record: SystemLogRecord) => void) {
        return system.logs.subscribe("log", record)
    }
}
