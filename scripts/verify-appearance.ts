import assert from "node:assert/strict"
import { defaultAppearance } from "@phreshos/core"
import { parseAppearance, serializeAppearance } from "../source/client/view/appearance/document"

assert.deepEqual(parseAppearance(serializeAppearance(defaultAppearance)), defaultAppearance)
assert(Object.isFrozen(parseAppearance(serializeAppearance(defaultAppearance)).shadow.dark))

const custom = {
    ...defaultAppearance,
    shadow: { ...defaultAppearance.shadow, light: { x: -4, y: 12, blur: 32, spread: -2, opacity: 0.3 } },
    desktopWallpaper: { light: "12345678-1234-1234-1234-123456789abc.png", dark: null }
}
assert.deepEqual(parseAppearance(serializeAppearance(custom)), custom)
assert.throws(() => parseAppearance("{"), /valid Appearance JSON/)
for (const value of [null, [], {}, { ...defaultAppearance, extra: true }, { ...defaultAppearance, shadow: null }]) {
    assert.throws(() => parseAppearance(JSON.stringify(value)))
}
for (const value of ["12", -1, 97]) {
    assert.throws(() => parseAppearance(JSON.stringify({
        ...defaultAppearance,
        shadow: { ...defaultAppearance.shadow, light: { ...defaultAppearance.shadow.light, blur: value } }
    })), /Appearance.shadow.light.blur/)
}
assert.throws(() => parseAppearance(JSON.stringify({ ...defaultAppearance, spacing: { light: 100 } })), /Appearance.spacing.light/)
assert.throws(() => parseAppearance(JSON.stringify({
    ...defaultAppearance,
    colors: { ...defaultAppearance.colors, foreground: { light: "", dark: "red" } }
})), /Appearance.colors.foreground.light/)
assert.throws(() => parseAppearance(JSON.stringify({
    ...defaultAppearance,
    material: { ...defaultAppearance.material, dark: { ...defaultAppearance.material.dark, opacity: 2 } }
})), /Appearance.material.dark.opacity/)
assert.throws(() => parseAppearance(serializeAppearance(defaultAppearance).replace('"blur": 24', '"blur": 1e999')), /finite number/)
assert.throws(() => parseAppearance(serializeAppearance(defaultAppearance).replace('"spacing": {', '"__proto__": {}, "spacing": {')), /not an Appearance field/)
console.log("Appearance document contracts passed")
