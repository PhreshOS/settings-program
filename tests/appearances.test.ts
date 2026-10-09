import assert from "node:assert/strict"
import { applyAppearanceUpdate, defaultAppearance, parseAppearance } from "@phreshos/core"
import { freeName, lookOf, readyAppearances, sameLook } from "../source/client/core/appearances"
import { test } from "vitest"

test("ready Appearances apply as they are, and leave the wallpapers alone", () => {
  const owned = { ...defaultAppearance, desktopWallpaper: { light: "a.png", dark: null }, signInWallpaper: { light: null, dark: "b.png" } }
  for (const ready of readyAppearances) {
      const applied = parseAppearance(applyAppearanceUpdate(owned, ready.look))
      assert(sameLook(lookOf(applied), ready.look), ready.id)
      assert.deepEqual(applied.desktopWallpaper, owned.desktopWallpaper)
      assert.deepEqual(applied.signInWallpaper, owned.signInWallpaper)
  }
  // Sprout is the System's own default.
  assert(sameLook(readyAppearances[0]!.look, lookOf(defaultAppearance)))
})

test("any difference in the look makes the Appearance another one; a wallpaper does not", () => {
  assert.equal(sameLook(lookOf({ ...defaultAppearance, spacing: 13 }), lookOf(defaultAppearance)), false)
  assert.equal(sameLook(lookOf({ ...defaultAppearance, taskbar: { ...defaultAppearance.taskbar, size: 61 } }), lookOf(defaultAppearance)), false)
  assert(sameLook(lookOf({ ...defaultAppearance, desktopWallpaper: { light: "a.png", dark: null } }), lookOf(defaultAppearance)))
})

test("a new name is free", () => {
  assert.equal(freeName("My appearance", []), "My appearance")
  assert.equal(freeName("My appearance", ["My appearance", "My appearance 2"]), "My appearance 3")
})
