import { defaultAppearance, type Appearance, type AppearanceColors, type AppearanceMaterial, type AppearanceShadow, type AppearanceTaskbar, type ThemedValue } from "@phreshos/core"
import mossLight from "@client/assets/wallpapers/moss-light.svg?url"
import mossDark from "@client/assets/wallpapers/moss-dark.svg?url"
import frostLight from "@client/assets/wallpapers/frost-light.jpg?url"
import frostDark from "@client/assets/wallpapers/frost-dark.jpg?url"
import bloomLight from "@client/assets/wallpapers/bloom-light.jpg?url"
import bloomDark from "@client/assets/wallpapers/bloom-dark.jpg?url"
import duskLight from "@client/assets/wallpapers/dusk-light.svg?url"
import duskDark from "@client/assets/wallpapers/dusk-dark.svg?url"
import stoneLight from "@client/assets/wallpapers/stone-light.svg?url"
import stoneDark from "@client/assets/wallpapers/stone-dark.svg?url"

/**
 * Appearances Settings offers. The System knows one Appearance document, the one it applies; an
 * Appearance here is a whole such document. The owner's own are kept in Settings' store. The ready
 * ones come with Settings: some show the System's own wallpapers, others pictures Settings carries,
 * which become uploads when the Appearance is first chosen (see `wallpaper-uploads`).
 */

/** An Appearance to choose: a ready one or one of the owner's. */
export type AppearanceEntry = Readonly<{
    id: string
    name: string
    /** What a ready one is like; the owner's own carry none. */
    description?: string
    appearance: Appearance
    /** The pictures Settings carries for it, one for each Theme, behind sign-in and the Desktop alike. */
    pictures?: ThemedValue<string>
}>

const base: Appearance = defaultAppearance

function both<Value>(change: (value: Value) => Value, value: ThemedValue<Value>): ThemedValue<Value> {
    return { light: change(value.light), dark: change(value.dark ?? value.light) }
}

const shadow = (change: Partial<AppearanceShadow>) => both(value => ({ ...value, ...change }), base.shadow)
const material = (change: Partial<AppearanceMaterial>) => both(value => ({ ...value, ...change }), base.material)
const colors = (light: Partial<AppearanceColors>, dark: Partial<AppearanceColors>): ThemedValue<AppearanceColors> =>
    ({ light: { ...base.colors.light, ...light }, dark: { ...base.colors.dark!, ...dark } })
const taskbar = (change: Partial<AppearanceTaskbar>): AppearanceTaskbar => ({ ...base.taskbar, ...change })

export const readyAppearances: readonly AppearanceEntry[] = [
    { id: "sprout", name: "Sprout", description: "The look this release comes with.", appearance: base },
    { id: "compact", name: "Compact", description: "Tighter spacing and corners.", appearance: { ...base, spacing: 8, radius: 6 } },
    { id: "calm", name: "Calm", description: "Slower motion, rounder corners, softer shadows.", appearance: { ...base, radius: 14, tempo: 2, shadow: shadow({ blur: 24, opacity: 0.05 }) } },
    {
        id: "contrast", name: "Contrast", description: "Stronger text and more opaque surfaces.",
        appearance: {
            ...base,
            colors: colors({ background: "#ffffff", foreground: "#120d09", default: "#ffffff" }, { background: "#000000", foreground: "#ffffff", default: "#0b1420" }),
            material: material({ opacity: 0.96 }),
            shadow: shadow({ opacity: 0.18 })
        }
    },
    { id: "solid", name: "Solid", description: "Opaque surfaces without frost or grain. The lightest to draw.", appearance: { ...base, material: material({ opacity: 1, backdrop: 0, saturation: 1, grain: 0, distortion: 0 }) } },
    {
        id: "moss", name: "Moss", description: "Green and round, over rolling hills.", pictures: { light: mossLight, dark: mossDark },
        appearance: {
            ...base,
            colors: colors(
                { background: "#f3f6ef", foreground: "#1d2a1b", default: "#fbfdf8", primary: "#6f9f4e", secondary: "#4f8a8b" },
                { background: "#0d1610", foreground: "#e2ece0", default: "#172219", primary: "#8cc26a", secondary: "#6fb3b0" }),
            radius: 14
        }
    },
    {
        id: "frost", name: "Frost", description: "Frosted glass over color; the Taskbar over the windows. The heaviest to draw.", pictures: { light: frostLight, dark: frostDark },
        appearance: {
            ...base,
            colors: colors(
                { background: "#eef4fb", foreground: "#14202e", default: "#f8fbff", primary: "#4c8dff", secondary: "#8a6cff" },
                { background: "#070d1c", foreground: "#e6eefb", default: "#121a2c", primary: "#6aa4ff", secondary: "#a48cff" }),
            radius: 16,
            material: material({ opacity: 0.7, backdrop: 18, saturation: 1.6, grain: 0.02 }),
            taskbar: taskbar({ overlay: true })
        }
    },
    {
        id: "bloom", name: "Bloom", description: "Warm color, wide corners, unhurried motion.", pictures: { light: bloomLight, dark: bloomDark },
        appearance: {
            ...base,
            colors: colors(
                { background: "#fff6f1", foreground: "#2e1620", default: "#fffbf8", primary: "#e0567a", secondary: "#f08a4b" },
                { background: "#1d0f1c", foreground: "#f6e4ec", default: "#2a1628", primary: "#ff7aa0", secondary: "#ffa070" }),
            radius: 18,
            spacing: 14,
            tempo: 1.5
        }
    },
    {
        id: "dusk", name: "Dusk", description: "Ember on dark plum; the Taskbar at the top.", pictures: { light: duskLight, dark: duskDark },
        appearance: {
            ...base,
            colors: colors(
                { background: "#fbf1ea", foreground: "#2b1620", default: "#fff8f3", primary: "#e8643a", secondary: "#9a4a8a" },
                { background: "#150c1c", foreground: "#f3e2e2", default: "#22132a", primary: "#ff7a45", secondary: "#c070b0" }),
            shadow: shadow({ blur: 18, opacity: 0.16 }),
            taskbar: taskbar({ position: "top" })
        }
    },
    {
        id: "stone", name: "Stone", description: "Gray, sharp, and solid; the Taskbar on the left.", pictures: { light: stoneLight, dark: stoneDark },
        appearance: {
            ...base,
            colors: colors(
                { background: "#eceae7", foreground: "#151515", default: "#f7f6f4", primary: "#3a3a3a", secondary: "#6a6a6a" },
                { background: "#151516", foreground: "#ececec", default: "#202022", primary: "#d8d8d8", secondary: "#9a9a9a" }),
            radius: 6,
            spacing: 10,
            material: material({ opacity: 1, backdrop: 0, saturation: 1, grain: 0.04, distortion: 0 }),
            shadow: shadow({ blur: 6, opacity: 0.14 }),
            taskbar: taskbar({ position: "left" })
        }
    }
]

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
