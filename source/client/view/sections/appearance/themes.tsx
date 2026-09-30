import type { Theme } from "@phreshos/core"
import { GridList, Text, useAppearance, useScale } from "@phreshos/react-ui"
import { applyTheme, themeOf, themes, type SettingsTheme } from "@client/core/themes"
import { Group } from "../../components/section-parts"
import { useAppearanceDraft } from "./draft"

/**
 * Ready looks to start from. Choosing one fills the draft with its look, leaving the Taskbar and the
 * wallpapers as they are; nothing changes until the draft is saved.
 */
export default function Themes({ theme }: Readonly<{ theme: Theme }>) {
    const { draft, load } = useAppearanceDraft()
    const space = useScale(useAppearance().spacing)
    const current = themeOf(draft)

    return <Group title="Themes" description={current ? `The draft is ${current.name}.` : "The draft is your own look."}>
        <GridList aria-label="Themes" selectionMode="single" itemWidth={space.xlarge * 6} value={current?.id ?? null} style={{ padding: space.small }}
            onChange={id => {
                const chosen = themes.find(entry => entry.id === id)
                if (!chosen) return
                load(applyTheme(draft, chosen))
            }}>
            {themes.map(entry => <GridList.Item key={entry.id} id={entry.id} textValue={entry.name}>
                <Preview theme={entry} mode={theme} />
                <Text size="small" style={{ fontWeight: 600 }}>{entry.name}</Text>
                <Text size="xsmall" tone="secondary">{entry.description}</Text>
            </GridList.Item>)}
        </GridList>
    </Group>
}

/** A small Desktop in the theme's look: its background, one window, and the primary color on it. */
function Preview({ theme, mode }: Readonly<{ theme: SettingsTheme, mode: Theme }>) {
    const colors = theme.look.colors[mode] ?? theme.look.colors.light
    const shadow = theme.look.shadow[mode] ?? theme.look.shadow.light
    const material = theme.look.material[mode] ?? theme.look.material.light
    const radius = theme.look.radius / 2
    const gap = theme.look.spacing / 3

    return <div aria-hidden="true" style={{ position: "relative", height: "4.5rem", borderRadius: radius + 2, background: colors.background, overflow: "hidden", boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${colors.foreground} 10%, transparent)` }}>
        <div style={{
            position: "absolute", inset: "0.625rem 1.25rem 0.625rem 0.625rem", borderRadius: radius, display: "flex", gap, padding: gap,
            background: `color-mix(in oklab, ${colors.default} ${Math.round(material.opacity * 100)}%, transparent)`,
            boxShadow: `${shadow.x / 3}px ${shadow.y / 3}px ${shadow.blur / 3}px color-mix(in oklab, ${colors.foreground} ${Math.round(Math.max(shadow.opacity, 0.04) * 100)}%, transparent), 0 0 0 1px color-mix(in oklab, ${colors.foreground} 8%, transparent)`
        }}>
            <div style={{ display: "grid", alignContent: "start", gap: 3, width: "35%" }}>
                <span style={{ height: 5, borderRadius: 3, background: colors.primary }} />
                <span style={{ height: 5, borderRadius: 3, background: `color-mix(in oklab, ${colors.foreground} 22%, transparent)` }} />
                <span style={{ height: 5, width: "70%", borderRadius: 3, background: `color-mix(in oklab, ${colors.foreground} 22%, transparent)` }} />
            </div>
            <div style={{ flex: "1 1 auto", borderRadius: Math.max(radius - 2, 2), background: `color-mix(in oklab, ${colors.foreground} 6%, transparent)` }} />
        </div>
        <div style={{ position: "absolute", top: "0.5rem", bottom: "0.5rem", right: "0.375rem", width: "0.5rem", borderRadius: radius, background: `color-mix(in oklab, ${colors.default} 85%, transparent)` }} />
    </div>
}
