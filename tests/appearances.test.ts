import assert from "node:assert/strict"
import { applyAppearanceUpdate, defaultAppearance, parseAppearance } from "@phreshos/core"
import { freeName, readyAppearances, readyDocument, sameAppearance } from "../source/client/core/appearances"
import { test } from "vitest"

test("ready Appearances are whole documents the System accepts", () => {
  const uploaded = { meadow: { light: "m-l", dark: "m-d" }, dune: { light: "d-l", dark: "d-d" }, tide: { light: "t-l", dark: "t-d" }, plain: { light: "p-l", dark: "p-d" } }
  for (const ready of readyAppearances) {
      const document = readyDocument(ready, uploaded)!
      const applied = parseAppearance(applyAppearanceUpdate(defaultAppearance, document))
      assert(sameAppearance(applied, document), ready.id)
  }
  // Sprout is the System's own default, wallpaper included: none.
  assert(sameAppearance(readyDocument(readyAppearances[0]!, {}), defaultAppearance))
})

test("a ready Appearance with Settings' wallpaper is known only once that wallpaper was uploaded", () => {
  const meadow = readyAppearances.find(entry => entry.id === "meadow")!
  assert.equal(readyDocument(meadow, {}), null)
})

test("any difference makes the Appearance another one", () => {
  assert.equal(sameAppearance({ ...defaultAppearance, spacing: 13 }, defaultAppearance), false)
  assert.equal(sameAppearance({ ...defaultAppearance, taskbar: { ...defaultAppearance.taskbar, size: 61 } }, defaultAppearance), false)
})

test("a new name is free", () => {
  assert.equal(freeName("My appearance", []), "My appearance")
  assert.equal(freeName("My appearance", ["My appearance", "My appearance 2"]), "My appearance 3")
})
