import { appearanceLimits, standardAppearance, type Appearance, type AppearanceSurface, type ThemePreference } from "@phreshos/core"
import { Button, useAppearance, useResolveTheme, useTheme } from "@phreshos/react-ui"
import Application from "@client/core/application"
import usePromise from "@libs/react-promise"
import { useEffect, useState, type CSSProperties } from "react"

export default function AppearanceSettings({ application }: Readonly<{ application: Application }>) {
    const authoritative = useAppearance()
    const theme = useTheme()
    const [draft, setDraft] = useState(() => copy(authoritative))
    const saving = usePromise((appearance: Appearance) => application.updateAppearance(appearance))
    const themeChange = usePromise((preference: ThemePreference) => application.updateTheme(preference))
    const dirty = JSON.stringify(draft) !== JSON.stringify(authoritative)

    useEffect(() => setDraft(copy(authoritative)), [authoritative])

    function replace<Key extends keyof Appearance>(key: Key, value: Appearance[Key]) {
        setDraft(current => ({ ...current, [key]: value }))
    }

    async function save() {
        await saving.safeExecute(draft)
    }

    return <div className="appearance" style={useResolvedColors(authoritative)}>
        <div className="appearance-heading">
            <div>
                <span>Appearance</span>
                <h1>Shape the desktop</h1>
                <p>Changes are stored by the System and published to every connected desktop.</p>
            </div>
            <div className="appearance-actions">
                <Button disabled={!dirty || saving.isPending} onPress={() => setDraft(copy(authoritative))}>Discard</Button>
                <Button disabled={!dirty} pending={saving.isPending} onPress={() => void save()}>
                    {saving.isPending ? "Saving…" : "Save"}
                </Button>
            </div>
        </div>

        {saving.exception && <ErrorMessage value={saving.exception.current} />}

        <div className="settings-group">
            <GroupHeading title="Theme" description={`The desktop is currently ${theme}.`} />
            <div className="theme-options">
                {(["default", "light", "dark"] as const).map(preference => <Button
                    key={preference}
                    pending={themeChange.isPending}
                    onPress={() => void themeChange.safeExecute(preference)}
                >{themeLabel(preference)}</Button>)}
            </div>
            {themeChange.exception && <ErrorMessage value={themeChange.exception.current} />}
        </div>

        <div className="settings-group">
            <GroupHeading title="Colors" description="Independent colors for both effective themes." />
            <div className="field-grid">
                <ThemedText label="Background" value={draft.background} change={value => replace("background", value)} />
                <ThemedText label="Foreground" value={draft.foreground} change={value => replace("foreground", value)} />
                <ThemedText label="Accent" value={draft.accent} change={value => replace("accent", value)} />
            </div>
        </div>

        <div className="settings-group">
            <GroupHeading title="Layout" description="Shared spacing and corner dimensions." />
            <div className="field-grid compact">
                <RangeField
                    label="Spacing"
                    value={draft.spacing.light}
                    range={appearanceLimits.spacing}
                    change={value => replace("spacing", { light: value })}
                />
                <RangeField
                    label="Radius"
                    value={draft.radius.light}
                    range={appearanceLimits.radius}
                    change={value => replace("radius", { light: value })}
                />
            </div>
        </div>

        <div className="settings-group">
            <GroupHeading title="Surface" description="Material values resolve independently for light and dark themes." />
            <div className="surface-themes">
                <SurfaceFields
                    label="Light"
                    value={draft.surface.light}
                    change={value => replace("surface", { ...draft.surface, light: value })}
                />
                <SurfaceFields
                    label="Dark"
                    value={draft.surface.dark}
                    change={value => replace("surface", { ...draft.surface, dark: value })}
                />
            </div>
        </div>

        <div className="settings-group">
            <GroupHeading title="Wallpapers" description="Choose separate images for each desktop theme." />
            <div className="wallpaper-grid">
                <WallpaperFields
                    title="Sign in"
                    value={draft.signInWallpaper}
                    application={application}
                    change={value => replace("signInWallpaper", value)}
                />
                <WallpaperFields
                    title="Desktop"
                    value={draft.desktopWallpaper}
                    application={application}
                    change={value => replace("desktopWallpaper", value)}
                />
            </div>
        </div>

        <div className="reset-appearance">
            <div>
                <strong>Standard appearance</strong>
                <span>Restore every value to the shared PhreshOS defaults.</span>
            </div>
            <Button onPress={() => setDraft(copy(standardAppearance))}>Reset</Button>
        </div>
    </div>
}

function GroupHeading({ title, description }: Readonly<{ title: string, description: string }>) {
    return <div className="group-heading">
        <h2>{title}</h2>
        <p>{description}</p>
    </div>
}

function ThemedText({ label, value, change }: Readonly<{
    label: string
    value: Readonly<{ light: string, dark: string }>
    change: (value: Readonly<{ light: string, dark: string }>) => void
}>) {
    return <div className="themed-field">
        <strong>{label}</strong>
        <TextField label="Light" value={value.light} change={light => change({ ...value, light })} />
        <TextField label="Dark" value={value.dark} change={dark => change({ ...value, dark })} />
    </div>
}

