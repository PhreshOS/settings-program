import {
    appearanceLimits,
    defaultAppearance,
    type AnimationsPreference,
    type Appearance,
    type AppearanceMaterial,
    type AppearanceShadow,
    type DesktopPreferences,
    type DesktopPreferencesUpdate,
    type ThemePreference
} from "@phreshos/core"
import { Button, useAppearance, useResolveTheme, useTheme } from "@phreshos/react-ui"
import Application from "@client/core/application"
import usePromise from "@libs/react-promise"
import { useEffect, useState, type CSSProperties } from "react"
import { parseAppearance, serializeAppearance } from "./document"

export default function AppearanceSettings({ application, preferences }: Readonly<{
    application: Application
    preferences: DesktopPreferences
}>) {
    const authoritative = useAppearance()
    const theme = useTheme()
    const [draft, setDraft] = useState(() => copy(authoritative))
    const [transfer, setTransfer] = useState<"import" | "export" | null>(null)
    const [document, setDocument] = useState("")
    const [importError, setImportError] = useState<unknown>(null)
    const saving = usePromise((appearance: Appearance) => application.updateAppearance(appearance))
    const preferenceChange = usePromise((update: DesktopPreferencesUpdate) => application.updateDesktopPreferences(update))
    const dirty = JSON.stringify(draft) !== JSON.stringify(authoritative)

    useEffect(() => setDraft(copy(authoritative)), [authoritative])

    function replace<Key extends keyof Appearance>(key: Key, value: Appearance[Key]) {
        setDraft(current => ({ ...current, [key]: value }))
    }

    function replaceColor<Key extends keyof Appearance["colors"]>(key: Key, value: Appearance["colors"][Key]) {
        setDraft(current => ({ ...current, colors: { ...current.colors, [key]: value } }))
    }

    async function save() {
        await saving.safeExecute(draft)
    }

    function importDraft() {
        try {
            setDraft(copy(parseAppearance(document)))
            setImportError(null)
            setTransfer(null)
        } catch (error) {
            setImportError(error)
        }
    }

    return <div className="appearance" style={useResolvedColors(authoritative)}>
        <div className="appearance-heading">
            <div>
                <span>Appearance</span>
                <h1>Shape the desktop</h1>
                <p>Changes are stored by the System and published to every connected desktop.</p>
            </div>
            <div className="appearance-actions">
                <Button disabled={saving.isPending} onPress={() => { setTransfer("import"); setImportError(null) }}>Import</Button>
                <Button onPress={() => setTransfer("export")}>Export</Button>
                <Button disabled={!dirty || saving.isPending} onPress={() => setDraft(copy(authoritative))}>Discard</Button>
                <Button disabled={!dirty} pending={saving.isPending} onPress={() => void save()}>
                    {saving.isPending ? "Saving…" : "Save"}
                </Button>
            </div>
        </div>

        {saving.exception && <ErrorMessage value={saving.exception.current} />}

        {transfer && <section className="settings-group" aria-label={`${transfer === "import" ? "Import" : "Export"} Appearance`}>
            <GroupHeading
                title={transfer === "import" ? "Import Appearance" : "Export Appearance"}
                description={transfer === "import"
                    ? "Paste a complete Appearance JSON document. Load it into the draft, review it, then Save to apply."
                    : "Copy the current draft as JSON. Wallpaper references are included, not the image files; they belong to this System."}
            />
            <textarea
                className="appearance-document"
                aria-label="Appearance JSON"
                spellCheck={false}
                autoCapitalize="off"
                autoFocus
                readOnly={transfer === "export"}
                value={transfer === "export" ? serializeAppearance(draft) : document}
                onChange={event => { setDocument(event.currentTarget.value); setImportError(null) }}
                onFocus={event => { if (transfer === "export") event.currentTarget.select() }}
            />
            {transfer === "import" && importError !== null && <ErrorMessage value={importError} />}
            <div className="appearance-actions">
                {transfer === "import" && <Button color="primary:base" disabled={saving.isPending || !document.trim()} onPress={importDraft}>Load draft</Button>}
                <Button onPress={() => setTransfer(null)}>Close</Button>
            </div>
        </section>}

        <div className="settings-group">
            <GroupHeading title="Theme" description={`The desktop is currently ${theme}.`} />
            <div className="theme-options">
                {(["default", "light", "dark"] as const).map(preference => <Button
                    key={preference}
                    pending={preferenceChange.isPending}
                    onPress={() => void preferenceChange.safeExecute({ theme: preference })}
                >{themeLabel(preference)}</Button>)}
            </div>
            <GroupHeading
                title="Animations"
                description={`Desktop animations are currently ${preferences.animations ? "enabled" : "disabled"}.`}
            />
            <div className="theme-options">
                {(["default", true, false] as const).map(preference => <Button
                    key={String(preference)}
                    pending={preferenceChange.isPending}
                    onPress={() => void preferenceChange.safeExecute({ animations: preference })}
                >{animationsLabel(preference)}</Button>)}
            </div>
            {preferenceChange.exception && <ErrorMessage value={preferenceChange.exception.current} />}
        </div>

        <div className="settings-group">
            <GroupHeading title="Colors" description="Independent colors for both effective themes." />
            <div className="field-grid">
                <ThemedText label="Background" value={draft.colors.background} change={value => replaceColor("background", value)} />
                <ThemedText label="Foreground" value={draft.colors.foreground} change={value => replaceColor("foreground", value)} />
                <ThemedText label="Primary" value={draft.colors.primary} change={value => replaceColor("primary", value)} />
                <ThemedText label="Secondary" value={draft.colors.secondary} change={value => replaceColor("secondary", value)} />
                <ThemedText label="Success" value={draft.colors.success} change={value => replaceColor("success", value)} />
                <ThemedText label="Warning" value={draft.colors.warning} change={value => replaceColor("warning", value)} />
                <ThemedText label="Danger" value={draft.colors.danger} change={value => replaceColor("danger", value)} />
                <ThemedText label="Info" value={draft.colors.info} change={value => replaceColor("info", value)} />
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
            <GroupHeading title="Material" description="Visual substance resolves independently for light and dark themes." />
            <div className="material-themes">
                <MaterialFields
                    label="Light"
                    value={draft.material.light}
                    change={value => replace("material", { ...draft.material, light: value })}
                />
                <MaterialFields
                    label="Dark"
                    value={draft.material.dark}
                    change={value => replace("material", { ...draft.material, dark: value })}
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

        <div className="settings-group">
            <GroupHeading title="Shadow" description="Independent outer shadow geometry and opacity." />
            <div className="field-grid">
                {(["light", "dark"] as const).map(theme => <div key={theme}>
                    <strong>{themeLabel(theme)}</strong>
                    {(Object.keys(appearanceLimits.shadow) as (keyof AppearanceShadow)[]).map(key => <RangeField
                        key={key}
                        label={shadowLabels[key]}
                        value={draft.shadow[theme][key]}
                        range={appearanceLimits.shadow[key]}
                        change={value => replace("shadow", { ...draft.shadow, [theme]: { ...draft.shadow[theme], [key]: value } })}
                    />)}
                </div>)}
            </div>
        </div>

        <div className="reset-appearance">
            <div>
                <strong>Standard appearance</strong>
                <span>Restore every value to the shared PhreshOS defaults.</span>
            </div>
            <Button onPress={() => setDraft(copy(defaultAppearance))}>Reset</Button>
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

function MaterialFields({ label, value, change }: Readonly<{
    label: string
    value: AppearanceMaterial
    change: (value: AppearanceMaterial) => void
}>) {
    return <div className="material-fields">
        <strong>{label}</strong>
        {(Object.keys(appearanceLimits.material) as (keyof AppearanceMaterial)[]).map(key => <RangeField
            key={key}
            label={materialLabels[key]}
            value={value[key]}
            range={appearanceLimits.material[key]}
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
    const background = useResolveTheme(appearance.colors.background)
    const foreground = useResolveTheme(appearance.colors.foreground)
    const primary = useResolveTheme(appearance.colors.primary)

    return {
        "--settings-background": background,
        "--settings-foreground": foreground,
        "--settings-primary": primary
    } as CSSProperties
}

function copy(appearance: Appearance): Appearance {
    return {
        colors: {
            background: { ...appearance.colors.background },
            foreground: { ...appearance.colors.foreground },
            primary: { ...appearance.colors.primary },
            secondary: { ...appearance.colors.secondary },
            success: { ...appearance.colors.success },
            warning: { ...appearance.colors.warning },
            danger: { ...appearance.colors.danger },
            info: { ...appearance.colors.info }
        },
        spacing: { ...appearance.spacing },
        radius: { ...appearance.radius },
        shadow: {
            light: { ...appearance.shadow.light },
            dark: { ...appearance.shadow.dark }
        },
        material: {
            light: { ...appearance.material.light },
            dark: { ...appearance.material.dark }
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

function animationsLabel(animations: AnimationsPreference) {
    return animations === "default" ? "Follow system" : animations ? "Enabled" : "Disabled"
}

const materialLabels: Readonly<Record<keyof AppearanceMaterial, string>> = {
    grain: "Grain intensity",
    grainAmount: "Grain amount",
    backdrop: "Backdrop blur",
    opacity: "Opacity",
    distortion: "Distortion",
    saturation: "Saturation"
}

const shadowLabels: Readonly<Record<keyof AppearanceShadow, string>> = {
    x: "Horizontal offset",
    y: "Vertical offset",
    blur: "Blur",
    spread: "Spread",
    opacity: "Opacity"
}
