import { defaultAppearance, type Appearance, type AppearanceColors, type AppearanceMaterial, type AppearanceShadow, type ThemedValue } from "@phreshos/core"

/** The parts of an Appearance a theme sets: its look, never where the Taskbar sits or the wallpapers. */
export type Look = Pick<Appearance, "colors" | "spacing" | "radius" | "shadow" | "material" | "tempo">

/**
 * A ready look the owner can start from. Themes belong to Settings alone: the System knows one
 * Appearance, and a theme only fills Settings' draft of it, which is saved like any other change.
 */
export type SettingsTheme = Readonly<{
    id: string
    name: string
    description: string
    look: Look
}>

const base: Look = {
    colors: defaultAppearance.colors,
    spacing: defaultAppearance.spacing,
    radius: defaultAppearance.radius,
    shadow: defaultAppearance.shadow,
    material: defaultAppearance.material,
    tempo: defaultAppearance.tempo
}

function both<Value>(change: (value: Value) => Value, value: ThemedValue<Value>): ThemedValue<Value> {
    return { light: change(value.light), dark: change(value.dark ?? value.light) }
}

const shadow = (change: Partial<AppearanceShadow>) => both(value => ({ ...value, ...change }), base.shadow)
const material = (change: Partial<AppearanceMaterial>) => both(value => ({ ...value, ...change }), base.material)
const colors = (light: Partial<AppearanceColors>, dark: Partial<AppearanceColors>): ThemedValue<AppearanceColors> =>
    ({ light: { ...base.colors.light, ...light }, dark: { ...base.colors.dark!, ...dark } })

export const themes: readonly SettingsTheme[] = [
    { id: "sprout", name: "Sprout", description: "The look this release comes with.", look: base },
    { id: "compact", name: "Compact", description: "Tighter spacing and corners.", look: { ...base, spacing: 8, radius: 6 } },
    {
        id: "calm", name: "Calm", description: "Slower motion, rounder corners, softer shadows.",
        look: { ...base, radius: 14, tempo: 2, shadow: shadow({ blur: 24, opacity: 0.05 }) }
    },
    {
        id: "contrast", name: "Contrast", description: "Stronger text and more opaque surfaces.",
        look: {
            ...base,
            colors: colors({ background: "#ffffff", foreground: "#120d09", default: "#ffffff" }, { background: "#000000", foreground: "#ffffff", default: "#0b1420" }),
            material: material({ opacity: 0.96 }),
            shadow: shadow({ opacity: 0.18 })
        }
    },
    {
        id: "solid", name: "Solid", description: "Opaque surfaces without frost or grain. The lightest to draw.",
        look: { ...base, material: material({ opacity: 1, backdrop: 0, saturation: 1, grain: 0, distortion: 0 }) }
    }
]

/** The Appearance with a theme's look over it. */
export function applyTheme(appearance: Appearance, theme: SettingsTheme): Appearance {
    return { ...appearance, ...theme.look }
}

/** The theme whose look the Appearance has exactly, or `null` once anything differs. */
export function themeOf(appearance: Appearance): SettingsTheme | null {
    return themes.find(theme => (Object.keys(theme.look) as (keyof Look)[]).every(key => same(appearance[key], theme.look[key]))) ?? null
}

/** Equal values, whatever order their keys were written in. */
function same(first: unknown, second: unknown): boolean {
    if (first === second) return true
    if (typeof first !== "object" || typeof second !== "object" || first === null || second === null) return false
    const keys = Object.keys(first)
    return keys.length === Object.keys(second).length
        && keys.every(key => same((first as Record<string, unknown>)[key], (second as Record<string, unknown>)[key]))
}
