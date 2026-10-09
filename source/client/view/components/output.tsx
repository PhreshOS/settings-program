import { useEffect, useState } from "react"
import type { Program, ProgramLogRecord } from "@phreshos/core"
import { Badge, Table, Text, useAppearance, useScale, ScrollArea } from "@phreshos/react-ui"
import { useApplication } from "../application"
import { useRead } from "./read"
import { Group, Row } from "./section-parts"
import LogLine from "./log-line"

/** How many lines it holds: the newest ones, and those printed while it is open. */
const held = 200

/**
 * What a Program prints, newest first, and new lines as they arrive: those of one Process, or of all
 * of them, each then marked with the Process that printed it.
 */
export default function Output({ program, process, description }: Readonly<{ program: Program, process: string | null, description: string }>) {
    const application = useApplication()
    const space = useScale(useAppearance().spacing)
    const read = useRead(() => application.output(program, process, held), [program.identity, process])
    const [arrived, setArrived] = useState<readonly ProgramLogRecord[]>([])

    useEffect(() => {
        setArrived([])
        return application.followOutput(program, process, record => setArrived(current => [record, ...current].slice(0, held)))
    }, [application, program.identity, process])

    const lines = [...arrived, ...read.value ?? []].slice(0, held)

    return <Group title="Output" description={description}>
        {lines.length === 0
            ? <Row label={read.value ? "Nothing printed yet" : "Reading"} />
            : <ScrollArea axis="horizontal"><Table aria-label="Output" size="small">
                <Table.Header>
                    <Table.Column id="time" width={space.xlarge * 4}>Time</Table.Column>
                    {process === null && <Table.Column id="process" width={space.xlarge * 4}>Process</Table.Column>}
                    <Table.Column id="source" width={space.xlarge * 3}>From</Table.Column>
                    <Table.Column id="content" rowHeader minWidth={space.xlarge * 6}>Line</Table.Column>
                </Table.Header>
                <Table.Body>
                    {lines.map((line, index) => <Table.Row key={`${line.createdAt}-${index}`} id={`${line.createdAt}-${index}`} textValue={line.content}>
                        <Table.Cell><Text tone="secondary" size="small" className="tabular">{new Date(line.createdAt).toLocaleTimeString()}</Text></Table.Cell>
                        {process === null && <Table.Cell><Text tone="secondary" size="small" className="mono" truncate>{line.process}</Text></Table.Cell>}
                        <Table.Cell><Badge size="xsmall" color={line.kind === "error" || line.kind === "stderr" ? "danger" : line.kind === "warn" ? "warning" : undefined}>{line.source}</Badge></Table.Cell>
                        <Table.Cell><LogLine content={line.content} /></Table.Cell>
                    </Table.Row>)}
                </Table.Body>
            </Table></ScrollArea>}
    </Group>
}
