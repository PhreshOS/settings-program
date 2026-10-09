import { useState } from "react"
import { AppLayout, Badge, SearchField, Table, Text, useAppearance, useScale, useAppLayout, ScrollArea } from "@phreshos/react-ui"
import type { ProgramDetails } from "@client/core/application"
import { useApplication } from "../../application"
import Icon from "../../components/icon"
import { ReadView, useRead, type Read } from "../../components/read"
import { SectionFooter, SectionHeader, Empty } from "../../components/section-parts"
import { useFrame } from "../../settings/frame"
import ProgramView from "./program"

/** The installed Programs, and one of them when the address names it. */
export default function Programs({ rest }: Readonly<{ rest: string | null }>) {
    const application = useApplication()
    const programs = useRead(() => application.programs(), [], change => application.followPrograms(change))

    if (rest !== null) return <ProgramView identity={rest} programs={programs} />

    return <ProgramList programs={programs} />
}

function ProgramList({ programs }: Readonly<{ programs: Read<ProgramDetails[]> }>) {
    const [query, setQuery] = useState("")
    const { go } = useFrame()
    const { narrow } = useAppLayout()
    const space = useScale(useAppearance().spacing)
    const terms = query.trim().toLowerCase()
    const all = programs.value ?? []
    const shown = all.filter(({ program }) => !terms
        || [program.name, program.identity, ...program.categories, ...program.keywords].some(text => text.toLowerCase().includes(terms)))
    const starting = all.filter(entry => entry.startup !== null).length

    return <>
        <SectionHeader title="Programs">
            <SearchField aria-label="Search Programs" placeholder="Search" size="small" value={query} onChange={setQuery} style={{ width: space.xlarge * 8 }} />
        </SectionHeader>
        <AppLayout.Content>
            <ReadView read={programs}>{() => shown.length === 0
                ? <Empty>{terms ? "No matching Programs" : "No installed Programs"}</Empty>
                : <ScrollArea axis="horizontal"><Table aria-label="Programs" size="small" onAction={identity => go(`programs/${identity}`)}>
                    <Table.Header>
                        <Table.Column id="name" rowHeader minWidth={space.xlarge * 7}>Name</Table.Column>
                        <Table.Column id="version" width={space.xlarge * 3.5}>Version</Table.Column>
                        {/* A narrow window keeps the name room; the rest shows on the Program's own page. */}
                        {!narrow && <Table.Column id="category" width={space.xlarge * 4.5}>Category</Table.Column>}
                        {!narrow && <Table.Column id="permissions" width={space.xlarge * 5}>Permissions</Table.Column>}
                        <Table.Column id="startup" width={space.xlarge * 4}>Startup</Table.Column>
                    </Table.Header>
                    <Table.Body>
                        {shown.map(({ program, permissions, startup }) => <Table.Row key={program.identity} id={program.identity} textValue={program.name}>
                            <Table.Cell>
                                <span style={{ display: "flex", alignItems: "center", gap: space.small, minWidth: 0 }} title={program.description ?? undefined}>
                                    <Icon of={program} size={space.medium * 1.5} />
                                    <Text truncate>{program.name}</Text>
                                </span>
                            </Table.Cell>
                            <Table.Cell><Text tone="secondary" className="tabular">{program.version}</Text></Table.Cell>
                            {!narrow && <Table.Cell><Text tone="secondary">{program.categories[0] ?? "Other"}</Text></Table.Cell>}
                            {!narrow && <Table.Cell><Text tone="secondary" truncate title={granted(permissions)}>{granted(permissions)}</Text></Table.Cell>}
                            <Table.Cell>{startup && <Badge size="xsmall" color="success" dot>{startup.name ?? "Starts"}</Badge>}</Table.Cell>
                        </Table.Row>)}
                    </Table.Body>
                </Table></ScrollArea>}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={programs.value
            ? [shown.length === all.length ? count(all.length, "Program") : `${shown.length} of ${count(all.length, "Program")}`, starting ? `${starting} start with the System` : null].filter(Boolean).join(" · ")
            : ""} />
    </>
}

/** The permissions a Program holds, by name. */
function granted(permissions: ProgramDetails["permissions"]) {
    const names = Object.entries(permissions).filter(([, value]) => Array.isArray(value)).map(([name]) => name)
    return names.includes("all") ? "all" : names.length ? names.join(", ") : "—"
}

export function count(amount: number, noun: string) {
    return `${amount} ${noun}${amount === 1 ? "" : "s"}`
}
