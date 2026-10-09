import { useState } from "react"
import type { IconSize } from "@phreshos/core"
import { AppLayout, SearchField, Table, Text, useAppearance, useScale, ScrollArea } from "@phreshos/react-ui"
import type { ServiceDetails } from "@client/core/application"
import { useApplication } from "../application"
import Icon, { type IconSource } from "../components/icon"
import { ReadView, useRead } from "../components/read"
import { SectionFooter, SectionHeader, Empty } from "../components/section-parts"
import { useFrame } from "../settings/frame"
import { count } from "./programs/programs"

/** The Services ready now. A Service is one side of a named Process, so a row opens that Process. */
export default function Services() {
    const application = useApplication()
    const services = useRead(() => application.services(), [], change => application.followServices(change))
    const [query, setQuery] = useState("")
    const { go } = useFrame()
    const space = useScale(useAppearance().spacing)
    const terms = query.trim().toLowerCase()
    const all = services.value ?? []
    const shown = all.filter(({ address, program }) => !terms
        || [address.process, address.program, program.name].some(text => text.toLowerCase().includes(terms)))

    return <>
        <SectionHeader title="Services">
            <SearchField aria-label="Search Services" placeholder="Search" size="small" value={query} onChange={setQuery} style={{ width: space.xlarge * 8 }} />
        </SectionHeader>
        <AppLayout.Content>
            <ReadView read={services}>{() => shown.length === 0
                ? <Empty>{terms ? "No matching Services" : "No Service is ready"}</Empty>
                : <ScrollArea axis="horizontal"><Table aria-label="Services" size="small"
                    onAction={key => { const process = shown.find(entry => key === id(entry))?.process; if (process) go(`processes/${process}`) }}>
                    <Table.Header>
                        <Table.Column id="service" rowHeader minWidth={space.xlarge * 6}>Service</Table.Column>
                        <Table.Column id="program" width={space.xlarge * 5}>Program</Table.Column>
                        <Table.Column id="side" width={space.xlarge * 3.5}>Endpoint</Table.Column>
                    </Table.Header>
                    <Table.Body>
                        {shown.map(entry => <Table.Row key={id(entry)} id={id(entry)} textValue={entry.address.process}>
                            <Table.Cell>
                                <span style={{ display: "flex", alignItems: "center", gap: space.small, minWidth: 0 }}>
                                    <Icon of={programIcon(entry)} size={space.medium * 1.5} />
                                    <Text truncate>{entry.address.process}</Text>
                                </span>
                            </Table.Cell>
                            <Table.Cell><Text tone="secondary" truncate>{entry.program.name}</Text></Table.Cell>
                            <Table.Cell><Text tone="secondary">{entry.address.endpoint === "server" ? "Server" : "Client"}</Text></Table.Cell>
                        </Table.Row>)}
                    </Table.Body>
                </Table></ScrollArea>}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={services.value
            ? shown.length === all.length ? count(all.length, "Service") : `${shown.length} of ${count(all.length, "Service")}`
            : ""} />
    </>
}

function id({ address }: ServiceDetails) {
    return `${address.program}/${address.process}/${address.endpoint}`
}

/** One icon source per Program, so a fresh read keeps the icon it already shows. */
const icons = new Map<string, IconSource>()

function programIcon({ service, address }: ServiceDetails) {
    let source = icons.get(address.program)
    if (!source) icons.set(address.program, source = { icon: (size?: IconSize) => service.programIcon(size) })
    return source
}
