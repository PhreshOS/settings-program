import { desktop, system } from "@phreshos/client"
import type {
    Appearance, AuthenticationCredentials, Connection, DesktopPreferencesUpdate, IconSize, Launch, PermissionName, PermissionRequestInput,
    Permissions, Program, Session, SystemLogRecord
} from "@phreshos/core"

/** An installed Program with what Settings shows and changes about it. */
export type ProgramDetails = Readonly<{
    program: Program
    permissions: Permissions
    startup: Launch | null
    pinned: boolean
}>

/** A valid Session with the browser Connections it signs in. */
export type SessionDetails = Readonly<{
    session: Session
    connections: readonly Connection[]
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

    public updateAppearance(appearance: Appearance) {
        return system.appearance.update(appearance)
    }

    public updateDesktopPreferences(preferences: DesktopPreferencesUpdate) {
        return desktop.preferences.update(preferences)
    }

    public async upload(file: File) {
        return (await system.uploads.write(file)).file
    }

    /** Every installed Program, by name. */
    public async programs(): Promise<ProgramDetails[]> {
        const programs = await system.program.list({ installed: true })
        const details = await Promise.all(programs.map(program => this.program(program)))
        return details.sort((first, second) => first.program.name.localeCompare(second.program.name))
    }

    public async program(program: Program): Promise<ProgramDetails> {
        const [permissions, startup, pinned] = await Promise.all([
            program.permissions.all(), program.startup.get(), program.pinned()
        ])
        return { program, permissions, startup, pinned }
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

    public pin(program: Program, pinned: boolean) {
        return program.pin(pinned)
    }

    /** Uninstalls a Program; `purge` also removes its storage. */
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
    public installed() {
        return system.program.list({ installed: true })
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
        const details = await Promise.all(sessions.map(async session => ({ session, connections: await session.connections() })))
        return { sessions: details as readonly SessionDetails[], current: current?.identity ?? null }
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
