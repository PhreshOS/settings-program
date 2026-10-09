import { useEffect, useState } from "react"
import type { Process, ProgramLogRecord } from "@phreshos/core"
import { AlertDialog, AppLayout, Badge, Button, Flex, Table, Text, useAppearance, useScale, ScrollArea } from "@phreshos/react-ui"
import type { EndpointState } from "@client/core/application"
import usePromise from "@libs/react-promise"
import { useApplication } from "../../application"
import Icon from "../../components/icon"
import { ReadView, useRead } from "../../components/read"
import { useControls } from "../../components/controls"
import { Group, Page, Row, SectionFooter, SectionHeader, Empty } from "../../components/section-parts"
import { useFrame } from "../../settings/frame"
import { ago } from "../overview"

type Details = NonNullable<Awaited<ReturnType<ReturnType<typeof useApplication>["process"]>>>

/** One live Process: where it came from, its two sides, and what it prints. */
export default function ProcessView({ identity }: Readonly<{ identity: string }>) {
    const application = useApplication()
    const read = useRead(() => application.process(identity), [identity], change => application.followProcesses(change))
    const [problem, setProblem] = useState<string | null>(null)
    const details = read.value ?? null
    const label = details ? details.process.name ?? details.process.identity : identity

    return <>
        <SectionHeader title={label} above={{ title: "Processes", address: "processes" }}>
            {details && <End details={details} onProblem={setProblem} />}
        </SectionHeader>
        <AppLayout.Content>
            <ReadView read={read}>{() => details
                ? <ProcessPage details={details} onProblem={setProblem} onChange={() => setProblem(null)} />
                : <Empty>This Process has ended.</Empty>}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={problem ?? (details ? `${details.program.name} · ${details.process.identity}` : "")} problem={problem !== null} />
    </>
}

function ProcessPage({ details, onProblem, onChange }: Readonly<{ details: Details, onProblem: (problem: string) => void, onChange: () => void }>) {
    const { go } = useFrame()
    const space = useScale(useAppearance().spacing)
    const { process, program, parent, options, installed, server, client } = details
    const { busy, run } = useControls(error => onProblem(error instanceof Error ? error.message : "The change did not apply."), onChange)
    const given = Object.entries(options)

    return <Page>
        <Flex align="center" gap="medium">
            <Icon of={program} size={space.xlarge * 2} />
            <Flex direction="column" style={{ flex: "1 1 auto", minWidth: 0 }}>
                <Text size="xlarge" truncate style={{ fontWeight: 600 }}>{process.name ?? process.identity}</Text>
                <Text tone="secondary" size="small">{program.name} · started {ago(process.startedAt.getTime())}</Text>
            </Flex>
        </Flex>

        <Group title="Process">
            <Row label="Program">
                {installed
                    ? <Button size="small" depth="none" onPress={() => go(`programs/${program.identity}`)}>{program.name}</Button>
                    : <Text tone="secondary">{program.name}</Text>}
            </Row>
            <Row label="Identity"><Text tone="secondary" size="small" className="mono">{process.identity}</Text></Row>
            <Row label="Started"><Text tone="secondary" size="small" className="tabular">{process.startedAt.toLocaleString()}</Text></Row>
            <Row label="Started by" description={parent ? "The Process that created this one." : "It was not started by another Process."}>
                {parent && <Button size="small" depth="none" onPress={() => go(`processes/${parent.identity}`)}>{parent.name ?? parent.identity}</Button>}
            </Row>
            {!!given.length && <Row label="Options" description="The values it was started with.">
                <Flex direction="column" align="end">
                    {given.map(([name, value]) => <Text key={name} tone="secondary" size="small" className="mono">{name}={String(value)}</Text>)}
                </Flex>
            </Row>}
        </Group>

        <Group title="Endpoints">
            <Side process={process} side="server" state={server} busy={busy} run={run} />
            <Side process={process} side="client" state={client} busy={busy} run={run} />
        </Group>

        <Output process={process} />
    </Page>
}

