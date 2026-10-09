import { useEffect, useState } from "react"
import type { SystemLogLevel, SystemLogRecord } from "@phreshos/core"
import { AppLayout, Badge, SearchField, SegmentedControl, Table, Text, useAppearance, useScale, ScrollArea } from "@phreshos/react-ui"
import { useApplication } from "../application"
import { ReadView, useRead } from "../components/read"
import LogLine from "../components/log-line"
import { SectionFooter, SectionHeader, Empty } from "../components/section-parts"

/** How many records the page holds: the newest ones, and those that arrive while it is open. */
const held = 300

type Filter = "all" | "warning" | "error"

const colors: Readonly<Record<SystemLogLevel, "danger" | "warning" | undefined>> = { debug: undefined, info: undefined, warning: "warning", error: "danger" }

/** What the System has recorded, newest first, and new records as they arrive. */
export default function Logs() {
    const application = useApplication()
    const space = useScale(useAppearance().spacing)
    const read = useRead(() => application.logs(held), [])
    const [arrived, setArrived] = useState<readonly SystemLogRecord[]>([])
    const [filter, setFilter] = useState<Filter>("all")
    const [query, setQuery] = useState("")

    useEffect(() => application.followLogs(record => setArrived(current => [record, ...current].slice(0, held))), [application])

    const terms = query.trim().toLowerCase()
    const records = [...arrived, ...read.value ?? []].slice(0, held)
        .filter(record => filter === "all" || record.level === filter || (filter === "warning" && record.level === "error"))
        .filter(record => !terms || `${record.source} ${record.kind} ${record.content}`.toLowerCase().includes(terms))

    return <>
        <SectionHeader title="Logs">
            <SegmentedControl aria-label="Show" size="small" value={filter} onChange={value => setFilter(value as Filter)}>
                <SegmentedControl.Item id="all">All</SegmentedControl.Item>
                <SegmentedControl.Item id="warning">Warnings</SegmentedControl.Item>
                <SegmentedControl.Item id="error">Errors</SegmentedControl.Item>
            </SegmentedControl>
            <SearchField aria-label="Search the log" placeholder="Search" size="small" value={query} onChange={setQuery} style={{ width: space.xlarge * 7 }} />
        </SectionHeader>
        <AppLayout.Content>
            <ReadView read={read}>{() => records.length === 0
                ? <Empty>{terms || filter !== "all" ? "No matching records" : "Nothing recorded yet"}</Empty>
                : <ScrollArea axis="horizontal"><Table aria-label="System log" size="small">
                    <Table.Header>
                        <Table.Column id="time" width={space.xlarge * 5}>Time</Table.Column>
                        <Table.Column id="level" width={space.xlarge * 4}>Level</Table.Column>
                        <Table.Column id="content" rowHeader minWidth={space.xlarge * 6}>Record</Table.Column>
                    </Table.Header>
                    <Table.Body>
                        {records.map((record, index) => <Table.Row key={`${record.createdAt}-${index}`} id={`${record.createdAt}-${index}`} textValue={record.content}>
                            <Table.Cell><Text tone="secondary" size="small" className="tabular">{time(record.createdAt)}</Text></Table.Cell>
                            <Table.Cell><Badge size="xsmall" color={colors[record.level]}>{record.level}</Badge></Table.Cell>
                            <Table.Cell><LogLine content={record.content} /></Table.Cell>
                        </Table.Row>)}
                    </Table.Body>
                </Table></ScrollArea>}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={read.value ? `Following · the newest ${held} records` : ""} />
    </>
}

/** Today's records by their time; older ones by their day too. */
function time(createdAt: number) {
    const date = new Date(createdAt)
    const today = new Date().toDateString() === date.toDateString()
    return today ? date.toLocaleTimeString() : date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}
