import { defineConfig } from "@phreshos/core"

export default defineConfig({
    identity: "settings",
    name: "Settings",
    description: "Configure PhreshOS.",
    version: "0.1.40",
    icon: "icon.png",
    categories: ["System"],
    keywords: ["settings", "appearance", "theme", "programs", "permissions", "sessions"],
    website: "https://github.com/PhreshOS/settings-program",
    buildCommand: "vite-node scripts/build.ts",
    // Settings manages the whole System: assigning Program permissions alone already needs `all`.
    permissions: { all: true },
    client: {
        location: "dist/client",
        title: "Settings",
        // Settings opens with room for its sections and a page beside them, as a share of the screen
        // so it suits every Desktop.
        size: { width: "60%", height: "70%" },
        devCommand: "vite --config vite.client.ts"
    }
})
