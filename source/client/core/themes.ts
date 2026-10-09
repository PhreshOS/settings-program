import { defaultAppearance, type Appearance, type AppearanceColors, type AppearanceMaterial, type AppearanceShadow, type ThemedValue } from "@phreshos/core"

/** The parts of an Appearance a theme sets: its look, never where the Taskbar sits or the wallpapers. */
export type Look = Pick<Appearance, "colors" | "spacing" | "radius" | "shadow" | "material" | "tempo">

/**
 * A look the owner can choose. Themes belong to Settings alone: the System knows one Appearance,
 * and choosing a theme writes its look into it. The ready ones come with Settings; the owner's
 * own are kept in Settings' store.
 */
export type SettingsTheme = Readonly<{
    id: string
    name: string
    description: string
    look: Look
}>

/** A theme the owner made, kept in Settings' store. */
export type CustomTheme = SettingsTheme & Readonly<{ custom: true }>

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

/** The look an Appearance has. */
export function lookOf(appearance: Appearance): Look {
    return { colors: appearance.colors, spacing: appearance.spacing, radius: appearance.radius, shadow: appearance.shadow, material: appearance.material, tempo: appearance.tempo }
}

/** The theme whose look the Appearance has exactly, among these, or `null` once anything differs. */
export function themeOf(appearance: Appearance, among: readonly SettingsTheme[] = themes): SettingsTheme | null {
    return among.find(theme => sameLook(lookOf(appearance), theme.look)) ?? null
}

/** Whether two looks are the same. */
export function sameLook(first: Look, second: Look) {
    return (Object.keys(first) as (keyof Look)[]).every(key => same(first[key], second[key]))
}

/** A new name, unused among these themes: the name itself, else it numbered. */
export function freeName(name: string, among: readonly SettingsTheme[]) {
    const taken = new Set(among.map(theme => theme.name))
    if (!taken.has(name)) return name
    for (let number = 2; ; number++) if (!taken.has(`${name} ${number}`)) return `${name} ${number}`
}

/** Equal values, whatever order their keys were written in. */
function same(first: unknown, second: unknown): boolean {
    if (first === second) return true
    if (typeof first !== "object" || typeof second !== "object" || first === null || second === null) return false
    const keys = Object.keys(first)
    return keys.length === Object.keys(second).length
        && keys.every(key => same((first as Record<string, unknown>)[key], (second as Record<string, unknown>)[key]))
}
