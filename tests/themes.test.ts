import assert from "node:assert/strict"
import { defaultAppearance, parseAppearance } from "@phreshos/core"
import { applyTheme, themeOf, themes } from "../source/client/core/themes"
import { test } from "vitest"

test("themes", () => {
  // The defaults are the release's own theme, and every theme is a valid Appearance.
  assert.equal(themeOf(defaultAppearance)?.id, "sprout")
  for (const theme of themes) {
      const applied = applyTheme(defaultAppearance, theme)
      assert.deepEqual(parseAppearance(applied), parseAppearance(applied))
      assert.equal(themeOf(parseAppearance(applied))?.id, theme.id)
  }

  // A theme sets the look, never where the Taskbar sits or the wallpapers.
  const owned = { ...defaultAppearance, taskbar: { position: "left" as const, size: 60, overlay: true }, desktopWallpaper: { light: "a.png", dark: null } }
  const compact = applyTheme(owned, themes.find(theme => theme.id === "compact")!)
  assert.deepEqual(compact.taskbar, owned.taskbar)
  assert.deepEqual(compact.desktopWallpaper, owned.desktopWallpaper)

  // Any difference makes the look the owner's own.
  assert.equal(themeOf({ ...defaultAppearance, spacing: 13 }), null)
})
