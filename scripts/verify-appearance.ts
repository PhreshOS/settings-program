import assert from "node:assert/strict"
import { standardAppearance } from "@phreshos/core"
import { parseAppearance, serializeAppearance } from "../source/client/view/appearance/document"

assert.deepEqual(parseAppearance(serializeAppearance(standardAppearance)), standardAppearance)
assert(Object.isFrozen(parseAppearance(serializeAppearance(standardAppearance)).shadow.dark))

const custom = {
    ...standardAppearance,
    shadow: { ...standardAppearance.shadow, light: { x: -4, y: 12, blur: 32, spread: -2, opacity: 0.3 } },
    desktopWallpaper: { light: "12345678-1234-1234-1234-123456789abc.png", dark: null }
}
assert.deepEqual(parseAppearance(serializeAppearance(custom)), custom)
assert.throws(() => parseAppearance("{"), /valid Appearance JSON/)
for (const value of [null, [], {}, { ...standardAppearance, extra: true }, { ...standardAppearance, shadow: null }]) {
    assert.throws(() => parseAppearance(JSON.stringify(value)))
}
for (const value of ["12", -1, 97]) {
    assert.throws(() => parseAppearance(JSON.stringify({
        ...standardAppearance,
        shadow: { ...standardAppearance.shadow, light: { ...standardAppearance.shadow.light, blur: value } }
    })), /Appearance.shadow.light.blur/)
}
assert.throws(() => parseAppearance(JSON.stringify({ ...standardAppearance, spacing: { light: 100 } })), /Appearance.spacing.light/)
assert.throws(() => parseAppearance(JSON.stringify({ ...standardAppearance, foreground: { light: "", dark: "red" } })), /Appearance.foreground.light/)
assert.throws(() => parseAppearance(JSON.stringify({
    ...standardAppearance,
    surface: { ...standardAppearance.surface, dark: { ...standardAppearance.surface.dark, opacity: 2 } }
})), /Appearance.surface.dark.opacity/)
assert.throws(() => parseAppearance(serializeAppearance(standardAppearance).replace('"blur": 24', '"blur": 1e999')), /finite number/)
assert.throws(() => parseAppearance(serializeAppearance(standardAppearance).replace('"spacing": {', '"__proto__": {}, "spacing": {')), /not an Appearance field/)
console.log("Appearance document contracts passed")
