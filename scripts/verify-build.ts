import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import config from "../phresh.config"
import manifest from "../package.json" with { type: "json" }

assert.equal(config.identity, "settings")
assert.equal(config.name, "Settings")
assert.equal(config.version, manifest.version)
assert.equal(config.server?.location, "dist/server")
assert.equal(config.server?.entryFile, "main.js")
assert.equal(config.client?.location, "dist/client")

const page = readFileSync("dist/client/index.html", "utf8")
const client = readdirSync("dist/client/assets")
    .map(file => readFileSync(`dist/client/assets/${file}`, "utf8"))
    .join("\n")

assert.match(page, /<html/i)
assert.match(client, /Appearance/)
assert.match(client, /appearance\.update/)
assert.match(readFileSync("dist/server/main.js", "utf8"), /appearance\.update/)
assert.equal(existsSync("dist/server/main.js"), true)

const serverManifest = JSON.parse(readFileSync("dist/server/package.json", "utf8")) as Record<string, unknown>

assert.deepEqual(serverManifest, { type: "module" })
