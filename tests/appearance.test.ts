import assert from "node:assert/strict"
import { defaultAppearance } from "@phreshos/core"
import { parseAppearance, serializeAppearance } from "../source/client/view/sections/appearance/document"
import { test } from "vitest"

test("appearance contract", async () => {
  assert.deepEqual(parseAppearance(serializeAppearance(defaultAppearance)), defaultAppearance)
  assert(Object.isFrozen(parseAppearance(serializeAppearance(defaultAppearance)).shadow))

  const custom = {
      ...defaultAppearance,
      shadow: { ...defaultAppearance.shadow, light: 0.3 },
      taskbar: { position: "left" as const, size: 62, overlay: true },
      wallpapers: { ...defaultAppearance.wallpapers, light: { ...defaultAppearance.wallpapers.light, desktop: "12345678-1234-1234-1234-123456789abc.png" } }
  }
  assert.deepEqual(parseAppearance(serializeAppearance(custom)), custom)
  assert.throws(() => parseAppearance("{"), /valid Appearance JSON/)
  for (const value of [null, [], {}, { ...defaultAppearance, shadow: null }]) {
      assert.throws(() => parseAppearance(JSON.stringify(value)))
  }
  assert.deepEqual(parseAppearance(JSON.stringify({ ...defaultAppearance, extension: true })), defaultAppearance)
  for (const value of ["0.1", -1, 0.5]) {
      assert.throws(() => parseAppearance(JSON.stringify({
          ...defaultAppearance,
          shadow: { ...defaultAppearance.shadow, light: value }
      })), /Appearance.shadow.light/)
  }
  assert.throws(() => parseAppearance(JSON.stringify({ ...defaultAppearance, spacing: 100 })), /Appearance.spacing/)
  assert.throws(() => parseAppearance(JSON.stringify({ ...defaultAppearance, taskbar: { ...defaultAppearance.taskbar, position: "center" } })), /Appearance taskbar position/)
  assert.throws(() => parseAppearance(JSON.stringify({ ...defaultAppearance, taskbar: { ...defaultAppearance.taskbar, size: 101 } })), /Appearance.taskbar.size/)
  assert.throws(() => parseAppearance(JSON.stringify({ ...defaultAppearance, taskbar: { ...defaultAppearance.taskbar, overlay: "yes" } })), /Appearance.taskbar.overlay/)
  assert.throws(() => parseAppearance(JSON.stringify({
      ...defaultAppearance,
      colors: { ...defaultAppearance.colors, light: { ...defaultAppearance.colors.light, foreground: "" } }
  })), /Appearance.colors.light.foreground/)
  assert.throws(() => parseAppearance(JSON.stringify({
      ...defaultAppearance,
      material: { ...defaultAppearance.material, dark: { ...defaultAppearance.material.dark, opacity: 2 } }
  })), /Appearance.material.dark.opacity/)
  assert.throws(() => parseAppearance(serializeAppearance(defaultAppearance).replace(`"spacing": ${defaultAppearance.spacing}`, '"spacing": 1e999')), /finite number/)
  assert.deepEqual(
      parseAppearance(serializeAppearance(defaultAppearance).replace('"colors": {', '"__proto__": {}, "colors": {')),
      defaultAppearance
  )
  assert.throws(() => parseAppearance(JSON.stringify({
      ...defaultAppearance,
      tempo: 5
  })), /Appearance.tempo/)
  console.log("Appearance document contracts passed")
}, 120_000)
