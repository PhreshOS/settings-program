import { useState } from "react"
import type { Theme } from "@phreshos/core"
import { useResolvedDesktopPreferences } from "@phreshos/react"
import { AppLayout, SegmentedControl } from "@phreshos/react-ui"
import { Page, SectionHeader } from "../../components/section-parts"
import { useArrival } from "../../components/arrival"
import AppearanceActions from "./actions"
import AppearanceFooter from "./footer"
import Themes from "./themes"
import Colors from "./colors"
import Wallpapers from "./wallpapers"
import Layout from "./layout"
import Material from "./material"
import Shadow from "./shadow"
import Motion from "./motion"
import Taskbar from "./taskbar"
import { Clock, Image, Layers, LayoutPanelTop, Monitor, Moon, Paintbrush, Palette, Ruler, SquareDashed, Sun } from "@phreshos/react-ui/icons"
import Display from "../display"
import type { SettingsPage } from "../../settings/section"

/** The Appearance's pages, in the order the sidebar lists them. */
export const appearancePages: readonly SettingsPage[] = [
    { id: "themes", title: "Themes", icon: Paintbrush },
    { id: "colors", title: "Colors", icon: Palette },
    { id: "wallpapers", title: "Wallpapers", icon: Image },
    { id: "layout", title: "Layout", icon: Ruler },
    { id: "taskbar", title: "Taskbar", icon: LayoutPanelTop },
    { id: "motion", title: "Motion", icon: Clock },
    { id: "material", title: "Material", icon: Layers },
    { id: "shadow", title: "Shadow", icon: SquareDashed },
    // This Desktop's own preferences, beside the System's Appearance: they apply at once, to this browser.
    { id: "desktop", title: "Desktop", icon: Monitor }
]

// The pages whose values differ between light and dark, edited for one theme at a time.
const themed = new Set(["themes", "colors", "material", "shadow"])

/**
 * The System Appearance, one page of it at a time, all edited in one draft and saved together.
 * The values that differ between light and dark are edited for one theme at a time, the one this
 * Desktop shows at first; wallpapers show every theme at once.
 */
export default function Appearance({ rest }: Readonly<{ rest: string | null }>) {
    const page = appearancePages.find(entry => entry.id === rest) ?? appearancePages[0]!
    if (page.id === "desktop") return <Display />
    return <SystemAppearance page={page} />
}

/** One page of the System Appearance, edited in the shared draft and saved for every Desktop. */
function SystemAppearance({ page }: Readonly<{ page: SettingsPage }>) {
    const [theme, setTheme] = useState<Theme>(useResolvedDesktopPreferences().theme)
    // The Appearance is already held by the window, so this page has nothing more to wait for.
    useArrival(true)

    return <>
        <SectionHeader title={page.title}>
            <AppearanceActions />
            {themed.has(page.id) && <SegmentedControl aria-label="Theme being edited" size="small" value={theme} onChange={value => setTheme(value as Theme)}>
                <SegmentedControl.Item id="light"><Sun />Light</SegmentedControl.Item>
                <SegmentedControl.Item id="dark"><Moon />Dark</SegmentedControl.Item>
            </SegmentedControl>}
        </SectionHeader>
        <AppLayout.Content>
            <Page>
                {page.id === "themes" && <Themes theme={theme} />}
                {page.id === "colors" && <Colors theme={theme} />}
                {page.id === "wallpapers" && <Wallpapers />}
                {page.id === "layout" && <Layout />}
                {page.id === "taskbar" && <Taskbar />}
                {page.id === "motion" && <Motion />}
                {page.id === "material" && <Material theme={theme} />}
                {page.id === "shadow" && <Shadow theme={theme} />}
            </Page>
        </AppLayout.Content>
        <AppearanceFooter />
    </>
}
