import type { Theme } from "@phreshos/core"
import { Button, DropZone, Fieldset, FileTrigger, Flex, Grid } from "@phreshos/react-ui"
import { ImageUp, X } from "@phreshos/react-ui/icons"
import usePromise from "@libs/react-promise"
import { useApplication } from "../../../application"
import ErrorAlert from "../../../components/error-alert"
import Page from "../../../components/page"
import { useAppearanceDraft } from "../draft"

// Images, videos, and offline HTML documents can all be a wallpaper.
const accept = ["image/*", "video/mp4", "video/ogg", "video/webm", "text/html"] as const

type Slot = "signInWallpaper" | "desktopWallpaper"

/** The wallpaper behind the sign-in screen and the desktop, for each theme. */
export default function Wallpapers() {
    return <Page>
        <WallpaperSlot slot="signInWallpaper" title="Sign-in screen" />
        <WallpaperSlot slot="desktopWallpaper" title="Desktop" />
    </Page>
}

function WallpaperSlot({ slot, title }: Readonly<{ slot: Slot, title: string }>) {
    return <Fieldset title={title}>
        <Grid columns="repeat(auto-fit, minmax(min(14rem, 100%), 1fr))" gap="medium">
            <Wallpaper slot={slot} theme="light" />
            <Wallpaper slot={slot} theme="dark" />
        </Grid>
    </Fieldset>
}

function Wallpaper({ slot, theme }: Readonly<{ slot: Slot, theme: Theme }>) {
    const application = useApplication()
    const { draft, change } = useAppearanceDraft()
    const value = draft[slot][theme]
    const uploading = usePromise((file: File) => application.upload(file))
    const name = theme === "light" ? "Light theme" : "Dark theme"

    async function choose(files: File[]) {
        const [file] = files
        if (!file) return
        const key = await uploading.safeExecute(file)
        if (key) change(slot, { ...draft[slot], [theme]: key })
    }

    return <Flex direction="column" gap="small">
        <DropZone aria-label={`${name} wallpaper`} accept={accept} disabled={uploading.isPending} onDrop={files => void choose(files)}>
            <ImageUp size={24} />
            <span style={{ fontSize: "0.8125em" }}>{name}</span>
            <span style={{ fontSize: "0.75em", opacity: 0.66, overflowWrap: "anywhere" }}>
                {uploading.isPending ? "Uploading…" : value ?? "The PhreshOS wallpaper"}
            </span>
            <Flex gap="small" justify="center">
                <FileTrigger accept={accept} onSelect={files => void choose(files)}>
                    <Button size="small" pending={uploading.isPending}>{value ? "Replace" : "Choose"}</Button>
                </FileTrigger>
                {value && <Button size="small" onPress={() => change(slot, { ...draft[slot], [theme]: null })}><X />Clear</Button>}
            </Flex>
        </DropZone>
        {uploading.exception && <ErrorAlert title="Could not upload" error={uploading.exception.current} />}
    </Flex>
}
