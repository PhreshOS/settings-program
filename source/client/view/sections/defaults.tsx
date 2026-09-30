import { useState } from "react"
import { opensType, type Program } from "@phreshos/core"
import { AppLayout, Select, Table, Text, useAppearance, useScale } from "@phreshos/react-ui"
import usePromise from "@libs/react-promise"
import { useApplication } from "../application"
import { ReadView, useRead } from "../components/read"
import { SectionFooter, SectionHeader } from "../components/section-parts"

/** Asks each time: a type without a default Program. */
const ask = "ask"

/**
 * The Program each type of file or link opens with. Listed are the exact types installed Programs
 * declare, and every type that already has a default; a type without one asks each time.
 */
export default function Defaults() {
    const application = useApplication()
    const space = useScale(useAppearance().spacing)
    const read = useRead(async () => {
        const [programs, defaults] = await Promise.all([application.programs(), application.openingDefaults()])
        return { programs, defaults }
    }, [], change => application.followPrograms(change))
    const [problem, setProblem] = useState<string | null>(null)
    // Defaults are not announced, so after changing one they are read again.
    const choosing = usePromise(async (type: string, program: Program | null) => {
        try {
            if (program === null) await application.clearOpeningDefault(type)
            else await application.setOpeningDefault(type, program)
            setProblem(null)
            read.retry()
        }
        catch (error) { setProblem(error instanceof Error ? error.message : "The default did not change."); throw error }
    })

    const programs = read.value?.programs ?? []
    const defaults = read.value?.defaults ?? {}
    const declared = programs.flatMap(entry => entry.definition.opens ?? [])
    // Only an exact type can have a default. A family such as image/* is listed with the Programs
    // that open it; each of its types gets a default when the owner chooses one as it opens.
    const types = [...new Set([...declared.filter(type => !type.endsWith("/*")), ...Object.keys(defaults)])].sort()
    const families = [...new Set(declared.filter(type => type.endsWith("/*")))].sort()
    const opener = (type: string) => programs.filter(entry => opensType(entry.definition.opens ?? [], type))

    return <>
        <SectionHeader title="Defaults" />
        <AppLayout.Content>
            <ReadView read={read}>{() => types.length + families.length === 0
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
                                    <Select.Item id={ask}>Ask each time</Select.Item>
                                    {opener(type).map(entry => <Select.Item key={entry.program.identity} id={entry.program.identity}>{entry.program.name}</Select.Item>)}
                                </Select>
                            </Table.Cell>
                        </Table.Row>)}
                        {families.map(family => <Table.Row key={family} id={family} textValue={family}>
                            <Table.Cell><span className="mono truncate">{family}</span></Table.Cell>
                            <Table.Cell><Text tone="secondary" size="small">{programs.filter(entry => entry.definition.opens?.includes(family)).map(entry => entry.program.name).join(", ")} · asks for each type once</Text></Table.Cell>
                        </Table.Row>)}
                    </Table.Body>
                </Table>}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={problem ?? "A type without a default asks each time it opens."} problem={problem !== null} />
    </>
}
