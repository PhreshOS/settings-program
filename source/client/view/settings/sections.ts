import { FileText, House, KeyRound, LayoutGrid, Monitor, Palette, Power, SquareArrowOutUpRight, Users } from "@phreshos/react-ui/icons"
import type { SettingsSection } from "./section"
import Overview from "../sections/overview"
import Appearance from "../sections/appearance/appearance"
import Desktop from "../sections/display"
import Programs from "../sections/programs/programs"
import Startup from "../sections/startup"
import Defaults from "../sections/defaults"
import SignIn from "../sections/sign-in"
import Sessions from "../sections/sessions"
import Logs from "../sections/logs"

/** Every section, in the order the sidebar lists them. A new section is one entry here and its file. */
export const sections: readonly SettingsSection[] = [
    { id: "appearance", title: "Appearance", icon: Palette, group: "Appearance", View: Appearance },
    { id: "desktop", title: "Desktop", icon: Monitor, group: "Appearance", View: Desktop },
    { id: "programs", title: "Programs", icon: LayoutGrid, group: "Programs", View: Programs },
    { id: "startup", title: "Startup", icon: Power, group: "Programs", View: Startup },
    { id: "defaults", title: "Defaults", icon: SquareArrowOutUpRight, group: "Programs", View: Defaults },
    { id: "sign-in", title: "Sign-in", icon: KeyRound, group: "Security", View: SignIn },
    { id: "sessions", title: "Sessions", icon: Users, group: "Security", View: Sessions },
    { id: "overview", title: "Overview", icon: House, group: "System", View: Overview },
    { id: "logs", title: "Logs", icon: FileText, group: "System", View: Logs }
]
