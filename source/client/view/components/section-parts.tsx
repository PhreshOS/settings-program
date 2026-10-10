import type { ReactNode } from "react"
import { AppLayout, Breadcrumbs, Button, DropdownMenu, Flex, Menu, Surface, Text, Toolbar, useAppearance, useAppLayout, useColor, useScale } from "@phreshos/react-ui"
import { ArrowLeft, ArrowRight, ChevronDown } from "@phreshos/react-ui/icons"
import { useFrame } from "../settings/frame"

/**
 * A section's header, laid out as Files' is: the way around (the sections, back, forward) kept
 * together, then where it is, then its own tools at the end. A deeper page lists the step above it,
 * a way back to it; in a narrow window only the current step shows, and it opens the one above.
 */
export function SectionHeader({ title, above, children }: Readonly<{
    title: ReactNode
    /** The step above this one, such as the Programs above one Program, which returns to it. */
    above?: Readonly<{ title: string, address: string }>
    children?: ReactNode
}>) {
    const space = useScale(useAppearance().spacing)
    const { go, back, forward } = useFrame()
    const { narrow } = useAppLayout()

    return <AppLayout.Header style={{ gap: space.medium, paddingInline: space.small, marginBottom: space.small }}>
        <Toolbar aria-label="Navigation" gap="xsmall">
            <AppLayout.SidebarToggle />
            <Button iconOnly depth="flat" size="small" aria-label="Back" disabled={back === null} onPress={() => back?.()}><ArrowLeft /></Button>
            <Button iconOnly depth="flat" size="small" aria-label="Forward" disabled={forward === null} onPress={() => forward?.()}><ArrowRight /></Button>
        </Toolbar>
        <div className="path">
            {narrow && above
                ? <DropdownMenu>
                    <DropdownMenu.Trigger depth="none" size="small" style={{ maxWidth: "100%", flexShrink: 1 }} aria-label={typeof title === "string" ? `${title}, the step above` : "The step above"}>
                        <span className="path-current">{title}</span><ChevronDown />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                        <Menu aria-label="The step above" size="small" onAction={key => go(String(key))}>
                            <Menu.Item id={above.address}>{above.title}</Menu.Item>
                        </Menu>
                    </DropdownMenu.Content>
                </DropdownMenu>
                : <Breadcrumbs size="small" style={{ flexWrap: "nowrap", minWidth: 0 }} onAction={key => go(String(key))}>
                    {above && <Breadcrumbs.Item id={above.address}>{above.title}</Breadcrumbs.Item>}
                    <Breadcrumbs.Item id="current">{title}</Breadcrumbs.Item>
                </Breadcrumbs>}
        </div>
        {children}
    </AppLayout.Header>
}

/** A section's status line below its content, with what it offers at the end. */
export function SectionFooter({ status, problem = false, children }: Readonly<{ status?: ReactNode, problem?: boolean, children?: ReactNode }>) {
    const space = useScale(useAppearance().spacing)
    const danger = useColor("danger").base

    return <AppLayout.Footer style={{ paddingInline: space.small, paddingTop: space.medium }}>
        {/* At the end of the row, as every footer of an AppLayout. */}
        <span role="status" style={{ display: "flex", minWidth: 0 }}>
            <Text truncate tone={problem ? undefined : "secondary"} size="small" className="tabular" style={problem ? { color: danger } : undefined}>{status}</Text>
        </span>
        {children}
    </AppLayout.Footer>
}

/**
 * A titled group of settings: its name above, anything that applies to the whole group beside the
 * name, and its rows on one Surface standing on the content.
 */
export function Group({ title, description, aside, children }: Readonly<{ title: ReactNode, description?: ReactNode, aside?: ReactNode, children: ReactNode }>) {
    const space = useScale(useAppearance().spacing)

    return <Flex direction="column" gap="small" style={{ minWidth: 0 }}>
        <Flex align="center" gap="small" style={{ minHeight: space.xlarge, paddingInline: space.xsmall }}>
            <Flex direction="column" style={{ flex: "1 1 auto", minWidth: 0 }}>
                <Text size="small" style={{ fontWeight: 600 }}>{title}</Text>
                {description != null && <Text size="small" tone="secondary">{description}</Text>}
            </Flex>
            {aside}
        </Flex>
        <Surface depth="flat" color="default" style={{ display: "grid", minWidth: 0 }}>{children}</Surface>
    </Flex>
}

/**
 * One setting in a Group: what it is on one side, how to change it on the other. A `truncate`
 * description stays on one line, cut where the row is narrow, and reads whole on hover.
 */
export function Row({ label, description, truncate = false, children }: Readonly<{ label: ReactNode, description?: ReactNode, truncate?: boolean, children?: ReactNode }>) {
    const space = useScale(useAppearance().spacing)

    return <div className="row" style={{ display: "flex", alignItems: "center", gap: space.medium, padding: `${space.small}px ${space.medium}px`, minHeight: space.xlarge * 1.5 }}>
        <Flex direction="column" style={{ flex: "1 1 auto", minWidth: 0 }}>
            <Text size="medium">{label}</Text>
            {description != null && <Text size="small" tone="secondary" truncate={truncate} title={truncate && typeof description === "string" ? description : undefined}>{description}</Text>}
        </Flex>
        {children}
    </div>
}

/** A section's content: its groups stacked, as wide as reads well. */
export function Page({ children, wide = false }: Readonly<{ children: ReactNode, wide?: boolean }>) {
    const space = useScale(useAppearance().spacing)
    // A page narrower than the content stands in its middle.
    return <div style={{ display: "grid", gap: space.xlarge, alignContent: "start", width: "100%", maxWidth: wide ? undefined : "48rem", marginInline: "auto" }}>{children}</div>
}

/** Fields inside a Group, as many side by side as the width allows. */
export function Fields({ children }: Readonly<{ children: ReactNode }>) {
    const space = useScale(useAppearance().spacing)
    return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(14rem, 100%), 1fr))", gap: `${space.large}px ${space.xlarge}px`, padding: space.medium }}>{children}</div>
}

/** A quiet line where a list has nothing to show, in the middle of the content, as Files says an empty folder. */
export function Empty({ children }: Readonly<{ children: ReactNode }>) {
    return <AppLayout.Placeholder><Text tone="secondary" size="small">{children}</Text></AppLayout.Placeholder>
}
