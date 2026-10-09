import { useState } from "react"
import { AppLayout, SearchField, Table, Text, useAppearance, useScale, useAppLayout, ScrollArea } from "@phreshos/react-ui"
import { useApplication } from "../../application"
import Icon from "../../components/icon"
import { ReadView, useRead } from "../../components/read"
import { SectionFooter, SectionHeader, Empty } from "../../components/section-parts"
import { useFrame } from "../../settings/frame"
import { ago } from "../overview"
import { count } from "../programs/programs"
import ProcessView from "./process"
import { EndProcess, Side } from "./parts"

/** The live Processes, and one of them when the address names it. */
export default function Processes({ rest }: Readonly<{ rest: string | null }>) {
    if (rest !== null) return <ProcessView identity={rest} />
    return <ProcessList />
}

function ProcessList() {
    const application = useApplication()
    const processes = useRead(() => application.processes(), [], change => application.followProcesses(change))
    const [query, setQuery] = useState("")
    const [problem, setProblem] = useState<string | null>(null)
    const { go } = useFrame()
    const { narrow } = useAppLayout()
    const space = useScale(useAppearance().spacing)
    const terms = query.trim().toLowerCase()
    const all = processes.value ?? []
    const shown = all.filter(({ process, program }) => !terms
        || [process.name ?? "", process.identity, program.name, program.identity].some(text => text.toLowerCase().includes(terms)))

    return <>
        <SectionHeader title="Processes">
            <SearchField aria-label="Search Processes" placeholder="Search" size="small" value={query} onChange={setQuery} style={{ width: space.xlarge * 8 }} />
        </SectionHeader>
        <AppLayout.Content>
            <ReadView read={processes}>{() => shown.length === 0
                ? <Empty>{terms ? "No matching Processes" : "Nothing is running"}</Empty>
                : <ScrollArea axis="horizontal"><Table aria-label="Processes" size="small" onAction={identity => go(`processes/${identity}`)}>
                    <Table.Header>
                        <Table.Column id="process" rowHeader minWidth={space.xlarge * 3}>Process</Table.Column>
                        <Table.Column id="program" width={space.xlarge * 4}>Program</Table.Column>
                        {!narrow && <Table.Column id="started" width={space.xlarge * 3.5}>Started</Table.Column>}
                        <Table.Column id="server" width={space.xlarge * 3.5}>Server</Table.Column>
                        <Table.Column id="client" width={space.xlarge * 3.5}>Client</Table.Column>
                        <Table.Column id="end" aria-label="End" width={space.xlarge * 2.5}> </Table.Column>
                    </Table.Header>
                    <Table.Body>
                        {shown.map(({ process, program, server, client }) => <Table.Row key={process.identity} id={process.identity} textValue={process.name ?? process.identity}>
                            <Table.Cell>
                                <span style={{ display: "flex", alignItems: "center", gap: space.small, minWidth: 0 }}>
                                    <Icon of={program} size={space.medium * 1.5} />
                                    <Text truncate title={process.identity}>{process.name ?? process.identity}</Text>
                                </span>
                            </Table.Cell>
                            <Table.Cell><Text tone="secondary" truncate>{program.name}</Text></Table.Cell>
                            {!narrow && <Table.Cell><Text tone="secondary" className="tabular">{ago(process.startedAt.getTime())}</Text></Table.Cell>}
                            <Table.Cell><Side state={server} /></Table.Cell>
                            <Table.Cell><Side state={client} /></Table.Cell>
                            <Table.Cell><EndProcess process={process} size="xsmall" depth="none" onProblem={setProblem} /></Table.Cell>
                        </Table.Row>)}
                    </Table.Body>
                </Table></ScrollArea>}</ReadView>
        </AppLayout.Content>
        <SectionFooter problem={problem !== null} status={problem ?? (processes.value
            ? shown.length === all.length ? count(all.length, "Process", "Processes") : `${shown.length} of ${count(all.length, "Process", "Processes")}`
            : "")} />
    </>
}
