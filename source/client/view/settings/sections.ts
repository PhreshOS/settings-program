import { Activity, FileText, House, KeyRound, LayoutGrid, Monitor, Palette, Power, SquareArrowOutUpRight, Waypoints } from "@phreshos/react-ui/icons"
import type { SettingsSection } from "./section"
import Overview from "../sections/overview"
import Appearance from "../sections/appearance/appearance"
import Desktop from "../sections/display"
import Programs from "../sections/programs/programs"
import Processes from "../sections/processes/processes"
import Services from "../sections/services"
import Startup from "../sections/startup"
import Defaults from "../sections/defaults"
import Authentication from "../sections/authentication"
import Logs from "../sections/logs"

/** Every section, in the order the sidebar lists them. A new section is one entry here and its file. */
export const sections: readonly SettingsSection[] = [
    { id: "overview", title: "Overview", icon: House, group: null, View: Overview },
    { id: "programs", title: "Programs", icon: LayoutGrid, group: "Programs", View: Programs },
    { id: "processes", title: "Processes", icon: Activity, group: "Programs", View: Processes },
    { id: "services", title: "Services", icon: Waypoints, group: "Programs", View: Services },
    { id: "startup", title: "Startup", icon: Power, group: "Programs", View: Startup },
    { id: "defaults", title: "Defaults", icon: SquareArrowOutUpRight, group: "Programs", View: Defaults },
    { id: "desktop", title: "Preferences", icon: Monitor, group: "Desktop", View: Desktop },
    { id: "appearance", title: "Appearance", icon: Palette, group: "System", View: Appearance },
    { id: "authentication", title: "Authentication", icon: KeyRound, group: "System", View: Authentication },
    { id: "logs", title: "Logs", icon: FileText, group: "System", View: Logs }
]
