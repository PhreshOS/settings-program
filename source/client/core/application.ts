import { current, system } from "@phreshos/client"
import type { Appearance, ThemePreference } from "@phreshos/core"

/** Owns Settings operations and coordinates them with their System authority. */
export default class Application {
    public updateAppearance(appearance: Appearance) {
        return current.server.ask<void>("appearance.update", appearance)
    }

    public updateTheme(theme: ThemePreference) {
        return system.theme.update(theme)
    }

    public async upload(file: File) {
        return (await system.uploads.write(file)).file
    }
}
