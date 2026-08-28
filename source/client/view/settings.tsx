import type { ReactNode } from "react"
import { Link, useLocation } from "wouter"

export default function Settings({ children }: Readonly<{ children: ReactNode }>) {
    const [location] = useLocation()

    return <div className="settings">
        <div className="settings-navigation">
            <strong>Settings</strong>
            <Link className={location === "/appearance" ? "active" : undefined} href="/appearance">
                Appearance
            </Link>
        </div>
        <div className="settings-content">{children}</div>
    </div>
}
