import { useState } from "react"
import { opensType, type Program } from "@phreshos/core"
import { AppLayout, Select, Table, useAppearance, useScale, ScrollArea } from "@phreshos/react-ui"
import { useControls } from "../components/controls"
import { useApplication } from "../application"
import { ReadView, useRead } from "../components/read"
import { SectionFooter, SectionHeader, Empty } from "../components/section-parts"

/** Asks each time: a type without a default Program. */
const ask = "ask"

/** The family a type belongs to, such as `image/*` for `image/png`. */
function family(type: string) {
    return `${type.slice(0, type.indexOf("/"))}/*`
}

/**
 * The Program each type of file or link opens with. Listed are the types and families installed
 * Programs declare, and every one that already has a default. A type without a default uses its
 * family's, and without that asks each time.
 */
export default function Defaults() {
    const application = useApplication()
    const space = useScale(useAppearance().spacing)
    const read = useRead(async () => {
        const [programs, defaults] = await Promise.all([application.installed(), application.openingDefaults()])
        return { programs, defaults }
    }, [], change => {
        const stops = [application.followPrograms(change), application.followOpeningDefaults(change)]
        return () => stops.forEach(stop => stop())
    })
    const [problem, setProblem] = useState<string | null>(null)
    const { busy, run } = useControls(error => setProblem(error instanceof Error ? error.message : "The default did not change."), () => setProblem(null))
    const choose = (type: string, program: Program | null) => run(type, () => program === null ? application.clearOpeningDefault(type) : application.setOpeningDefault(type, program))

    const programs = read.value?.programs ?? []
    const defaults = read.value?.defaults ?? {}
    const declared = programs.flatMap(program => program.opens)
    // Each family comes first, followed by its own exact types.
    const types = [...new Set([...declared, ...Object.keys(defaults)])]
        .sort((a, b) => family(a).localeCompare(family(b)) || Number(!a.endsWith("/*")) - Number(!b.endsWith("/*")) || a.localeCompare(b))
    const opener = (type: string) => programs.filter(program => opensType(program.opens, type))
    // What an exact type without its own default does: its family's default, or ask.
    const fallback = (type: string) => {
        const program = type.endsWith("/*") ? undefined : defaults[family(type)]
        return program ? `As ${family(type)}: ${program.name}` : "Ask each time"
    }

    return <>
        <SectionHeader title="Defaults" />
        <AppLayout.Content>
            <ReadView read={read}>{() => types.length === 0
                ? <Empty>No installed Program opens a type of its own yet.</Empty>
                : <ScrollArea axis="horizontal"><Table aria-label="Defaults" size="small">
                    <Table.Header>
                        <Table.Column id="type" rowHeader minWidth={space.xlarge * 5}>Type</Table.Column>
                        <Table.Column id="program" width={space.xlarge * 10}>Opens with</Table.Column>
                    </Table.Header>
                    <Table.Body>
                        {types.map(type => <Table.Row key={type} id={type} textValue={type}>
                            <Table.Cell><span className="mono">{type}</span></Table.Cell>
                            <Table.Cell>
                                <Select aria-label={`Opens ${type} with`} size="small" value={defaults[type]?.identity ?? ask} disabled={busy(type)}
                                    onChange={value => {
                                        if (value === null) return
                                        const chosen = value === ask ? null : opener(type).find(program => program.identity === value)
                                        if (chosen !== undefined) choose(type, chosen)
                                    }}>
                                    <Select.Item id={ask}>{fallback(type)}</Select.Item>
                                    {opener(type).map(program => <Select.Item key={program.identity} id={program.identity}>{program.name}</Select.Item>)}
                                </Select>
                            </Table.Cell>
                        </Table.Row>)}
                    </Table.Body>
                </Table></ScrollArea>}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={problem ?? "A type without a default uses its family's, or asks each time it opens."} problem={problem !== null} />
    </>
}
