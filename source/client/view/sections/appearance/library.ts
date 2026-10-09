import { useProgramStore } from "@phreshos/react"
import type { Appearance } from "@phreshos/core"
import { freeName, type ReadyWallpaper, type SavedAppearance, type UploadedWallpapers } from "@client/core/appearances"
import type Application from "@client/core/application"
import meadowLight from "./wallpapers/meadow-light.svg"
import meadowDark from "./wallpapers/meadow-dark.svg"
import duneLight from "./wallpapers/dune-light.svg"
import duneDark from "./wallpapers/dune-dark.svg"
import tideLight from "./wallpapers/tide-light.svg"
import tideDark from "./wallpapers/tide-dark.svg"
import plainLight from "./wallpapers/plain-light.svg"
import plainDark from "./wallpapers/plain-dark.svg"

/** The files of the wallpapers Settings brings, light and dark. */
export const readyWallpaperFiles: Readonly<Record<ReadyWallpaper, Readonly<{ name: string, light: string, dark: string }>>> = {
    meadow: { name: "Meadow", light: meadowLight, dark: meadowDark },
    dune: { name: "Dune", light: duneLight, dark: duneDark },
    tide: { name: "Tide", light: tideLight, dark: tideDark },
    plain: { name: "Plain", light: plainLight, dark: plainDark }
}

/**
 * What Settings keeps of Appearances: the ones the owner saved, and where its ready wallpapers were
 * uploaded, so a ready one is uploaded once and recognized in use afterwards.
 */
export function useLibrary(application: Application) {
    const [saved, setSaved] = useProgramStore<readonly SavedAppearance[]>("appearances", [])
    const [uploaded, setUploaded] = useProgramStore<UploadedWallpapers>("wallpapers", {})

    return {
        loaded: saved !== undefined && uploaded !== undefined,
        saved: saved ?? [],
        uploaded: uploaded ?? {},
        /** Keeps an Appearance under a free name and returns it. */
        async save(name: string, appearance: Appearance) {
            const entry: SavedAppearance = { id: crypto.randomUUID(), name: freeName(name, (saved ?? []).map(item => item.name)), appearance }
            await setSaved(current => [...current ?? [], entry])
            return entry
        },
        async remove(id: string) {
            await setSaved(current => (current ?? []).filter(item => item.id !== id))
        },
        /** Where a ready wallpaper is on the System, uploading it the first time. */
        async wallpaper(id: ReadyWallpaper) {
            const known = uploaded?.[id]
            if (known) return known
            const files = readyWallpaperFiles[id]
            const [light, dark] = await Promise.all([
                application.uploadAsset(files.light, `${id}-light.svg`),
                application.uploadAsset(files.dark, `${id}-dark.svg`)
            ])
            await setUploaded(current => ({ ...current, [id]: { light, dark } }))
            return { light, dark }
        }
    }
}
