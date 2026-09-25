import { DesktopProvider, SystemProvider, useDesktopPreferences, useSystemAppearance } from "@phreshos/react"
import { desktop, system } from "@phreshos/client"
import { ProgressBar, UIProvider } from "@phreshos/react-ui"
import Application from "@client/core/application"
import { useMemo } from "react"
import Appearance from "./appearance/appearance"
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
        <Settings>
            <Appearance appearance={appearance} application={application} preferences={preferences} />
        </Settings>
    </UIProvider>
}

function ResourceState({ message }: Readonly<{ message: string }>) {
    return <div className="resource-state"><ProgressBar indeterminate label={message} /></div>
}
