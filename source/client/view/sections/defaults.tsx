import { useState } from "react"
import { opensType, type Program } from "@phreshos/core"
import { AppLayout, Select, Table, Text, useAppearance, useScale } from "@phreshos/react-ui"
import usePromise from "@libs/react-promise"
import { useApplication } from "../application"
import { ReadView, useRead } from "../components/read"
import { SectionFooter, SectionHeader } from "../components/section-parts"

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
        const [programs, defaults] = await Promise.all([application.programs(), application.openingDefaults()])
        return { programs, defaults }
    }, [], change => {
        const stops = [application.followPrograms(change), application.followOpeningDefaults(change)]
        return () => stops.forEach(stop => stop())
    })
    const [problem, setProblem] = useState<string | null>(null)
    const choosing = usePromise(async (type: string, program: Program | null) => {
        try {
            if (program === null) await application.clearOpeningDefault(type)
            else await application.setOpeningDefault(type, program)
            setProblem(null)
        }
        catch (error) { setProblem(error instanceof Error ? error.message : "The default did not change."); throw error }
    })

    const programs = read.value?.programs ?? []
    const defaults = read.value?.defaults ?? {}
    const declared = programs.flatMap(entry => entry.definition.opens ?? [])
    // Each family comes first, followed by its own exact types.
    const types = [...new Set([...declared, ...Object.keys(defaults)])]
        .sort((a, b) => family(a).localeCompare(family(b)) || Number(!a.endsWith("/*")) - Number(!b.endsWith("/*")) || a.localeCompare(b))
    const opener = (type: string) => programs.filter(entry => opensType(entry.definition.opens ?? [], type))
    // What an exact type without its own default does: its family's default, or ask.
    const fallback = (type: string) => {
        const program = type.endsWith("/*") ? undefined : defaults[family(type)]
        return program ? `As ${family(type)}: ${program.name}` : "Ask each time"
    }

    return <>
        <SectionHeader title="Defaults" />
        <AppLayout.Content>
            <ReadView read={read}>{() => types.length === 0
                ? <Text tone="secondary" style={{ display: "block", padding: space.xlarge, textAlign: "center" }}>No installed Program opens a type of its own yet.</Text>
                : <Table aria-label="Defaults" size="small" style={{ minWidth: 0, tableLayout: "fixed" }}>
                    <Table.Header>
                        <Table.Column id="type" rowHeader>Type</Table.Column>
                        <Table.Column id="program" style={{ width: space.xlarge * 12 }}>Opens with</Table.Column>
                    </Table.Header>
                    <Table.Body>
                        {types.map(type => <Table.Row key={type} id={type} textValue={type}>
                            <Table.Cell><span className="mono truncate">{type}</span></Table.Cell>
                            <Table.Cell>
                                <Select aria-label={`Opens ${type} with`} size="small" value={defaults[type]?.identity ?? ask} disabled={choosing.isPending}
                                    onChange={value => {
                                        if (value === null) return
                                        const chosen = value === ask ? null : opener(type).find(entry => entry.program.identity === value)?.program
                                        if (chosen !== undefined) void choosing.safeExecute(type, chosen)
                                    }}>
                                    <Select.Item id={ask}>{fallback(type)}</Select.Item>
                                    {opener(type).map(entry => <Select.Item key={entry.program.identity} id={entry.program.identity}>{entry.program.name}</Select.Item>)}
                                </Select>
                            </Table.Cell>
                        </Table.Row>)}
                    </Table.Body>
                </Table>}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={problem ?? "A type without a default uses its family's, or asks each time it opens."} problem={problem !== null} />
    </>
}
