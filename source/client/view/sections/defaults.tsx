import { useState } from "react"
import { opensType, type Program } from "@phreshos/core"
import { AppLayout, Select, Text, useAppearance, useScale } from "@phreshos/react-ui"
import { useControls } from "../components/controls"
import { useApplication } from "../application"
import { ReadView, useRead } from "../components/read"
import { Empty, Group, Page, Row, SectionFooter, SectionHeader } from "../components/section-parts"
import { count } from "./programs/programs"

/** Asks each time: a type without a default Program. */
const ask = "ask"

/** The family a type belongs to, such as `image/*` for `image/png`. */
function family(type: string) {
    return `${type.slice(0, type.indexOf("/"))}/*`
}

/** A type as a person names it, such as Folders for inode/directory; its exact type shows beneath. */
function name(type: string) {
    if (type === "inode/directory") return "Folders"
    const [top, sub] = type.split("/") as [string, string]
    if (top === "x-scheme-handler") return sub === "*" ? "Every kind of link" : `${sub}: links`
    if (sub === "*") return `Every ${top} type`
    return type
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

    const chosen = types.filter(type => defaults[type] !== undefined).length

    return <>
        <SectionHeader title="Defaults" />
        <AppLayout.Content>
            <ReadView read={read}>{() => types.length === 0
                ? <Empty>No installed Program opens a type of its own yet.</Empty>
                : <Page>
                    <Group title="Opens by default" description="Each kind of file or link opens with the Program chosen here.">
                        {types.map(type => <Row key={type} label={name(type)} description={type}>
                            <Select aria-label={`Opens ${type} with`} size="small" value={defaults[type]?.identity ?? ask} disabled={busy(type)}
                                style={{ width: space.xlarge * 7, flexShrink: 0 }}
                                onChange={value => {
                                    if (value === null) return
                                    const chosen = value === ask ? null : opener(type).find(program => program.identity === value)
                                    if (chosen !== undefined) choose(type, chosen)
                                }}>
                                <Select.Item id={ask}>{fallback(type)}</Select.Item>
                                {opener(type).map(program => <Select.Item key={program.identity} id={program.identity}>{program.name}</Select.Item>)}
                            </Select>
                        </Row>)}
                    </Group>
                    <Text size="small" tone="secondary">A type without a default uses its family's, such as image/* for image/png, or asks each time it opens.</Text>
                </Page>}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={problem ?? (read.value ? `${count(chosen, "type")} ${chosen === 1 ? "has" : "have"} a default` : "")} problem={problem !== null} />
    </>
}
