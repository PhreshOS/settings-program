import { defaultAppearance, type Appearance, type AppearanceColors, type AppearanceMaterial, type AppearanceShadow, type ThemedValue } from "@phreshos/core"

/**
 * Appearances Settings offers. The System knows one Appearance document, the one it applies; an
 * Appearance here is a whole such document. The ready ones come with Settings and have no
 * wallpapers of their own; the owner's own are kept in Settings' store.
 */

/** An Appearance to choose: a ready one or one of the owner's. */
export type AppearanceEntry = Readonly<{
    id: string
    name: string
    description: string
    appearance: Appearance
}>

const base: Appearance = defaultAppearance

function both<Value>(change: (value: Value) => Value, value: ThemedValue<Value>): ThemedValue<Value> {
    return { light: change(value.light), dark: change(value.dark ?? value.light) }
}

const shadow = (change: Partial<AppearanceShadow>) => both(value => ({ ...value, ...change }), base.shadow)
const material = (change: Partial<AppearanceMaterial>) => both(value => ({ ...value, ...change }), base.material)
const colors = (light: Partial<AppearanceColors>, dark: Partial<AppearanceColors>): ThemedValue<AppearanceColors> =>
    ({ light: { ...base.colors.light, ...light }, dark: { ...base.colors.dark!, ...dark } })

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
    { id: "solid", name: "Solid", description: "Opaque surfaces without frost or grain. The lightest to draw.", appearance: { ...base, material: material({ opacity: 1, backdrop: 0, saturation: 1, grain: 0, distortion: 0 }) } }
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
