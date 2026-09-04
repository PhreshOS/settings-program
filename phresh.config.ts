import { defineConfig } from "@phreshos/core"

export default defineConfig({
    identity: "settings",
    name: "Settings",
    description: "Configure PhreshOS.",
    version: "0.1.11",
    icon: "icon.png",
    categories: ["System"],
    keywords: ["settings", "appearance", "theme"],
    website: "https://github.com/PhreshOS/settings-program",
    buildCommand: "vite-node scripts/build.ts",
    client: {
        location: "dist/client",
        title: "Settings",
        size: { width: "3/4", height: "3/4" },
        position: { x: "1/8", y: "1/8" },
        permissions: {
            appearance: true,
            desktopPreferences: true,
            uploads: true
        },
        development: {
            startCommand: "vite --config vite.client.ts"
        }
    }
})
