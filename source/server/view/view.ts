import { context, system } from "@phreshos/server"
import type { Appearance } from "@phreshos/core"
import Application from "@server/core/application"

export default async function view() {
    const application = new Application(system.appearance)

    context.answer("appearance.update", async function ({ payload }) {
        await application.updateAppearance(payload as Appearance)
    })
}
