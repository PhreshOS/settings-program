import { useState } from "react"
import { useSystemAppearance } from "@phreshos/react"
import { AlertDialog, AppLayout, Button, Flex, GridList, Text, useAppearance, useScale } from "@phreshos/react-ui"
import { Plus } from "@phreshos/react-ui/icons"
import usePromise from "@libs/react-promise"
import { readyAppearances, sameAppearance, type AppearanceEntry } from "@client/core/appearances"
import { usePictures } from "./pictures"
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
 * The System's Appearance, chosen whole: its colors, shape, material, shadow, motion, Taskbar, and
 * wallpapers. The ready ones come with Settings, then the owner's own;
 * choosing one applies it at once. When the Appearance in use is none of them, it stands as the
 * current one, to save. A new one starts in Customize, at `customize`; one of the owner's is
 * changed there too, at `customize/<id>`.
 */
export default function Appearance({ rest }: Readonly<{ rest: string | null }>) {
    if (rest === "customize") return <Customize />
    if (rest?.startsWith("customize/")) return <Customize editing={rest.slice("customize/".length)} />
    return <Gallery />
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
    const pictures = usePictures()
    useArrival(library.loaded && pictures.loaded)

    const entries: Entry[] = [
        ...readyAppearances.map(entry => ({ ...entry, key: `ready:${entry.id}`, removable: false })),
        ...library.saved.map(entry => ({ ...entry, key: `saved:${entry.id}`, removable: true }))
    ]
    const inUse = entries.find(entry => sameAppearance(pictures.known(entry), appearance)) ?? null

    const applying = usePromise(async (key: string) => {
        try {
            await application.updateAppearance(await pictures.resolve(entries.find(entry => entry.key === key)!))
            setProblem(null)
        } catch (error) { setProblem(error instanceof Error ? error.message : "The Appearance could not be applied."); throw error }
    })

    return <>
        <SectionHeader title="Appearance">
            <Text size="small" tone="secondary">For every Desktop of this System</Text>
        </SectionHeader>
        <AppLayout.Content>
            <Page wide>
                <GridList aria-label="Appearances" selectionMode="single" itemWidth={space.xlarge * 8} style={{ alignContent: "start", outline: "none" }} value={inUse?.key ?? current}
                    onChange={key => {
                        if (key === create) go("appearance/customize")
                        else if (key && key !== current) void applying.safeExecute(key)
                    }}>
                    {entries.map(entry => <GridList.Item key={entry.key} id={entry.key} textValue={entry.name}>
                        <PreviewPair look={entry.appearance} pictures={entry.pictures} />
                        <Text size="small" style={{ fontWeight: 600 }}>{entry.name}</Text>
                        {/* A ready one says what it is like; one of the owner's own offers what can be done with it. */}
                        {entry.removable
                            ? <Flex gap="small">
                                <Button size="xsmall" color="secondary:soft" onPress={() => void applying.safeExecute(entry.key).then(() => go(`appearance/customize/${entry.id}`))}>Edit</Button>
                                <Remove name={entry.name} onRemove={() => void library.remove(entry.id)} />
                            </Flex>
                            : <Text size="xsmall" tone="secondary">{entry.description}</Text>}
                    </GridList.Item>)}
                    {inUse === null && <GridList.Item id={current} textValue="Current">
                        <PreviewPair look={appearance} />
                        <Text size="small" style={{ fontWeight: 600 }}>Current</Text>
                        {/* In use and not saved: what can be done with it stands where a description would. */}
                        <Flex gap="small">
                            <Button size="xsmall" color="primary" onPress={() => setSaving(true)}>Save</Button>
                        </Flex>
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
        <SaveDialog open={saving} onClose={() => setSaving(false)} onSave={name => void library.save(name, appearance)} />
    </>
}

/** Removes one of the owner's own Appearances after asking. */
function Remove({ name, onRemove }: Readonly<{ name: string, onRemove: () => void }>) {
    return <AlertDialog>
        <AlertDialog.Trigger size="xsmall" color="danger:soft">Delete</AlertDialog.Trigger>
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

