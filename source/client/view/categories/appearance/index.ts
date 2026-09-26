import { Clock, Image, Layers, LayoutPanelTop, Palette, Ruler, SquareDashed } from "@phreshos/react-ui/icons"
import type { SettingsCategory } from "../../category"
import AppearanceActions from "./actions"
import { AppearanceDraftProvider } from "./draft"
import AppearanceFooter from "./footer"
import Colors from "./pages/colors"
import Layout from "./pages/layout"
import Material from "./pages/material"
import Motion from "./pages/motion"
import Shadow from "./pages/shadow"
import Taskbar from "./pages/taskbar"
import Wallpapers from "./pages/wallpapers"

/** The System Appearance: edited as one draft, saved for every desktop. */
const appearance: SettingsCategory = {
    id: "appearance",
    title: "Appearance",
    icon: Palette,
    Provider: AppearanceDraftProvider,
    Actions: AppearanceActions,
    Footer: AppearanceFooter,
    pages: [
        { id: "colors", title: "Colors", description: "The named colors of each theme.", icon: Palette, Page: Colors },
        { id: "layout", title: "Layout", description: "Spacing and corners shared by everything.", icon: Ruler, Page: Layout },
        { id: "taskbar", title: "Taskbar", description: "Its edge, its size, and how it meets windows.", icon: LayoutPanelTop, Page: Taskbar },
        { id: "motion", title: "Motion", description: "The timing of every visual change.", icon: Clock, Page: Motion },
        { id: "material", title: "Material", description: "The substance of every surface.", icon: Layers, Page: Material },
        { id: "shadow", title: "Shadow", description: "The shadow beneath raised surfaces.", icon: SquareDashed, Page: Shadow },
        { id: "wallpapers", title: "Wallpapers", description: "Images, videos, or pages behind the sign-in screen and the desktop.", icon: Image, Page: Wallpapers }
    ]
}

export default appearance
