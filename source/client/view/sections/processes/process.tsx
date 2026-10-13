import { useState } from "react"
import { AppLayout, Button, Flex, Text, useAppearance, useScale } from "@phreshos/react-ui"
import { useApplication } from "../../application"
import Icon from "../../components/icon"
import { ReadView, useRead } from "../../components/read"
import Output from "../../components/output"
import { Group, Page, Row, SectionFooter, SectionHeader, Empty } from "../../components/section-parts"
import { useFrame } from "../../settings/frame"
import { ago } from "../overview"
import type { EndpointState } from "@client/core/application"
import { EndProcess, Side, heldServices } from "./parts"

type Details = NonNullable<Awaited<ReturnType<ReturnType<typeof useApplication>["process"]>>>

/** One live Process: where it came from, its two sides, and what it prints. */
export default function ProcessView({ identity }: Readonly<{ identity: string }>) {
    const application = useApplication()
    const read = useRead(() => application.process(identity), [identity], change => application.followProcess(identity, change))
    const [problem, setProblem] = useState<string | null>(null)
    const details = read.value ?? null
    const label = details ? details.process.name ?? details.process.identity : identity

    return <>
        <SectionHeader title={label} above={{ title: "Processes", address: "processes" }}>
            {details && <EndProcess process={details.process} onProblem={setProblem} />}
        </SectionHeader>
        <AppLayout.Content>
            <ReadView read={read}>{() => details
                ? <ProcessPage details={details} />
                : <Empty>This Process has ended.</Empty>}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={problem ?? (details ? `${details.program.name} · ${details.process.identity}` : "")} problem={problem !== null} />
    </>
}

function ProcessPage({ details }: Readonly<{ details: Details }>) {
    const { go } = useFrame()
    const space = useScale(useAppearance().spacing)
    const { process, program, parent, options, opened, installed, server, client, sandbox, window } = details
    const given = Object.entries(options)

    return <Page>
        <Flex align="center" gap="medium">
            <Icon of={program} size={space.xlarge * 2} />
            <Flex direction="column" style={{ flex: "1 1 auto", minWidth: 0 }}>
                <Text size="xlarge" truncate style={{ fontWeight: 600 }}>{process.name ?? process.identity}</Text>
                <Text tone="secondary" size="small">{program.name} · started {ago(process.startedAt.getTime())}</Text>
            </Flex>
        </Flex>

        <Group title="Process">
            <Row label="Program">
                {installed
                    ? <Button size="small" depth="none" onPress={() => go(`programs/${program.identity}`)}>{program.name}</Button>
                    : <Text tone="secondary">{program.name}</Text>}
            </Row>
            <Row label="Identity"><Text tone="secondary" size="small" className="mono">{process.identity}</Text></Row>
            <Row label="Started"><Text tone="secondary" size="small" className="tabular">{process.startedAt.toLocaleString()}</Text></Row>
            <Row label="Started by" description={parent ? "The Process that created this one." : "It was not started by another Process."}>
                {parent && <Button size="small" depth="none" onPress={() => go(`processes/${parent.identity}`)}>{parent.name ?? parent.identity}</Button>}
            </Row>
            {opened && <Row label="Opened" description={`What it was started to open: ${opened.type}.`}>
                <Text tone="secondary" size="small" className="mono" truncate title={opened.uri} style={{ maxWidth: "60%" }}>{opened.uri}</Text>
            </Row>}
            {!!given.length && <Row label="Options" description="The values it was started with.">
                <Flex direction="column" align="end">
                    {given.map(([name, value]) => <Text key={name} tone="secondary" size="small" className="mono">{name}={String(value)}</Text>)}
                </Flex>
            </Row>}
        </Group>

        {server && <Group title="Server">
            <Row label="State" description="Runs on this machine."><Side state={server} /></Row>
            <Row label="Service" description="The name other Programs reach it by."><Held state={server} /></Row>
        </Group>}
        {client && <Group title="Client">
            <Row label="State" description="Its Window on the Desktop."><Side state={client} /></Row>
            <Row label="Service" description="The name other Programs reach it by."><Held state={client} /></Row>
            <Row label="Sandbox" description={sandbox ? "Runs apart from the Desktop, in a browser sandbox." : "Runs without a browser sandbox."}>
                <Text tone="secondary" size="small">{sandbox ? "Yes" : "No"}</Text>
            </Row>
            {window && <Row label="Window" description="Where it is on the Desktop, and how it shows.">
                <Text tone="secondary" size="small">{[`${capitalize(window.layer)} layer`, window.minimized && "Minimized", window.maximized && "Maximized"].filter(Boolean).join(" · ")}</Text>
            </Row>}
        </Group>}

        <Output program={program} process={process.identity} description="What it prints, as it prints it." />
    </Page>
}

/** The Service name one side holds now, or None. */
function Held({ state }: Readonly<{ state: EndpointState }>) {
    const name = heldServices(state)
    return name ? <Text tone="secondary" size="small" className="mono">{name}</Text> : <Text tone="secondary" size="small">None</Text>
}

function capitalize(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1)
}
