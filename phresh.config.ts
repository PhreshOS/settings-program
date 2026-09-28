import { defineConfig } from "@phreshos/core"

export default defineConfig({
    identity: "settings",
    name: "Settings",
    description: "Configure PhreshOS.",
  version: "0.1.36",
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
        devCommand: "vite --config vite.client.ts"
    }
})
