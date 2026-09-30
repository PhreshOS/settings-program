import type { ReactNode } from "react"
import { AppLayout, Button, Flex, Surface, Text, useAppearance, useColor, useScale } from "@phreshos/react-ui"
import { PanelLeft } from "@phreshos/react-ui/icons"
import { useFrame } from "../settings/frame"

/**
 * A section's header: its name, where it is within its section when it is deeper, and its own
 * tools at the end. In a narrow window it starts with the button that shows the sections.
 */
export function SectionHeader({ title, above, children }: Readonly<{
    title: ReactNode
    /** The step above this one, such as the Programs above one Program, which returns to it. */
    above?: Readonly<{ title: string, address: string }>
    children?: ReactNode
}>) {
    const space = useScale(useAppearance().spacing)
    const { narrow, showSections, go } = useFrame()

    return <AppLayout.Header style={{ paddingInline: space.small, marginBottom: space.small }}>
        {narrow && <Button iconOnly depth="flat" size="small" aria-label="Sections" onPress={showSections}><PanelLeft /></Button>}
        <Flex align="baseline" gap="small" style={{ flex: "1 1 auto", minWidth: 0 }}>
            {above && <Button depth="none" size="small" onPress={() => go(above.address)} style={{ flex: "none" }}>
                <Text size="large" tone="secondary">{above.title} ›</Text>
            </Button>}
            <Text size="xlarge" className="truncate" style={{ fontWeight: 600 }}>{title}</Text>
        </Flex>
        {children}
    </AppLayout.Header>
}

/** A section's status line below its content, with what it offers at the end. */
export function SectionFooter({ status, problem = false, children }: Readonly<{ status?: ReactNode, problem?: boolean, children?: ReactNode }>) {
    const space = useScale(useAppearance().spacing)
    const danger = useColor("danger").base

    return <AppLayout.Footer style={{ paddingInline: space.small, paddingTop: space.medium }}>
        <span role="status" className="truncate" style={{ flex: "1 1 auto", minWidth: 0 }}>
            <Text tone={problem ? undefined : "secondary"} size="small" className="tabular" style={problem ? { color: danger } : undefined}>{status}</Text>
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
        <Surface depth="flat" color="primary:subtle" style={{ display: "grid", minWidth: 0 }}>{children}</Surface>
    </Flex>
}

/** One setting in a Group: what it is on one side, how to change it on the other. */
export function Row({ label, description, children }: Readonly<{ label: ReactNode, description?: ReactNode, children?: ReactNode }>) {
    const space = useScale(useAppearance().spacing)

    return <div className="row" style={{ display: "flex", alignItems: "center", gap: space.medium, padding: `${space.small}px ${space.medium}px`, minHeight: space.xlarge * 1.5 }}>
        <Flex direction="column" style={{ flex: "1 1 auto", minWidth: 0 }}>
            <Text size="medium">{label}</Text>
            {description != null && <Text size="small" tone="secondary">{description}</Text>}
        </Flex>
        {children}
    </div>
}

/** A section's content: its groups stacked, as wide as reads well. */
export function Page({ children, wide = false }: Readonly<{ children: ReactNode, wide?: boolean }>) {
    const space = useScale(useAppearance().spacing)
    return <div style={{ display: "grid", gap: space.xlarge, alignContent: "start", maxWidth: wide ? undefined : "48rem" }}>{children}</div>
}

/** Fields inside a Group, as many side by side as the width allows. */
export function Fields({ children }: Readonly<{ children: ReactNode }>) {
    const space = useScale(useAppearance().spacing)
    return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(14rem, 100%), 1fr))", gap: `${space.large}px ${space.xlarge}px`, padding: space.medium }}>{children}</div>
}
