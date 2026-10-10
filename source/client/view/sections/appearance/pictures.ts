import { useProgramStore } from "@phreshos/react"
import type { Appearance, ThemedValue } from "@phreshos/core"
import type { AppearanceEntry } from "@client/core/appearances"
import { useApplication } from "../../application"

/**
 * The pictures Settings carries, as the uploads they became. Each is uploaded once: its upload key
 * is kept under the name the build gave the file, which changes with its content, and is used again
 * while that upload still exists.
 */
export function usePictures() {
    const application = useApplication()
    const [uploaded, setUploaded] = useProgramStore<Readonly<Record<string, string>>>("pictureUploads", {})

    // Each Theme's picture is its own upload, even when both are one file: a wallpaper is its upload,
    // and an HTML page shown in both Themes is then opened anew in each.
    async function upload(address: string, theme: "light" | "dark") {
        const name = `${theme}/${new URL(address, location.href).pathname.split("/").pop()!}`
        const kept = uploaded?.[name]
        if (kept && await application.uploadExists(kept)) return kept
        const picture = await (await fetch(address)).blob()
        const key = await application.upload(new File([picture], name.slice(theme.length + 1), { type: picture.type }))
        await setUploaded(current => ({ ...current, [name]: key }))
        return key
    }

    return {
        loaded: uploaded !== undefined,
        /** The Appearance as it is applied, or `null` while its pictures were never uploaded. */
        known(entry: AppearanceEntry): Appearance | null {
            if (!entry.pictures) return entry.appearance
            const name = (address: string, theme: string) => `${theme}/${new URL(address, location.href).pathname.split("/").pop()!}`
            const light = uploaded?.[name(entry.pictures.light, "light")], dark = uploaded?.[name(entry.pictures.dark, "dark")]
            return light && dark ? withPictures(entry.appearance, { light, dark }) : null
        },
        /** The Appearance ready to apply, its pictures uploaded first where they are not yet. */
        async resolve(entry: AppearanceEntry): Promise<Appearance> {
            if (!entry.pictures) return entry.appearance
            const [light, dark] = await Promise.all([upload(entry.pictures.light, "light"), upload(entry.pictures.dark, "dark")])
            return withPictures(entry.appearance, { light, dark })
        }
    }
}

/** Each Theme's picture behind sign-in and the Desktop alike. */
function withPictures(appearance: Appearance, keys: ThemedValue<string>): Appearance {
    return { ...appearance, wallpapers: { light: { signIn: keys.light, desktop: keys.light }, dark: { signIn: keys.dark, desktop: keys.dark } } }
}
