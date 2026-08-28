import { current, system } from "@phreshos/client"
import type { Appearance, DesktopPreferencesUpdate } from "@phreshos/core"

/** Owns Settings operations and coordinates them with their System authority. */
export default class Application {
    public updateAppearance(appearance: Appearance) {
        return current.server.ask<void>("appearance.update", appearance)
    }

    public updateDesktopPreferences(preferences: DesktopPreferencesUpdate) {
        return system.desktopPreferences.update(preferences)
    }

    public async upload(file: File) {
        return (await system.uploads.write(file)).file
    }
}
