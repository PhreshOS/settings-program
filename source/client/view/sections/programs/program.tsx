import { useState } from "react"
import { programPermissionCatalog, type Permission, type PermissionName } from "@phreshos/core"
import { AlertDialog, AppLayout, Button, Checkbox, Flex, Switch, TagGroup, Text, useAppearance, useScale } from "@phreshos/react-ui"
import type { ProgramDetails } from "@client/core/application"
import usePromise from "@libs/react-promise"
import { useApplication } from "../../application"
import Icon from "../../components/icon"
import { ReadView, type Read } from "../../components/read"
import { Group, Page, Row, SectionFooter, SectionHeader } from "../../components/section-parts"
import { useFrame } from "../../settings/frame"
import { permissionPresentation } from "./presentation"

/** One installed Program: what it may do, what it does with the System, and its removal. */
export default function ProgramView({ identity, programs }: Readonly<{ identity: string, programs: Read<ProgramDetails[]> }>) {
    const details = programs.value?.find(entry => entry.program.identity === identity)
    const [problem, setProblem] = useState<string | null>(null)
    // Startup is not announced, so after changing it here the Programs are read again.
    const report = (error: unknown) => setProblem(error instanceof Error ? error.message : "The change did not apply.")
    const changed = () => { setProblem(null); programs.retry() }

    return <>
        <SectionHeader title={details?.program.name ?? identity} above={{ title: "Programs", address: "programs" }} />
        <AppLayout.Content>
            <ReadView read={programs}>{() => details
                ? <ProgramPage details={details} onChange={changed} onProblem={report} />
                : <Text tone="secondary" style={{ display: "block", padding: "2rem", textAlign: "center" }}>This Program is not installed.</Text>}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={problem ?? (details ? `${details.program.identity} · ${details.program.version}` : "")} problem={problem !== null} />
    </>
}

function ProgramPage({ details, onChange, onProblem }: Readonly<{ details: ProgramDetails, onChange: () => void, onProblem: (error: unknown) => void }>) {
    const application = useApplication()
    const { go } = useFrame()
    const space = useScale(useAppearance().spacing)
    const { program, definition, startup, pinned } = details
    const act = usePromise(async (operation: () => Promise<unknown>) => {
        try { await operation(); onChange() }
        catch (error) { onProblem(error); throw error }
    })
    const run = (operation: () => Promise<unknown>) => void act.safeExecute(operation)

    return <Page>
        <Flex align="center" gap="medium">
            <Icon of={program} size={space.xlarge * 2} />
            <Flex direction="column" style={{ flex: "1 1 auto", minWidth: 0 }}>
                <Flex align="baseline" gap="small">
                    <Text size="xlarge" style={{ fontWeight: 600 }}>{program.name}</Text>
                    <Text tone="secondary" size="small" className="tabular">{program.version}</Text>
                </Flex>
                {program.description && <Text tone="secondary" size="small">{program.description}</Text>}
            </Flex>
            <Uninstall details={details} onUninstalled={() => go("programs")} onProblem={onProblem} />
        </Flex>

        <Permissions details={details} busy={act.isPending} run={run} />

        <Group title="With the System">
            <Row label="Startup" description={startup
                ? `Starts ${startup.name ? `“${startup.name}”` : "its default launch"} each time the System starts.`
                : "Nothing starts with the System. The button starts its default launch."}>
                {startup
                    ? <Button size="small" disabled={act.isPending} onPress={() => run(() => application.removeStartup(program))}>Remove</Button>
                    : <Button size="small" disabled={act.isPending} onPress={() => run(() => application.setStartup(program))}>Start with the System</Button>}
            </Row>
            <Row label="Pinned to the Taskbar">
                <Switch aria-label="Pinned to the Taskbar" checked={pinned} disabled={act.isPending} onChange={on => run(() => application.pin(program, on))} />
            </Row>
        </Group>

        {!!definition.opens?.length && <Group title="Opens" aside={<Button size="small" depth="none" onPress={() => go("defaults")}>Defaults</Button>}>
            <div style={{ padding: space.medium }}>
                <TagGroup aria-label="What it opens" size="small">
                    {definition.opens.map(type => <TagGroup.Tag key={type} id={type}><span className="mono">{type}</span></TagGroup.Tag>)}
                </TagGroup>
            </div>
        </Group>}
    </Page>
}

/**
 * Every permission the Program declares or holds. A switch allows or denies it: allowing gives what
 * the Program declares, or the whole permission when it declares none.
 */
function Permissions({ details, busy, run }: Readonly<{ details: ProgramDetails, busy: boolean, run: (operation: () => Promise<unknown>) => void }>) {
    const application = useApplication()
    const { program, definition, permissions } = details
    const declared = definition.permissions ?? {}
    const names = (Object.keys(programPermissionCatalog) as PermissionName[])
        .filter(name => name in declared || (permissions[name] !== undefined && permissions[name] !== null))

    if (!names.length) return <Group title="Permissions"><Row label="None" description="This Program uses only what every Program may." /></Group>

    return <Group title="Permissions" description="What this Program may do beyond its own things.">
        {names.map(name => {
            const value = permissions[name] ?? null
            const declaration = declared[name]
            return <Row key={name} label={permissionPresentation[name].title} description={describe(value, permissionPresentation[name].description)}>
                <Switch aria-label={permissionPresentation[name].title} checked={Array.isArray(value)} disabled={busy}
                    onChange={on => run(() => on
                        ? application.allow(program, name, declaration === undefined || declaration === true ? true : declaration as never)
                        : application.deny(program, name))} />
            </Row>
        })}
    </Group>
}

/** What a permission currently gives, in words. */
function describe(value: Permission | null, description: string) {
    if (value === false) return "Denied."
    if (value === null) return `Not decided. ${description}`
    if (value.length === 0) return description
    return `Only ${value.join(", ")}.`
}

/** Removes the Program after the owner confirms; its own data can go with it. */
function Uninstall({ details, onUninstalled, onProblem }: Readonly<{ details: ProgramDetails, onUninstalled: () => void, onProblem: (error: unknown) => void }>) {
    const application = useApplication()
    const [purge, setPurge] = useState(false)
    const uninstalling = usePromise(async () => {
        try { await application.uninstall(details.program, purge); onUninstalled() }
        catch (error) { onProblem(error); throw error }
    })

    return <AlertDialog>
        <AlertDialog.Trigger size="small" color="danger" pending={uninstalling.isPending}>Uninstall</AlertDialog.Trigger>
        <AlertDialog.Backdrop>
            <AlertDialog.Content>
                <AlertDialog.Header>
                    <AlertDialog.Title>Uninstall {details.program.name}?</AlertDialog.Title>
                    <AlertDialog.Description>Its Processes end and its files are removed.</AlertDialog.Description>
                </AlertDialog.Header>
                <AlertDialog.Body>
                    <Checkbox checked={purge} onChange={setPurge} label="Also remove its data" description="Its storage, store, and database. Otherwise they stay for a later install." />
                </AlertDialog.Body>
                <AlertDialog.Footer>
                    <AlertDialog.Close>Cancel</AlertDialog.Close>
                    <AlertDialog.Close color="danger" onPress={() => void uninstalling.safeExecute()}>Uninstall</AlertDialog.Close>
                </AlertDialog.Footer>
            </AlertDialog.Content>
        </AlertDialog.Backdrop>
    </AlertDialog>
}
