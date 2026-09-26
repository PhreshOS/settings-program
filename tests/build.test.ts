import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import config from "../phresh.config"
import manifest from "../package.json" with { type: "json" }
import { test } from "vitest"

test("build contract", async () => {
  assert.equal(config.identity, "settings")
  assert.equal(config.name, "Settings")
  assert.equal(config.version, manifest.version)
  assert.equal(config.server, undefined)
  assert.equal(config.client?.location, "dist/client")
  assert.deepEqual(config.permissions, {
      appearance: true,
      desktopPreferences: true,
      uploads: true
  })

  const page = readFileSync("dist/client/index.html", "utf8")
  const client = readdirSync("dist/client/assets")
      .map(file => readFileSync(`dist/client/assets/${file}`, "utf8"))
      .join("\n")

  assert.match(page, /<html/i)
  assert.match(client, /Appearance/)
  // Both categories and their pages reach the bundle.
  assert.match(client, /Theme, animations, and scale on this desktop only/)
  assert.match(client, /Overlay windows/)
  assert.match(client, /Wallpapers/)
  assert.match(client, /appearance\.update/)
}, 120_000)
