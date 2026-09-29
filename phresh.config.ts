import { defineConfig } from "@phreshos/core"

export default defineConfig({
    identity: "settings",
    name: "Settings",
    description: "Configure PhreshOS.",
    version: "0.1.38",
    icon: "icon.png",
    categories: ["System"],
    keywords: ["settings", "appearance", "theme"],
    website: "https://github.com/PhreshOS/settings-program",
    buildCommand: "vite-node scripts/build.ts",
    permissions: {
        appearance: true,
        desktopPreferences: true,
        uploads: true
    },
    client: {
        location: "dist/client",
        title: "Settings",
        // Settings opens with room for its sections and a page beside them, as a share of the screen
        // so it suits every Desktop.
        size: { width: "60%", height: "70%" },
        devCommand: "vite --config vite.client.ts"
    }
})
