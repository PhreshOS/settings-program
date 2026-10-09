import { useState, type FormEvent } from "react"
import { AlertDialog, AppLayout, Badge, Button, Input, Table, Text, useAppearance, useScale, ScrollArea } from "@phreshos/react-ui"
import usePromise from "@libs/react-promise"
import { useApplication } from "../application"
import { ReadView, useRead } from "../components/read"
import { useControls } from "../components/controls"
import { Fields, Group, Page, SectionFooter, SectionHeader } from "../components/section-parts"
import { ago } from "./overview"
import { count } from "./programs/programs"

/**
 * How the owner signs in, and who is signed in: the credentials, the Sessions they made, and the
 * browsers connected now. They belong together, as `system.authentication` holds them together.
 */
export default function Authentication() {
    const application = useApplication()
    const space = useScale(useAppearance().spacing)
    const read = useRead(async () => {
        const [owner, sessions, connections] = await Promise.all([application.authentication(), application.sessions(), application.connections()])
        return { ...owner, ...sessions, connections }
    }, [], change => application.followSessions(change))
    const [problem, setProblem] = useState<string | null>(null)
    const { busy, run } = useControls(error => setProblem(error instanceof Error ? error.message : "The change did not apply."), () => setProblem(null))
    const sessions = read.value?.sessions ?? []
    const connections = read.value?.connections ?? []

    return <>
        <SectionHeader title="Authentication">
            <AlertDialog>
                <AlertDialog.Trigger size="small" color="danger" disabled={!sessions.length} pending={busy("everywhere")}>Sign out everywhere</AlertDialog.Trigger>
                <AlertDialog.Backdrop>
                    <AlertDialog.Content>
                        <AlertDialog.Header>
                            <AlertDialog.Title>Sign out of every Session?</AlertDialog.Title>
                            <AlertDialog.Description>Every browser signs in again, this one too.</AlertDialog.Description>
                        </AlertDialog.Header>
                        <AlertDialog.Footer>
                            <AlertDialog.Close>Cancel</AlertDialog.Close>
                            <AlertDialog.Close color="danger" onPress={() => run("everywhere", () => application.signOutAllSessions())}>Sign out everywhere</AlertDialog.Close>
                        </AlertDialog.Footer>
                    </AlertDialog.Content>
                </AlertDialog.Backdrop>
            </AlertDialog>
        </SectionHeader>
        <AppLayout.Content>
            <ReadView read={read}>{value => <Page wide>
                <Credentials state={value.state} requirements={value.requirements} onChanged={() => { setProblem(null); read.retry() }} onProblem={setProblem} />
                <Group title="Connections" description="The browsers connected now, signed in or not.">
                    <ScrollArea axis="horizontal"><Table aria-label="Connections" size="small">
                        <Table.Header>
                            <Table.Column id="device" rowHeader minWidth={space.xlarge * 4}>Browser</Table.Column>
                            <Table.Column id="connected" width={space.xlarge * 4}>Connected</Table.Column>
                            <Table.Column id="session" width={space.xlarge * 3.5}>Signed in</Table.Column>
                            <Table.Column id="admit" width={space.xlarge * 3.5}> </Table.Column>
                        </Table.Header>
                        <Table.Body>
                            {connections.map(({ connection, session }) => <Table.Row key={connection.identity} id={connection.identity} textValue={connection.device ?? connection.identity}>
                                <Table.Cell>{connection.device ?? "Unknown browser"}</Table.Cell>
                                <Table.Cell><Text tone="secondary" className="tabular">{ago(connection.connectedAt.getTime())}</Text></Table.Cell>
                                <Table.Cell><Text tone="secondary">{session ? "Yes" : "No"}</Text></Table.Cell>
                                <Table.Cell>{!session && <Button size="xsmall" depth="none" color="success" disabled={busy(connection.identity)} onPress={() => run(connection.identity, () => application.signInConnection(connection))}>Sign in</Button>}</Table.Cell>
                            </Table.Row>)}
                        </Table.Body>
                    </Table></ScrollArea>
                </Group>
                <Group title="Sessions" description="Each sign-in. It stays valid while a browser uses it, and for a day after the last one leaves.">
                    <ScrollArea axis="horizontal"><Table aria-label="Sessions" size="small">
                        <Table.Header>
                            <Table.Column id="device" rowHeader minWidth={space.xlarge * 4}>Signed in from</Table.Column>
                            <Table.Column id="signed-in" width={space.xlarge * 4.5}>Signed in</Table.Column>
                            <Table.Column id="active" width={space.xlarge * 4}>Last active</Table.Column>
                            <Table.Column id="browsers" width={space.xlarge * 3.5}>Browsers</Table.Column>
                            <Table.Column id="end" width={space.xlarge * 3.5}> </Table.Column>
                        </Table.Header>
                        <Table.Body>
                            {sessions.map(({ session, connections, lastActiveAt }) => <Table.Row key={session.identity} id={session.identity} textValue={session.device ?? session.identity}>
                                <Table.Cell>
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                                        <Text truncate>{session.device ?? "Unknown browser"}</Text>
                                        {session.identity === value.current && <Badge size="xsmall" color="success">This browser</Badge>}
                                    </span>
                                </Table.Cell>
                                <Table.Cell><Text tone="secondary" className="tabular">{session.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</Text></Table.Cell>
                                <Table.Cell><Text tone="secondary" className="tabular">{connections.length ? "Now" : lastActiveAt ? ago(lastActiveAt.getTime()) : "—"}</Text></Table.Cell>
                                <Table.Cell><Text tone="secondary" className="tabular">{connections.length || "None"}</Text></Table.Cell>
                                <Table.Cell><Button size="xsmall" depth="none" color="danger" disabled={busy(session.identity)} onPress={() => run(session.identity, () => application.signOut(session))}>Sign out</Button></Table.Cell>
                            </Table.Row>)}
                        </Table.Body>
                    </Table></ScrollArea>
                </Group>
            </Page>}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={problem ?? (read.value ? `Signed in as ${read.value.state.username ?? "the owner"} · ${count(sessions.length, "Session")} · ${count(connections.length, "browser")} connected` : "")} problem={problem !== null} />
    </>
}

/** A new username or password replaces both; every Session stays signed in. */
function Credentials({ state, requirements, onChanged, onProblem }: Readonly<{
    state: Awaited<ReturnType<ReturnType<typeof useApplication>["authentication"]>>["state"]
    requirements: Awaited<ReturnType<ReturnType<typeof useApplication>["authentication"]>>["requirements"]
    onChanged: () => void
    onProblem: (problem: string | null) => void
}>) {
    const application = useApplication()
    const space = useScale(useAppearance().spacing)
    const [username, setUsername] = useState<string | null>(null)
    const [password, setPassword] = useState("")
    const [repeated, setRepeated] = useState("")
    const saving = usePromise(async (credentials: Readonly<{ username: string, password: string }>) => {
        try {
            await application.setCredentials(credentials)
            setPassword("")
            setRepeated("")
            onChanged()
        } catch (error) { onProblem(error instanceof Error ? `Could not change. ${error.message}` : "Could not change."); throw error }
    })
    const name = username ?? state.username ?? ""
    const characters = (count: number) => `${count} ${count === 1 ? "character" : "characters"}`
    // A field says what it lacks once something is typed in it, not before.
    const problem = repeated && password !== repeated ? "The passwords differ."
        : password && password.length < requirements.password.minimumLength ? `A password needs at least ${characters(requirements.password.minimumLength)}.`
        : (username !== null || password) && name.length < requirements.username.minimumLength ? `A username needs at least ${characters(requirements.username.minimumLength)}.`
        : null

    function submit(event: FormEvent) {
        event.preventDefault()
        if (problem || !password) return
        void saving.safeExecute({ username: name, password })
    }

    return <form onSubmit={submit}>
        <Group title="Credentials" description="What you sign in with on every browser. Sessions already signed in stay signed in.">
            <Fields>
                <Input label="Username" autoComplete="username" value={name} onChange={setUsername} maxLength={requirements.username.maximumLength} />
            </Fields>
            <Fields>
                <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={setPassword} maxLength={requirements.password.maximumLength} />
                <Input label="Repeat the password" type="password" autoComplete="new-password" value={repeated} onChange={setRepeated} maxLength={requirements.password.maximumLength} />
            </Fields>
            <div style={{ display: "flex", alignItems: "center", gap: space.medium, padding: `0 ${space.medium}px ${space.medium}px` }}>
                <Text size="small" tone="secondary" style={{ flex: "1 1 auto" }}>{problem ?? "Both are replaced together."}</Text>
                <Button type="submit" size="small" color="primary" pending={saving.isPending} disabled={!!problem || !password || password !== repeated}>Change</Button>
            </div>
        </Group>
    </form>
}
