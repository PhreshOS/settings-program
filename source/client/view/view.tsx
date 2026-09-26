import { DesktopProvider, SystemProvider, useDesktopPreferences, useSystemAppearance } from "@phreshos/react"
import { desktop, system } from "@phreshos/client"
import { ProgressBar, UIProvider } from "@phreshos/react-ui"
import Application from "@client/core/application"
import { useMemo } from "react"
import { ApplicationProvider } from "./application"
import Settings from "./settings"
import "./style.css"

export default function View() {
    return <SystemProvider system={system} fallback={<ResourceState message="Opening Settings…" />}>
        <DesktopProvider desktop={desktop} fallback={<ResourceState message="Opening Desktop…" />}>
            <ResolvedView />
        </DesktopProvider>
    </SystemProvider>
}

function ResolvedView() {
    const appearance = useSystemAppearance()
    const preferences = useDesktopPreferences()
    const application = useMemo(() => new Application(), [])

    return <UIProvider appearance={appearance} preferences={preferences}>
        <ApplicationProvider application={application}>
            <Settings />
        </ApplicationProvider>
    </UIProvider>
}

function ResourceState({ message }: Readonly<{ message: string }>) {
    return <div className="resource-state"><ProgressBar indeterminate label={message} /></div>
}
