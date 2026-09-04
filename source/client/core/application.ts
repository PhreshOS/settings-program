import { desktop, system } from "@phreshos/client"
import type { Appearance, DesktopPreferencesUpdate } from "@phreshos/core"

/** Owns Settings operations and coordinates them with their System authority. */
export default class Application {
    public updateAppearance(appearance: Appearance) {
        return system.appearance.update(appearance)
    }

    public updateDesktopPreferences(preferences: DesktopPreferencesUpdate) {
        return desktop.preferences.update(preferences)
    }

    public async upload(file: File) {
        return (await system.uploads.write(file)).file
    }
}
