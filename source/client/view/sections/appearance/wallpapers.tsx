import { useSystemAppearance, useProgramStore } from "@phreshos/react"
import { Button, FileTrigger, GridList, Text, useAppearance, useScale } from "@phreshos/react-ui"
import { ImageUp } from "@phreshos/react-ui/icons"
import usePromise from "@libs/react-promise"
import { useApplication } from "../../application"
import { Group } from "../../components/section-parts"
import meadowLight from "./wallpapers/meadow-light.svg"
import meadowDark from "./wallpapers/meadow-dark.svg"
import duneLight from "./wallpapers/dune-light.svg"
import duneDark from "./wallpapers/dune-dark.svg"
import tideLight from "./wallpapers/tide-light.svg"
import tideDark from "./wallpapers/tide-dark.svg"
import plainLight from "./wallpapers/plain-light.svg"
import plainDark from "./wallpapers/plain-dark.svg"

// Images, videos, and offline HTML documents can all be a wallpaper.
const accept = ["image/*", "video/mp4", "video/ogg", "video/webm", "text/html"]

type Pair = Readonly<{ light: string | null, dark: string | null }>
type Ready = Readonly<{ id: string, name: string, light: string, dark: string }>

/** The release's own wallpaper is no wallpaper at all: the Desktop draws it. */
const release = "sprout"

const ready: readonly Ready[] = [
    { id: "meadow", name: "Meadow", light: meadowLight, dark: meadowDark },
    { id: "dune", name: "Dune", light: duneLight, dark: duneDark },
    { id: "tide", name: "Tide", light: tideLight, dark: tideDark },
    { id: "plain", name: "Plain", light: plainLight, dark: plainDark }
]

/**
 * What stands behind the windows and the sign-in screen, in light and dark. A ready one is
 * uploaded to the System once, the first time it is chosen, and its addresses are kept to tell it
 * in use again; a file of the owner's own stands in both.
 */
export default function Wallpapers({ onProblem }: Readonly<{ onProblem: (problem: string | null) => void }>) {
    const application = useApplication()
    const appearance = useSystemAppearance()
    const space = useScale(useAppearance().spacing)
    const [uploaded, setUploaded] = useProgramStore<Readonly<Record<string, Pair>>>("wallpapers", {})
    const current: Pair = { light: appearance.desktopWallpaper.light ?? null, dark: appearance.desktopWallpaper.dark ?? null }
    const inUse = current.light === null && current.dark === null ? release
        : ready.find(paper => uploaded?.[paper.id]?.light === current.light && uploaded?.[paper.id]?.dark === current.dark)?.id ?? null

    const choosing = usePromise(async (pair: Pair) => {
        try {
            await application.updateAppearance({ desktopWallpaper: pair, signInWallpaper: pair })
            onProblem(null)
        } catch (error) { onProblem(error instanceof Error ? error.message : "The wallpaper could not be applied."); throw error }
    })

    async function choose(id: string) {
        if (id === release) return choosing.safeExecute({ light: null, dark: null })
        const paper = ready.find(entry => entry.id === id)!
        let pair = uploaded?.[id]
        if (!pair) {
            const [light, dark] = await Promise.all([
                application.uploadAsset(paper.light, `${id}-light.svg`),
                application.uploadAsset(paper.dark, `${id}-dark.svg`)
            ])
            pair = { light, dark }
            await setUploaded(previous => ({ ...previous, [id]: pair! }))
        }
        return choosing.safeExecute(pair)
    }

    async function own(files: File[]) {
        const [file] = files
        if (!file) return
        const address = await application.upload(file)
        await choosing.safeExecute({ light: address, dark: address })
    }

    return <Group title="Wallpaper" description={inUse === null ? "A file of your own is in use, light and dark." : "Light and dark, behind the windows and the sign-in screen."}
        aside={<FileTrigger accept={accept} onSelect={files => void own(files)}><Button size="small" pending={choosing.isPending}><ImageUp />Your own…</Button></FileTrigger>}>
        <GridList aria-label="Wallpapers" selectionMode="single" itemWidth={space.xlarge * 6} value={inUse} style={{ padding: space.small }}
            onChange={id => { if (id) void choose(id) }}>
            <GridList.Item id={release} textValue="Sprout">
                <div aria-hidden="true" style={{ display: "grid", placeItems: "center", height: "3.5rem", borderRadius: "0.5rem", background: "color-mix(in oklab, currentColor 6%, transparent)" }}>
                    <Text size="xsmall" tone="secondary">The release's own</Text>
                </div>
                <Text size="small" style={{ fontWeight: 600 }}>Sprout</Text>
            </GridList.Item>
            {ready.map(paper => <GridList.Item key={paper.id} id={paper.id} textValue={paper.name}>
                <div aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "3.5rem", borderRadius: "0.5rem", overflow: "hidden" }}>
                    <img src={paper.light} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <img src={paper.dark} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <Text size="small" style={{ fontWeight: 600 }}>{paper.name}</Text>
            </GridList.Item>)}
        </GridList>
    </Group>
}
