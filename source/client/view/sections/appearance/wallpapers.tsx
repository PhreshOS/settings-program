import type { Theme } from "@phreshos/core"
import { Button, DropZone, FileTrigger, Flex, Grid, Text } from "@phreshos/react-ui"
import { ImageUp, X } from "@phreshos/react-ui/icons"
import usePromise from "@libs/react-promise"
import { useApplication } from "../../application"
import ErrorAlert from "../../components/error-alert"
import { Group } from "../../components/section-parts"
import { useAppearanceDraft } from "./draft"

// Images, videos, and offline HTML documents can all be a wallpaper.
const accept = ["image/*", "video/mp4", "video/ogg", "video/webm", "text/html"] as const

type Slot = "signInWallpaper" | "desktopWallpaper"

/**
 * What stands behind the Desktop and behind the sign-in screen, in light and in dark: all four at
 * once, since a light wallpaper and its dark one are chosen as a pair.
 */
export default function Wallpapers() {
    return <>
        <Group title="Desktop" description="Behind the windows. Without one, the release's own wallpaper stands there.">
            <Pair slot="desktopWallpaper" title="Desktop" />
        </Group>
        <Group title="Sign-in screen" description="Behind the sign-in form, before anyone signs in.">
            <Pair slot="signInWallpaper" title="Sign-in screen" />
        </Group>
    </>
}

/** One place's wallpaper in both themes, side by side. */
function Pair({ slot, title }: Readonly<{ slot: Slot, title: string }>) {
    return <Grid columns="repeat(auto-fit, minmax(min(14rem, 100%), 1fr))" gap="medium" style={{ padding: "0.75rem" }}>
        <Wallpaper slot={slot} title={`${title}, light`} theme="light" />
        <Wallpaper slot={slot} title={`${title}, dark`} theme="dark" />
    </Grid>
}

function Wallpaper({ slot, title, theme }: Readonly<{ slot: Slot, title: string, theme: Theme }>) {
    const application = useApplication()
    const { draft, change } = useAppearanceDraft()
    const value = draft[slot][theme] ?? null
    const uploading = usePromise((file: File) => application.upload(file))

    async function choose(files: File[]) {
        const [file] = files
        if (!file) return
        const key = await uploading.safeExecute(file)
        if (key) change(slot, { ...draft[slot], [theme]: key })
    }

    return <Flex direction="column" gap="small">
        <DropZone aria-label={`${title} wallpaper`} accept={accept} disabled={uploading.isPending} onDrop={files => void choose(files)}>
            <ImageUp size={22} />
            <Text size="small">{title}</Text>
            <Text size="xsmall" tone="secondary" style={{ overflowWrap: "anywhere" }}>{uploading.isPending ? "Uploading…" : value ?? "The release's wallpaper"}</Text>
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
