import { useState } from "react"
import { useSystemAppearance } from "@phreshos/react"
import { AlertDialog, AppLayout, Button, Flex, GridList, Text, useAppearance, useScale } from "@phreshos/react-ui"
import { Plus } from "@phreshos/react-ui/icons"
import usePromise from "@libs/react-promise"
import { lookOf, readyAppearances, sameLook, type AppearanceEntry } from "@client/core/appearances"
import { useApplication } from "../../application"
import { useArrival } from "../../components/arrival"
import { Page, SectionFooter, SectionHeader } from "../../components/section-parts"
import { useFrame } from "../../settings/frame"
import { PreviewPair } from "./preview"
import { useLibrary } from "./library"
import SaveDialog from "./save-dialog"
import Customize from "./customize"

const current = "current"
const create = "new"

/**
 * The System's Appearance, chosen whole: its colors, shape, surfaces, motion, and Taskbar together.
 * Its wallpapers are left as they are. The ready ones come with Settings, then the owner's own;
 * choosing one applies it at once. When the Appearance in use is none of them, it stands as the
 * current one, to save. A new one starts in Customize, at `customize`.
 */
export default function Appearance({ rest }: Readonly<{ rest: string | null }>) {
    return rest === "customize" ? <Customize /> : <Gallery />
}

type Entry = AppearanceEntry & Readonly<{ key: string, removable: boolean }>

function Gallery() {
    const application = useApplication()
    const library = useLibrary()
    const appearance = useSystemAppearance()
    const { go } = useFrame()
    const space = useScale(useAppearance().spacing)
    const [problem, setProblem] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    useArrival(library.loaded)

    const entries: Entry[] = [
        ...readyAppearances.map(entry => ({ ...entry, key: `ready:${entry.id}`, removable: false })),
        ...library.saved.map(entry => ({ ...entry, key: `saved:${entry.id}`, removable: true }))
    ]
    const look = lookOf(appearance)
    const inUse = entries.find(entry => sameLook(entry.look, look)) ?? null

    const applying = usePromise(async (key: string) => {
        try {
            // The look alone: what is left out, the wallpapers, stays as it is.
            await application.updateAppearance(entries.find(entry => entry.key === key)!.look)
            setProblem(null)
        } catch (error) { setProblem(error instanceof Error ? error.message : "The Appearance could not be applied."); throw error }
    })

    return <>
        <SectionHeader title="Appearance">
            <Text size="small" tone="secondary">For every Desktop of this System</Text>
        </SectionHeader>
        <AppLayout.Content>
            <Page wide>
                <GridList aria-label="Appearances" selectionMode="single" restColor="primary:subtle" itemWidth={space.xlarge * 7} style={{ alignContent: "start", outline: "none" }} value={inUse?.key ?? current}
                    onChange={key => {
                        if (key === create) go("appearance/customize")
                        else if (key && key !== current) void applying.safeExecute(key)
                    }}>
                    {entries.map(entry => <GridList.Item key={entry.key} id={entry.key} textValue={entry.name}>
                        <PreviewPair look={entry.look} />
                        <Flex align="center" gap="small">
                            <Text size="small" style={{ fontWeight: 600, flex: "1 1 auto" }}>{entry.name}</Text>
                            {entry.removable && <Remove name={entry.name} onRemove={() => void library.remove(entry.id)} />}
                        </Flex>
                        <Text size="xsmall" tone="secondary">{entry.description}</Text>
                    </GridList.Item>)}
                    {inUse === null && <GridList.Item id={current} textValue="Current">
                        <PreviewPair look={appearance} />
                        <Flex align="center" gap="small">
                            <Text size="small" style={{ fontWeight: 600, flex: "1 1 auto" }}>Current</Text>
                            <Button size="xsmall" color="primary" onPress={() => setSaving(true)}>Save</Button>
                        </Flex>
                        <Text size="xsmall" tone="secondary">In use, not saved</Text>
                    </GridList.Item>}
                    <GridList.Item id={create} textValue="New Appearance">
                        <Flex direction="column" align="center" justify="center" gap="xsmall" style={{
                            minHeight: "6.5rem", borderRadius: "0.5rem",
                            border: "1.5px dashed color-mix(in oklab, currentColor 28%, transparent)"
                        }}>
                            <Plus />
                            <Text size="small" style={{ fontWeight: 600 }}>New</Text>
                            <Text size="xsmall" tone="secondary">From the one in use</Text>
                        </Flex>
                    </GridList.Item>
                </GridList>
            </Page>
        </AppLayout.Content>
        <SectionFooter status={problem ?? (inUse ? `${inUse.name} is in use` : "An Appearance of your own is in use")} problem={problem !== null} />
        <SaveDialog open={saving} onClose={() => setSaving(false)} onSave={name => void library.save(name, look)} />
    </>
}

/** Removes one of the owner's own Appearances after asking. */
function Remove({ name, onRemove }: Readonly<{ name: string, onRemove: () => void }>) {
    return <AlertDialog>
        <AlertDialog.Trigger size="xsmall">Delete</AlertDialog.Trigger>
        <AlertDialog.Backdrop>
            <AlertDialog.Content>
                <AlertDialog.Header>
                    <AlertDialog.Title>Delete {name}?</AlertDialog.Title>
                    <AlertDialog.Description>The Appearance in use stays as it is.</AlertDialog.Description>
                </AlertDialog.Header>
                <AlertDialog.Footer>
                    <AlertDialog.Close>Cancel</AlertDialog.Close>
                    <AlertDialog.Close color="danger" onPress={onRemove}>Delete</AlertDialog.Close>
                </AlertDialog.Footer>
            </AlertDialog.Content>
        </AlertDialog.Backdrop>
    </AlertDialog>
}

