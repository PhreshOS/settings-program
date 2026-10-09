import assert from "node:assert/strict"
import { applyAppearanceUpdate, defaultAppearance, parseAppearance } from "@phreshos/core"
import { freeName, lookOf, themeOf, themes, type CustomTheme } from "../source/client/core/themes"
import { test } from "vitest"

test("themes", () => {
  // The defaults are the release's own theme, and every theme applies as a valid update.
  assert.equal(themeOf(defaultAppearance)?.id, "sprout")
  for (const theme of themes) {
      const applied = applyAppearanceUpdate(defaultAppearance, theme.look)
      assert.equal(themeOf(parseAppearance(applied))?.id, theme.id)
  }

  // A theme sets the look, never where the Taskbar sits or the wallpapers.
  const owned = { ...defaultAppearance, taskbar: { position: "left" as const, size: 60, overlay: true }, desktopWallpaper: { light: "a.png", dark: null } }
  const compact = applyAppearanceUpdate(owned, themes.find(theme => theme.id === "compact")!.look)
  assert.deepEqual(compact.taskbar, owned.taskbar)
  assert.deepEqual(compact.desktopWallpaper, owned.desktopWallpaper)

  // Any difference makes the look the owner's own, until one of their themes has it.
  const changed = { ...defaultAppearance, spacing: 13 }
  assert.equal(themeOf(changed), null)
  const mine: CustomTheme = { id: "mine", name: "Mine", description: "", look: lookOf(changed), custom: true }
  assert.equal(themeOf(changed, [...themes, mine])?.id, "mine")
})

test("a new theme's name is free", () => {
  assert.equal(freeName("My theme", themes), "My theme")
  const taken = [...themes, { ...themes[0]!, id: "a", name: "My theme" }, { ...themes[0]!, id: "b", name: "My theme 2" }]
  assert.equal(freeName("My theme", taken), "My theme 3")
})
