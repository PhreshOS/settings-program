import { defaultAppearance, type Appearance, type AppearanceColors, type AppearanceMaterial, type AppearanceShadow, type ThemedValue } from "@phreshos/core"

/**
 * Appearances Settings offers. The System knows one Appearance document, the one it applies; an
 * Appearance here is a whole such document: its colors and shape, its wallpaper, and its Taskbar.
 * The ready ones come with Settings; the owner's own are kept in Settings' store.
 */

/** The parts of an Appearance that make its look, apart from where its wallpaper comes from. */
export type Look = Omit<Appearance, "desktopWallpaper" | "signInWallpaper">

/** A wallpaper Settings brings, uploaded to the System the first time it is used. */
export type ReadyWallpaper = "meadow" | "dune" | "tide" | "plain"

/** A ready Appearance: a look, and Settings' own wallpaper or none (the release's own). */
export type ReadyAppearance = Readonly<{
    id: string
    name: string
    description: string
    look: Look
    wallpaper: ReadyWallpaper | null
}>

/** An Appearance the owner saved, whole. */
export type SavedAppearance = Readonly<{
    id: string
    name: string
    appearance: Appearance
}>

const base: Look = {
    colors: defaultAppearance.colors,
    spacing: defaultAppearance.spacing,
    radius: defaultAppearance.radius,
    shadow: defaultAppearance.shadow,
    material: defaultAppearance.material,
    tempo: defaultAppearance.tempo,
    taskbar: defaultAppearance.taskbar
}

function both<Value>(change: (value: Value) => Value, value: ThemedValue<Value>): ThemedValue<Value> {
    return { light: change(value.light), dark: change(value.dark ?? value.light) }
}

const shadow = (change: Partial<AppearanceShadow>) => both(value => ({ ...value, ...change }), base.shadow)
const material = (change: Partial<AppearanceMaterial>) => both(value => ({ ...value, ...change }), base.material)
const colors = (light: Partial<AppearanceColors>, dark: Partial<AppearanceColors>): ThemedValue<AppearanceColors> =>
    ({ light: { ...base.colors.light, ...light }, dark: { ...base.colors.dark!, ...dark } })

export const readyAppearances: readonly ReadyAppearance[] = [
    { id: "sprout", name: "Sprout", description: "The look this release comes with.", look: base, wallpaper: null },
    { id: "meadow", name: "Meadow", description: "Sprout's look over an open meadow.", look: base, wallpaper: "meadow" },
    { id: "dune", name: "Dune", description: "Slower motion, rounder corners, softer shadows.", look: { ...base, radius: 14, tempo: 2, shadow: shadow({ blur: 24, opacity: 0.05 }) }, wallpaper: "dune" },
    { id: "tide", name: "Tide", description: "Tighter spacing and corners.", look: { ...base, spacing: 8, radius: 6 }, wallpaper: "tide" },
    {
        id: "contrast", name: "Contrast", description: "Stronger text and more opaque surfaces.", wallpaper: "plain",
        look: {
            ...base,
            colors: colors({ background: "#ffffff", foreground: "#120d09", default: "#ffffff" }, { background: "#000000", foreground: "#ffffff", default: "#0b1420" }),
            material: material({ opacity: 0.96 }),
            shadow: shadow({ opacity: 0.18 })
        }
    },
    { id: "solid", name: "Solid", description: "Opaque surfaces without frost or grain. The lightest to draw.", look: { ...base, material: material({ opacity: 1, backdrop: 0, saturation: 1, grain: 0, distortion: 0 }) }, wallpaper: "plain" }
]

/** Where each ready wallpaper was uploaded, light and dark, once it has been. */
export type UploadedWallpapers = Readonly<Partial<Record<ReadyWallpaper, Readonly<{ light: string, dark: string }>>>>

/** A ready Appearance as a whole document, or `null` while its wallpaper has not been uploaded yet. */
export function readyDocument(ready: ReadyAppearance, uploaded: UploadedWallpapers): Appearance | null {
    const pair = ready.wallpaper === null ? { light: null, dark: null } : uploaded[ready.wallpaper] ?? null
    if (pair === null) return null
    return { ...ready.look, desktopWallpaper: pair, signInWallpaper: pair }
}

/** Whether two Appearances are the same, whatever order their keys were written in. */
export function sameAppearance(first: unknown, second: unknown): boolean {
    if (first === second) return true
    if (typeof first !== "object" || typeof second !== "object" || first === null || second === null) return false
    const keys = Object.keys(first)
    return keys.length === Object.keys(second).length
        && keys.every(key => sameAppearance((first as Record<string, unknown>)[key], (second as Record<string, unknown>)[key]))
}

/** A new name, unused among these: the name itself, else it numbered. */
export function freeName(name: string, taken: readonly string[]) {
    if (!taken.includes(name)) return name
    for (let number = 2; ; number++) if (!taken.includes(`${name} ${number}`)) return `${name} ${number}`
}
