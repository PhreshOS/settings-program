import { Monitor } from "@phreshos/react-ui/icons"
import type { SettingsCategory } from "../../category"
import Display from "./pages/display"

/** This desktop's own preferences: they apply at once, and only to this browser. */
const desktop: SettingsCategory = {
    id: "desktop",
    title: "Desktop",
    icon: Monitor,
    pages: [
        { id: "display", title: "Display", description: "Theme, animations, and scale on this desktop only.", icon: Monitor, Page: Display }
    ]
}

export default desktop
