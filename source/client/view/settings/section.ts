import type { ComponentType } from "react"
import type { LucideIcon } from "@phreshos/react-ui/icons"

/** A page within a section, listed under it in the sidebar; its address is the section's, then its own. */
export interface SettingsPage {
    readonly id: string
    readonly title: string
    readonly icon: LucideIcon
}

/**
 * One section of Settings, listed in the sidebar. It draws its own header, content, and footer
 * into the frame, so each section decides what it offers around its content.
 */
export interface SettingsSection {
    readonly id: string
    readonly title: string
    readonly icon: LucideIcon
    /** The group it is listed under, or `null` above every group. */
    readonly group: string | null
    /** Its pages, when it has several; the sidebar lists them under it, and it opens on the first. */
    readonly pages?: readonly SettingsPage[]
    /** `rest` is the address after the section's own, such as one Program's identity or one of its pages. */
    readonly View: ComponentType<{ rest: string | null }>
}
