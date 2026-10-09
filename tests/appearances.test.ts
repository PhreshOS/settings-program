import assert from "node:assert/strict"
import { applyAppearanceUpdate, defaultAppearance, parseAppearance, systemWallpapers } from "@phreshos/core"
import { freeName, readyAppearances, sameAppearance } from "../source/client/core/appearances"
import { test } from "vitest"

test("ready Appearances apply whole, with the System's own wallpapers", () => {
  const owned = { ...defaultAppearance, wallpaper: { ...systemWallpapers, light: { signIn: "a.png", desktop: "b.png" } } }
  for (const ready of readyAppearances) {
      const applied = parseAppearance(applyAppearanceUpdate(owned, ready.appearance))
      assert(sameAppearance(applied, ready.appearance), ready.id)
      assert.deepEqual(applied.wallpaper, systemWallpapers)
  }
  // Sprout is the System's own default.
  assert(sameAppearance(readyAppearances[0]!.appearance, defaultAppearance))
})

test("any difference makes the Appearance another one, a wallpaper too", () => {
  assert.equal(sameAppearance({ ...defaultAppearance, spacing: 13 }, defaultAppearance), false)
  assert.equal(sameAppearance({ ...defaultAppearance, taskbar: { ...defaultAppearance.taskbar, size: 61 } }, defaultAppearance), false)
  assert.equal(sameAppearance({ ...defaultAppearance, wallpaper: { ...systemWallpapers, dark: { ...systemWallpapers.dark, desktop: "a.png" } } }, defaultAppearance), false)
})

test("a new name is free", () => {
  assert.equal(freeName("My appearance", []), "My appearance")
  assert.equal(freeName("My appearance", ["My appearance", "My appearance 2"]), "My appearance 3")
})
