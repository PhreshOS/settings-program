import type { ReactNode } from "react"
import { ScrollArea, Tabs } from "@phreshos/react-ui"
import { useLocation } from "wouter"

export default function Settings({ children }: Readonly<{ children: ReactNode }>) {
    const [, navigate] = useLocation()

    return <Tabs
        className="settings"
        orientation="vertical"
        value="appearance"
        onChange={value => navigate(`/${value}`)}
    >
        <Tabs.List className="settings-navigation" aria-label="Settings">
            <Tabs.Tab id="appearance">Appearance</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panels className="settings-panels">
            <Tabs.Panel id="appearance" className="settings-panel">
                <ScrollArea className="settings-content">{children}</ScrollArea>
            </Tabs.Panel>
        </Tabs.Panels>
    </Tabs>
}
