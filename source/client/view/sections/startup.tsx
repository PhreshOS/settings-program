import { useState } from "react"
import { AppLayout, Button, Flex, Text, useAppearance, useScale } from "@phreshos/react-ui"
import { useControls } from "../components/controls"
import { useApplication } from "../application"
import Icon from "../components/icon"
import { ReadView, useRead } from "../components/read"
import { Group, Page, Row, SectionFooter, SectionHeader } from "../components/section-parts"
import { count } from "./programs/programs"

/**
 * Everything that starts with the System, one launch per Program. A Program sets its own; the owner
 * removes it here, which keeps nothing: to have it again, the Program sets it again.
 */
export default function Startup() {
    const application = useApplication()
    const space = useScale(useAppearance().spacing)
    const programs = useRead(() => application.programs(), [], change => application.followPrograms(change))
    const [problem, setProblem] = useState<string | null>(null)
    const { busy, run } = useControls(error => setProblem(error instanceof Error ? error.message : "It could not be removed."), () => setProblem(null))
    const starting = (programs.value ?? []).filter(entry => entry.startup !== null)

    return <>
        <SectionHeader title="Startup" />
        <AppLayout.Content>
            <ReadView read={programs}>{() => <Page>
                <Group title="Starts with the System" description="Each one starts what its Program set, every time the System starts.">
                    {starting.length === 0 && <Row label="Nothing" description="No Program starts with the System." />}
                    {starting.map(details => <Row key={details.program.identity} label={<Flex align="center" gap="small">
                        <Icon of={details.program} size={space.large} />
                        {details.program.name}
                    </Flex>} description={details.startup?.name ? `Starts “${details.startup.name}”.` : "Starts its default launch."}>
                        <Button size="small" aria-label={`Remove ${details.program.name}'s startup`} disabled={busy(details.program.identity)}
                            onPress={() => run(details.program.identity, () => application.removeStartup(details.program))}>Remove</Button>
                    </Row>)}
                </Group>
                <Text size="small" tone="secondary">A Program sets this itself, such as the Files panel; any Program's own page can also start its default launch with the System.</Text>
            </Page>}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={problem ?? (programs.value ? `${count(starting.length, "Program")} start${starting.length === 1 ? "s" : ""} with the System` : "")} problem={problem !== null} />
    </>
}
