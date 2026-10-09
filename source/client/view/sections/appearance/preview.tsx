import type { Appearance, Theme, ThemedValue } from "@phreshos/core"
import { wallpaperSource } from "./wallpaper"

/**
 * A small Desktop in an Appearance, in light or dark: its wallpaper, one window, and the primary
 * color on it. `pictures` are the files Settings carries for a ready Appearance, shown as they are.
 */
export default function Preview({ look, mode, height = "4rem", pictures }: Readonly<{ look: Appearance, mode: Theme, height?: string, pictures?: ThemedValue<string> }>) {
    const colors = look.colors[mode] ?? look.colors.light
    const shadow = look.shadow[mode] ?? look.shadow.light
    const material = look.material[mode] ?? look.material.light
    const radius = look.radius / 2
    const gap = look.spacing / 3
    const wallpaper = pictures ? { url: pictures[mode], kind: "image" } : wallpaperSource(look.wallpapers[mode].desktop)

    return <div aria-hidden="true" style={{ position: "relative", height, background: wallpaper.kind === "image" ? `center / cover url("${wallpaper.url}") ${colors.background}` : colors.background, overflow: "hidden" }}>
        {wallpaper.kind === "video" && <video src={wallpaper.url} muted playsInline preload="metadata" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
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
export function PreviewPair({ look, height, pictures }: Readonly<{ look: Appearance, height?: string, pictures?: ThemedValue<string> }>) {
    return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderRadius: "0.5rem", overflow: "hidden" }}>
        <Preview look={look} mode="light" height={height} pictures={pictures} />
        <Preview look={look} mode="dark" height={height} pictures={pictures} />
    </div>
}
