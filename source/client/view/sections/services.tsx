import { useState } from "react"
import { AppLayout, SearchField, Table, Text, useAppearance, useScale, ScrollArea } from "@phreshos/react-ui"
import { useApplication } from "../application"
import Icon from "../components/icon"
import { ReadView, useRead } from "../components/read"
import { SectionFooter, SectionHeader, Empty } from "../components/section-parts"
import { useFrame } from "../settings/frame"
import { count } from "./programs/programs"

/** The Services held now, read from the running Processes. A row opens the Process holding it. */
export default function Services() {
    const application = useApplication()
    const services = useRead(() => application.services(), [], change => application.followProcesses(change))
    const [query, setQuery] = useState("")
    const { go } = useFrame()
    const space = useScale(useAppearance().spacing)
    const terms = query.trim().toLowerCase()
    const all = services.value ?? []
    const shown = all.filter(({ name, program }) => !terms || [name, program.identity, program.name].some(text => text.toLowerCase().includes(terms)))

    return <>
        <SectionHeader title="Services">
            <SearchField aria-label="Search Services" placeholder="Search" size="small" value={query} onChange={setQuery} style={{ width: space.xlarge * 8 }} />
        </SectionHeader>
        <AppLayout.Content>
            <ReadView read={services}>{() => shown.length === 0
                ? <Empty>{terms ? "No matching Services" : "No Service is held"}</Empty>
                : <ScrollArea axis="horizontal"><Table aria-label="Services" size="small"
                    onAction={key => { const process = shown.find(entry => key === entry.name)?.process; if (process) go(`processes/${process.identity}`) }}>
                    <Table.Header>
                        <Table.Column id="service" rowHeader minWidth={space.xlarge * 3}>Service</Table.Column>
                        <Table.Column id="program" width={space.xlarge * 4}>Program</Table.Column>
                        <Table.Column id="side" width={space.xlarge * 3.5}>Endpoint</Table.Column>
                    </Table.Header>
                    <Table.Body>
                        {shown.map(entry => <Table.Row key={entry.name} id={entry.name} textValue={entry.name}>
                            <Table.Cell>
                                <span style={{ display: "flex", alignItems: "center", gap: space.small, minWidth: 0 }}>
                                    <Icon of={entry.program} size={space.medium * 1.5} />
                                    <Text truncate>{entry.name}</Text>
                                </span>
                            </Table.Cell>
                            <Table.Cell><Text tone="secondary" truncate>{entry.program.name}</Text></Table.Cell>
                            <Table.Cell><Text tone="secondary">{entry.endpoint === "server" ? "Server" : "Client"}</Text></Table.Cell>
                        </Table.Row>)}
                    </Table.Body>
                </Table></ScrollArea>}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={services.value
            ? shown.length === all.length ? count(all.length, "Service") : `${shown.length} of ${count(all.length, "Service")}`
            : ""} />
    </>
}
