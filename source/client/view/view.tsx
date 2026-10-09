import { DesktopProvider, SystemProvider, useResolvedDesktopPreferences, useSystemAppearance } from "@phreshos/react"
import { desktop, system } from "@phreshos/client"
import { DocumentTheme, Loading, UIProvider } from "@phreshos/react-ui"
import Application from "@client/core/application"
import { useMemo } from "react"
import { ApplicationProvider } from "./application"
import { ArrivalProvider } from "./components/arrival"
import Settings from "./settings/settings"
import "./style.css"

/**
 * Settings appears once its first section has what it opens with, under one Loading; everything
 * that changes afterwards changes in place.
 */
export default function View() {
    return <SystemProvider system={system}>
        <DesktopProvider desktop={desktop}>
            <ResolvedView />
        </DesktopProvider>
    </SystemProvider>
}

function ResolvedView() {
    const appearance = useSystemAppearance()
    const preferences = useResolvedDesktopPreferences()
    const application = useMemo(() => new Application(), [])

    return <UIProvider appearance={appearance} preferences={preferences}>
        <DocumentTheme />
        <ApplicationProvider application={application}>
            <ArrivalProvider>
                <Loading><Settings /></Loading>
            </ArrivalProvider>
        </ApplicationProvider>
    </UIProvider>
}
