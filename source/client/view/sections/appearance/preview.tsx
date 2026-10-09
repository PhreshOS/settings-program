import type { Appearance, Theme } from "@phreshos/core"

type Shown = Pick<Appearance, "colors" | "radius" | "spacing" | "shadow" | "material">

/**
 * A small Desktop in an Appearance, in light or dark: its wallpaper, or its background where there
 * is none to show, one window, and the primary color on it.
 */
export default function Preview({ look, mode, wallpaper, height = "4rem" }: Readonly<{ look: Shown, mode: Theme, wallpaper?: string | null, height?: string }>) {
    const colors = look.colors[mode] ?? look.colors.light
    const shadow = look.shadow[mode] ?? look.shadow.light
    const material = look.material[mode] ?? look.material.light
    const radius = look.radius / 2
    const gap = look.spacing / 3

    return <div aria-hidden="true" style={{ position: "relative", height, background: wallpaper ? `center / cover url("${wallpaper}") ${colors.background}` : colors.background, overflow: "hidden" }}>
        <div style={{
            position: "absolute", inset: "0.5rem 1rem 0.5rem 0.5rem", borderRadius: radius, display: "flex", gap, padding: gap,
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
        <div style={{ position: "absolute", top: "0.375rem", bottom: "0.375rem", right: "0.3rem", width: "0.4rem", borderRadius: radius, background: `color-mix(in oklab, ${colors.default} 85%, transparent)` }} />
    </div>
}

/** An Appearance in light and dark, side by side. */
export function PreviewPair({ look, wallpapers, height }: Readonly<{ look: Shown, wallpapers?: Readonly<{ light: string | null, dark: string | null }>, height?: string }>) {
    return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderRadius: "0.5rem", overflow: "hidden" }}>
        <Preview look={look} mode="light" wallpaper={wallpapers?.light} height={height} />
        <Preview look={look} mode="dark" wallpaper={wallpapers?.dark} height={height} />
    </div>
}
