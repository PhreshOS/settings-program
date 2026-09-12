import { appearanceLimits, createAppearanceSnapshot, defaultAppearance, type Appearance } from "@phreshos/core"

/** Reads a complete Appearance document before it can become an editable draft. */
export function parseAppearance(text: string): Appearance {
    let value: unknown
    try { value = JSON.parse(text) }
    catch { throw new Error("Enter a valid Appearance JSON document.") }
    assertAppearance(value)
    return createAppearanceSnapshot(value)
}

/** Exports values only; uploaded wallpaper references are not embedded images. */
export function serializeAppearance(appearance: Appearance): string {
    return JSON.stringify(appearance, null, 2)
}

function assertAppearance(value: unknown): asserts value is Appearance {
    validate(value, defaultAppearance, appearanceLimits, "Appearance")
}

// The current Core defaults supply the complete shape; its limits supply ranges.
// System validation remains authoritative when the owner saves the draft.
function validate(value: unknown, template: unknown, limits: unknown, path: string): void {
    if (path === "Appearance.transaction.easing") {
        validateEasing(value, path)
        return
    }
    if (template === null) {
        if (value === null || typeof value === "string" && value.length > 0) return
        throw new Error(`${path} must be a wallpaper reference or null.`)
    }
    if (typeof template === "string") {
        if (typeof value === "string" && value.trim().length > 0) return
        throw new Error(`${path} must be a nonempty string.`)
    }
    if (typeof template === "number") {
        if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${path} must be a finite number.`)
        if (record(limits) && typeof limits.minimum === "number" && typeof limits.maximum === "number"
            && (value < limits.minimum || value > limits.maximum)) {
            throw new Error(`${path} must be between ${limits.minimum} and ${limits.maximum}.`)
        }
        return
    }
    if (!record(template) || !record(value)) throw new Error(`${path} must be an object.`)
    for (const key of Object.keys(value)) {
        if (!Object.hasOwn(template, key)) throw new Error(`${path}.${key} is not an Appearance field.`)
    }
    for (const key of Object.keys(template)) {
        if (!Object.hasOwn(value, key)) throw new Error(`${path}.${key} is missing.`)
        const range = key === "light" || key === "dark" ? limits : record(limits) ? limits[key] : undefined
        validate(value[key], template[key], range, `${path}.${key}`)
    }
}

function validateEasing(value: unknown, path: string) {
    if (value === "linear" || value === "ease" || value === "ease-in" || value === "ease-out" || value === "ease-in-out") return
    if (Array.isArray(value)
        && value.length === 4
        && value.every(item => typeof item === "number" && Number.isFinite(item))
        && value[0] >= 0
        && value[0] <= 1
        && value[2] >= 0
        && value[2] <= 1) return
    throw new Error(path + " must be a standard easing name or four cubic Bézier numbers.")
}

function record(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}
