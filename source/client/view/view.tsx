import { SystemProvider, useDesktopPreferences, useSystemAppearance } from "@phreshos/react"
import { system } from "@phreshos/client"
import { AppearanceProvider } from "@phreshos/react-ui"
import Application from "@client/core/application"
import { useMemo } from "react"
import { Redirect, Route, Router, Switch } from "wouter"
import Appearance from "./appearance/appearance"
import Settings from "./settings"
import "./style.css"

export default function View() {
    return <SystemProvider
        appearance={system.appearance}
        desktopPreferences={system.desktop.preferences}
        fallback={<ResourceState message="Opening Settings…" />}
    >
        <ResolvedView />
    </SystemProvider>
}

function ResolvedView() {
    const appearance = useSystemAppearance()
    const preferences = useDesktopPreferences()
    const application = useMemo(() => new Application(), [])

    return <AppearanceProvider appearance={appearance} theme={preferences.theme}>
        <Router base={programAssetsBase()}>
            <Settings>
                <Switch>
                    <Route path="/appearance">{() => <Appearance application={application} preferences={preferences} />}</Route>
                    <Route path="/"><Redirect to="/appearance" replace /></Route>
                    <Route><Redirect to="/appearance" replace /></Route>
                </Switch>
            </Settings>
        </Router>
    </AppearanceProvider>
}

function ResourceState({ message }: Readonly<{ message: string }>) {
    return <div className="resource-state" role="status">{message}</div>
}

function programAssetsBase() {
    const path = window.location.pathname
    const marker = "/assets"

    if (!path.startsWith("/program/")) return undefined

    const end = path.indexOf(marker)
    return end < 0 ? undefined : path.slice(0, end + marker.length)
}
