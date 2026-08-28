import type { Appearance, WritableAppearance } from "@phreshos/core"

/** Owns Settings' authoritative System operations. */
export default class Application {
    public constructor(private readonly appearance: WritableAppearance) {}

    public updateAppearance(value: Appearance) {
        return this.appearance.update(value)
    }
}
