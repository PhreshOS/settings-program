import { useEffect, useState } from "react"
import type { Process, ProgramLogRecord } from "@phreshos/core"
import { AppLayout, Badge, Button, Flex, Table, Text, useAppearance, useScale, ScrollArea } from "@phreshos/react-ui"
import { useApplication } from "../../application"
import Icon from "../../components/icon"
import { ReadView, useRead } from "../../components/read"
import LogLine from "../../components/log-line"
import { Group, Page, Row, SectionFooter, SectionHeader, Empty } from "../../components/section-parts"
import { useFrame } from "../../settings/frame"
import { ago } from "../overview"
import { EndProcess, Side } from "./parts"

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
            {details && <EndProcess process={details.process} onProblem={setProblem} />}
        </SectionHeader>
        <AppLayout.Content>
            <ReadView read={read}>{() => details
                ? <ProcessPage details={details} />
                : <Empty>This Process has ended.</Empty>}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={problem ?? (details ? `${details.program.name} · ${details.process.identity}` : "")} problem={problem !== null} />
    </>
}

function ProcessPage({ details }: Readonly<{ details: Details }>) {
    const { go } = useFrame()
    const space = useScale(useAppearance().spacing)
    const { process, program, parent, options, installed, server, client } = details
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
            {server && <Row label="Server" description="Runs on this machine."><Side state={server} /></Row>}
            {client && <Row label="Client" description="Its Window on the Desktop."><Side state={client} /></Row>}
        </Group>

        <Output process={process} />
    </Page>
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
                    <Table.Column id="content" rowHeader minWidth={space.xlarge * 6}>Line</Table.Column>
                </Table.Header>
                <Table.Body>
                    {lines.map((line, index) => <Table.Row key={`${line.createdAt}-${index}`} id={`${line.createdAt}-${index}`} textValue={line.content}>
                        <Table.Cell><Text tone="secondary" size="small" className="tabular">{new Date(line.createdAt).toLocaleTimeString()}</Text></Table.Cell>
                        <Table.Cell><Badge size="xsmall" color={line.kind === "error" || line.kind === "stderr" ? "danger" : line.kind === "warn" ? "warning" : undefined}>{line.source}</Badge></Table.Cell>
                        <Table.Cell><LogLine content={line.content} /></Table.Cell>
                    </Table.Row>)}
                </Table.Body>
            </Table></ScrollArea>}
    </Group>
}
