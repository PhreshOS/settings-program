import { useState, type FormEvent } from "react"
import { AppLayout, Button, Input, Text } from "@phreshos/react-ui"
import usePromise from "@libs/react-promise"
import { useApplication } from "../application"
import { ReadView, useRead } from "../components/read"
import { Fields, Group, Page, SectionFooter, SectionHeader } from "../components/section-parts"

/** The owner's sign-in: a new username or password replaces both, and every Session stays signed in. */
export default function SignIn() {
    const application = useApplication()
    const read = useRead(() => application.authentication(), [])
    const [username, setUsername] = useState<string | null>(null)
    const [password, setPassword] = useState("")
    const [repeated, setRepeated] = useState("")
    const saving = usePromise(async (credentials: Readonly<{ username: string, password: string }>) => {
        await application.setCredentials(credentials)
        setPassword("")
        setRepeated("")
        read.retry()
    })

    return <>
        <SectionHeader title="Sign-in" />
        <AppLayout.Content>
            <ReadView read={read}>{({ state, requirements }) => {
                const name = username ?? state.username ?? ""
                const problem = repeated && password !== repeated ? "The passwords differ."
                    : password && password.length < requirements.password.minimumLength ? `A password needs at least ${requirements.password.minimumLength} characters.`
                    : name.length < requirements.username.minimumLength ? `A username needs at least ${requirements.username.minimumLength} characters.`
                    : null

                function submit(event: FormEvent) {
                    event.preventDefault()
                    if (problem || !password) return
                    void saving.safeExecute({ username: name, password })
                }

                return <Page>
                    <form onSubmit={submit}>
                        <Group title="Credentials" description="What you sign in with on every browser. Sessions already signed in stay signed in.">
                            <Fields>
                                <Input label="Username" autoComplete="username" value={name} onChange={setUsername}
                                    maxLength={requirements.username.maximumLength} />
                            </Fields>
                            <Fields>
                                <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={setPassword}
                                    maxLength={requirements.password.maximumLength} />
                                <Input label="Repeat the password" type="password" autoComplete="new-password" value={repeated} onChange={setRepeated}
                                    maxLength={requirements.password.maximumLength} />
                            </Fields>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0 0.75rem 0.75rem" }}>
                                <Text size="small" tone="secondary" style={{ flex: "1 1 auto" }}>{problem ?? "Both are replaced together."}</Text>
                                <Button type="submit" size="small" color="primary" pending={saving.isPending} disabled={!!problem || !password || password !== repeated}>Change</Button>
                            </div>
                        </Group>
                    </form>
                </Page>
            }}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={saving.exception ? `Could not change. ${saving.exception.current instanceof Error ? saving.exception.current.message : ""}` : saving.solve ? "Changed" : read.value ? `Signed in as ${read.value.state.username ?? "the owner"}` : ""}
            problem={saving.exception !== undefined} />
    </>
}
