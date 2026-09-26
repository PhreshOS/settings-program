import type { ComponentType, ReactNode } from "react"
import type { LucideIcon } from "@phreshos/react-ui/icons"

/** One page of settings, shown in the content region. */
export interface SettingsPage {
    readonly id: string
    readonly title: string
    readonly description: string
    readonly icon: LucideIcon
    readonly Page: ComponentType
}

/**
 * One category of settings: a branch of the navigation holding its pages.
 * A category owns its state through `Provider`, which wraps all its pages,
 * and may add `Actions` to the header and a `Footer` below the content.
 */
export interface SettingsCategory {
    readonly id: string
    readonly title: string
    readonly icon: LucideIcon
    readonly pages: readonly [SettingsPage, ...SettingsPage[]]
    readonly Provider?: ComponentType<{ children: ReactNode }>
    readonly Actions?: ComponentType
    readonly Footer?: ComponentType
}
