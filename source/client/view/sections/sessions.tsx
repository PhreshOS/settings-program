import { useState } from "react"
import type { Session } from "@phreshos/core"
import { AlertDialog, AppLayout, Badge, Button, Table, Text, useAppearance, useScale } from "@phreshos/react-ui"
import usePromise from "@libs/react-promise"
import { useApplication } from "../application"
import { ReadView, useRead } from "../components/read"
import { SectionFooter, SectionHeader } from "../components/section-parts"
import { count } from "./programs/programs"

/** The Sessions signed in to this System, with the browsers they carry, and the way to end them. */
export default function Sessions() {
    const application = useApplication()
    const space = useScale(useAppearance().spacing)
    const read = useRead(() => application.sessions(), [], change => application.followSessions(change))
    const [problem, setProblem] = useState<string | null>(null)
    const ending = usePromise(async (session: Session | null) => {
        try { await (session ? application.signOut(session) : application.signOutAllSessions()); setProblem(null) }
        catch (error) { setProblem(error instanceof Error ? error.message : "It could not sign out."); throw error }
    })
    const sessions = read.value?.sessions ?? []
    const connections = sessions.reduce((total, entry) => total + entry.connections.length, 0)

    return <>
        <SectionHeader title="Sessions">
            <AlertDialog>
                <AlertDialog.Trigger size="small" color="danger" disabled={!sessions.length} pending={ending.isPending}>Sign out everywhere</AlertDialog.Trigger>
                <AlertDialog.Backdrop>
                    <AlertDialog.Content>
                        <AlertDialog.Header>
                            <AlertDialog.Title>Sign out of every Session?</AlertDialog.Title>
                            <AlertDialog.Description>Every browser signs in again, this one too.</AlertDialog.Description>
                        </AlertDialog.Header>
                        <AlertDialog.Footer>
                            <AlertDialog.Close>Cancel</AlertDialog.Close>
                            <AlertDialog.Close color="danger" onPress={() => void ending.safeExecute(null)}>Sign out everywhere</AlertDialog.Close>
                        </AlertDialog.Footer>
                    </AlertDialog.Content>
                </AlertDialog.Backdrop>
            </AlertDialog>
        </SectionHeader>
        <AppLayout.Content>
            <ReadView read={read}>{({ current }) => <Table aria-label="Sessions" size="small" style={{ minWidth: 0, tableLayout: "fixed" }}>
                <Table.Header>
                    <Table.Column id="session" rowHeader>Session</Table.Column>
                    <Table.Column id="connections" style={{ width: space.xlarge * 6 }}>Browsers connected</Table.Column>
                    <Table.Column id="end" style={{ width: space.xlarge * 5 }}> </Table.Column>
                </Table.Header>
                <Table.Body>
                    {sessions.map(({ session, connections }) => <Table.Row key={session.identity} id={session.identity} textValue={session.identity}>
                        <Table.Cell>
                            <span style={{ display: "flex", alignItems: "center", gap: space.small, minWidth: 0 }}>
                                <span className="mono truncate">{session.identity}</span>
                                {session.identity === current && <Badge size="xsmall" color="success">This browser</Badge>}
                            </span>
                        </Table.Cell>
                        <Table.Cell><Text tone="secondary" className="tabular">{connections.length || "None"}</Text></Table.Cell>
                        <Table.Cell><Button size="xsmall" disabled={ending.isPending} onPress={() => void ending.safeExecute(session)}>Sign out</Button></Table.Cell>
                    </Table.Row>)}
                </Table.Body>
            </Table>}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={problem ?? (read.value ? `${count(sessions.length, "Session")} · ${count(connections, "browser")} connected` : "")} problem={problem !== null} />
    </>
}