/** One side of the Process, if its Program declares it, with the way to stop or start it. */
function Side({ process, side, state, busy, run }: Readonly<{
    process: Process
    side: "server" | "client"
    state: EndpointState
    busy: (control: string) => boolean
    run: (control: string, operation: () => Promise<unknown>) => void
}>) {
    const application = useApplication()
    if (state === null) return null

    return <Row label={side === "server" ? "Server" : "Client"}
        description={side === "server" ? "Runs on this machine." : "Its Window on the Desktop."}>
        <Flex align="center" gap="small">
            {state.service && <Badge size="xsmall">Service</Badge>}
            {state.running
                ? <Button size="small" disabled={busy(side)} onPress={() => run(side, () => application.stopEndpoint(process, side))}>Stop</Button>
                : <Button size="small" disabled={busy(side)} onPress={() => run(side, () => application.startEndpoint(process, side))}>Start</Button>}
        </Flex>
    </Row>
}

/** How many lines the page holds: the newest ones, and those printed while it is open. */
const held = 200

/** What the Process printed, newest first, and new lines as they arrive. */
function Output({ process }: Readonly<{ process: Process }>) {
    const application = useApplication()
    const space = useScale(useAppearance().spacing)
    const read = useRead(() => application.output(process, held), [process.identity])
    const [arrived, setArrived] = useState<readonly ProgramLogRecord[]>([])

    useEffect(() => {
        setArrived([])
        return application.followOutput(process, record => setArrived(current => [record, ...current].slice(0, held)))
    }, [application, process.identity])

    const lines = [...arrived, ...read.value ?? []].slice(0, held)

    return <Group title="Output" description="What it prints, as it prints it.">
        {lines.length === 0
            ? <Row label={read.value ? "Nothing printed yet" : "Reading"} />
            : <ScrollArea axis="horizontal"><Table aria-label="Output" size="small">
                <Table.Header>
                    <Table.Column id="time" width={space.xlarge * 4}>Time</Table.Column>
                    <Table.Column id="source" width={space.xlarge * 3}>From</Table.Column>
                    <Table.Column id="content" rowHeader minWidth={space.xlarge * 8}>Line</Table.Column>
                </Table.Header>
                <Table.Body>
                    {lines.map((line, index) => <Table.Row key={`${line.createdAt}-${index}`} id={`${line.createdAt}-${index}`} textValue={line.content}>
                        <Table.Cell><Text tone="secondary" size="small" className="tabular">{new Date(line.createdAt).toLocaleTimeString()}</Text></Table.Cell>
                        <Table.Cell><Badge size="xsmall" color={line.kind === "error" || line.kind === "stderr" ? "danger" : line.kind === "warn" ? "warning" : undefined}>{line.source}</Badge></Table.Cell>
                        <Table.Cell><span className="log-content" title={line.kind}>{line.content}</span></Table.Cell>
                    </Table.Row>)}
                </Table.Body>
            </Table></ScrollArea>}
    </Group>
}

/** Ends the Process after the owner confirms. */
function End({ details, onProblem }: Readonly<{ details: Details, onProblem: (problem: string) => void }>) {
    const application = useApplication()
    const ending = usePromise(async () => {
        try { await application.endProcess(details.process) }
        catch (error) { onProblem(error instanceof Error ? error.message : "Could not end this Process."); throw error }
    })
    const label = details.process.name ?? details.process.identity

    return <AlertDialog>
        <AlertDialog.Trigger size="small" color="danger" pending={ending.isPending}>End</AlertDialog.Trigger>
        <AlertDialog.Backdrop>
            <AlertDialog.Content>
                <AlertDialog.Header>
                    <AlertDialog.Title>End “{label}”?</AlertDialog.Title>
                    <AlertDialog.Description>Its Server stops and its Window closes. What it has not saved is lost.</AlertDialog.Description>
                </AlertDialog.Header>
                <AlertDialog.Footer>
                    <AlertDialog.Close>Cancel</AlertDialog.Close>
                    <AlertDialog.Close color="danger" onPress={() => void ending.safeExecute()}>End</AlertDialog.Close>
                </AlertDialog.Footer>
            </AlertDialog.Content>
        </AlertDialog.Backdrop>
    </AlertDialog>
}
