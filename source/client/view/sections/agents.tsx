import { AppLayout, Code, Flex, GridList, Snippet, Text, useAppearance, useScale } from "@phreshos/react-ui"
import { useApplication } from "../application"
import Icon from "../components/icon"
import { ReadView, useRead } from "../components/read"
import { Group, Page, SectionFooter, SectionHeader } from "../components/section-parts"
import { useFrame } from "../settings/frame"

/** What an agent is told before it starts: one command, which points to everything else. */
const instruction = "Before you work in PhreshOS, run `phresh skill` and follow what it says."

/**
 * How to let an agent work in PhreshOS: any agent that runs commands on this machine uses it through
 * `phresh`, as the owner does, once it has read what `phresh skill` explains.
 */
export default function Agents() {
    const application = useApplication()
    const { go } = useFrame()
    const space = useScale(useAppearance().spacing)
    // The Programs that explain themselves to agents, as they are installed and removed.
    const programs = useRead(() => application.programs(), [], change => application.followPrograms(change))

    return <>
        <SectionHeader title="Agents" />
        <AppLayout.Content>
            <Page>
                <Text tone="secondary">
                    Any agent that can run commands on this machine, such as a coding assistant in a terminal,
                    can work in PhreshOS beside you: open Programs, read their logs, move Windows, install
                    and update. It uses the same command line you do.
                </Text>

                <Group title="Tell your agent where to start" description="In your message, or in the instructions file it reads, such as AGENTS.md or CLAUDE.md.">
                    <Flex direction="column" gap="small" style={{ padding: space.medium }}>
                        <Snippet copyLabel="Copy the instruction">{instruction}</Snippet>
                        <Text size="small" tone="secondary">
                            <Code>phresh skill</Code> explains what PhreshOS is, how its commands work, and where
                            to look next. Every command also explains itself with <Code>--help</Code>.
                        </Text>
                    </Flex>
                </Group>

                <Group title="Programs it can use" description="Each explains itself to agents: what it does and how to use it.">
                    <ReadView read={programs}>{all => {
                        const usable = all.filter(({ program }) => program.hasAgent)
                        return usable.length === 0
                            ? <Text size="small" tone="secondary" style={{ padding: space.medium }}>No installed Program explains itself to agents yet.</Text>
                            : <div style={{ padding: space.medium }}>
                                <GridList aria-label="Programs agents can use" selectionMode="none" itemWidth={space.xlarge * 5}
                                    onAction={identity => go(`programs/${String(identity)}`)}>
                                    {usable.map(({ program }) => <GridList.Item key={program.identity} id={program.identity} textValue={program.name}>
                                        <Flex align="center" gap="small" style={{ minWidth: 0 }}>
                                            <Icon of={program} size={space.medium * 1.5} />
                                            <Text truncate>{program.name}</Text>
                                        </Flex>
                                    </GridList.Item>)}
                                </GridList>
                            </div>
                    }}</ReadView>
                </Group>

                <Group title="What it may do" description="It works as you.">
                    <Text size="small" tone="secondary" style={{ padding: space.medium }}>
                        The command line acts with your full authority, so an agent can do anything you can
                        do here. It is told to read before it changes something, and to ask you before
                        anything that cannot be undone, such as removing a Program or deleting data.
                    </Text>
                </Group>
            </Page>
        </AppLayout.Content>
        <SectionFooter status="One command line for you and your agents" />
    </>
}
