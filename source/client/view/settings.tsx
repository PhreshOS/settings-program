import type { ReactNode } from "react"
import { Surface } from "@phreshos/react-ui"
import { Link, useLocation } from "wouter"

export default function Settings({ children }: Readonly<{ children: ReactNode }>) {
    const [location] = useLocation()

    return <div className="settings">
        <Surface className="settings-navigation" role="navigation" aria-label="Settings">
            <strong>Settings</strong>
            <Link className={location === "/appearance" ? "active" : undefined} href="/appearance">
                Appearance
            </Link>
        </Surface>
        <div className="settings-content">{children}</div>
    </div>
}