function TextField({ label, value, change }: Readonly<{ label: string, value: string, change: (value: string) => void }>) {
    return <label className="text-field">
        <span>{label}</span>
        <input className="color-text" value={value} onChange={event => change(event.currentTarget.value)} />
        <input
            className="color-picker"
            type="color"
            value={pickerColor(value)}
            aria-label={`Choose ${label.toLowerCase()} color`}
            onChange={event => change(event.currentTarget.value)}
        />
    </label>
}

function RangeField({ label, value, range, change }: Readonly<{
    label: string
    value: number
    range: Readonly<{ minimum: number, maximum: number }>
    change: (value: number) => void
}>) {
    const step = range.maximum <= 3 ? 0.01 : 1

    return <label className="range-field">
        <span>{label}</span>
        <input
            type="range"
            min={range.minimum}
            max={range.maximum}
            step={step}
            value={value}
            onChange={event => change(event.currentTarget.valueAsNumber)}
        />
        <output>{format(value)}</output>
    </label>
}

function SurfaceFields({ label, value, change }: Readonly<{
    label: string
    value: AppearanceSurface
    change: (value: AppearanceSurface) => void
}>) {
    return <div className="surface-fields">
        <strong>{label}</strong>
        {(Object.keys(appearanceLimits.surface) as (keyof AppearanceSurface)[]).map(key => <RangeField
            key={key}
            label={surfaceLabels[key]}
            value={value[key]}
            range={appearanceLimits.surface[key]}
            change={next => change({ ...value, [key]: next })}
        />)}
    </div>
}

function WallpaperFields({ title, value, application, change }: Readonly<{
    title: string
    value: Readonly<{ light: string | null, dark: string | null }>
    application: Application
    change: (value: Readonly<{ light: string | null, dark: string | null }>) => void
}>) {
    return <div className="wallpaper-fields">
        <strong>{title}</strong>
        <WallpaperField label="Light" value={value.light} application={application} change={light => change({ ...value, light })} />
        <WallpaperField label="Dark" value={value.dark} application={application} change={dark => change({ ...value, dark })} />
    </div>
}

function WallpaperField({ label, value, application, change }: Readonly<{
    label: string
    value: string | null
    application: Application
    change: (value: string | null) => void
}>) {
    const uploading = usePromise((file: File) => application.upload(file))

    async function select(file: File | undefined) {
        if (!file) return
        const key = await uploading.safeExecute(file)
        if (key) change(key)
    }

    return <div className="wallpaper-field">
        <span>{label}</span>
        <label className="file-action">
            {uploading.isPending ? "Uploading…" : value ? "Replace" : "Choose image"}
            <input type="file" accept="image/*" disabled={uploading.isPending} onChange={event => void select(event.currentTarget.files?.[0])} />
        </label>
        {value && <Button size="small" onPress={() => change(null)}>Clear</Button>}
        {uploading.exception && <ErrorMessage value={uploading.exception.current} />}
    </div>
}

function ErrorMessage({ value }: Readonly<{ value: unknown }>) {
    return <p className="operation-error" role="alert">{value instanceof Error ? value.message : "The operation failed"}</p>
}

function useResolvedColors(appearance: Appearance): CSSProperties {
    const background = useResolveTheme(appearance.background)
    const foreground = useResolveTheme(appearance.foreground)
    const accent = useResolveTheme(appearance.accent)

    return {
        "--settings-background": background,
        "--settings-foreground": foreground,
        "--settings-accent": accent
    } as CSSProperties
}

function copy(appearance: Appearance): Appearance {
    return {
        background: { ...appearance.background },
        foreground: { ...appearance.foreground },
        accent: { ...appearance.accent },
        spacing: { ...appearance.spacing },
        radius: { ...appearance.radius },
        surface: {
            light: { ...appearance.surface.light },
            dark: { ...appearance.surface.dark }
        },
        signInWallpaper: { ...appearance.signInWallpaper },
        desktopWallpaper: { ...appearance.desktopWallpaper }
    }
}

function format(value: number) {
    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")
}

function pickerColor(value: string) {
    if (/^#[\da-f]{6}$/i.test(value)) return value

    const short = /^#([\da-f])([\da-f])([\da-f])$/i.exec(value)
    return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : "#000000"
}

function themeLabel(theme: ThemePreference) {
    return theme === "default" ? "Follow system" : theme === "light" ? "Light" : "Dark"
}

const surfaceLabels: Readonly<Record<keyof AppearanceSurface, string>> = {
    grain: "Grain intensity",
    grainAmount: "Grain amount",
    backdrop: "Backdrop blur",
    opacity: "Opacity",
    distortion: "Distortion",
    waves: "Waves",
    ripples: "Ripples",
    saturation: "Saturation",
    brightness: "Brightness"
}
