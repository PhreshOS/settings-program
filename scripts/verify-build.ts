import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import config from "../phresh.config"
import manifest from "../package.json" with { type: "json" }

assert.equal(config.identity, "settings")
assert.equal(config.name, "Settings")
assert.equal(config.version, manifest.version)
assert.equal(config.server, undefined)
assert.equal(config.client?.location, "dist/client")
assert.deepEqual(config.client?.permissions, {
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
assert.match(client, /appearance\.update/)
