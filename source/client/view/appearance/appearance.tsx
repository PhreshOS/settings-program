import {
    appearanceLimits,
    defaultAppearance,
    type AnimationsPreference,
    type Appearance,
    type AppearanceColor,
    type AppearanceColors,
    type AppearanceMaterial,
    type AppearanceShadow,
    type DesktopPreferences,
    type DesktopPreferencesUpdate,
    type Easing,
    type Theme,
    type ThemePreference
} from "@phreshos/core"
import { Button, useAppearance, useThemedValue, useTheme } from "@phreshos/react-ui"
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

    function replaceColor(theme: Theme, key: AppearanceColor, value: string) {
        setDraft(current => ({
            ...current,
            colors: {
                ...current.colors,
                [theme]: { ...current.colors[theme], [key]: value }
            }
        }))
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
                {(["light", "dark"] as const).map(theme => <ColorFields
                    key={theme}
                    label={themeLabel(theme)}
                    value={draft.colors[theme]}
                    change={(key, value) => replaceColor(theme, key, value)}
                />)}
            </div>
        </div>

        <div className="settings-group">
            <GroupHeading title="Layout" description="Shared spacing and corner dimensions." />
            <div className="field-grid compact">
                <RangeField
                    label="Spacing"
                    value={draft.spacing}
                    range={appearanceLimits.spacing}
                    change={value => replace("spacing", value)}
                />
                <RangeField
                    label="Radius"
                    value={draft.radius}
                    range={appearanceLimits.radius}
                    change={value => replace("radius", value)}
                />
            </div>
        </div>

        <div className="settings-group">
            <GroupHeading title="Transaction" description="Shared timing for visual changes." />
            <div className="field-grid compact">
                <NumberField
                    label="Duration (ms)"
                    value={draft.transaction.duration}
                    minimum={appearanceLimits.transaction.duration.minimum}
                    maximum={appearanceLimits.transaction.duration.maximum}
                    change={duration => replace("transaction", { ...draft.transaction, duration })}
                />
                <EasingField
                    value={draft.transaction.easing}
                    change={easing => replace("transaction", { ...draft.transaction, easing })}
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

function ColorFields({ label, value, change }: Readonly<{
    label: string
    value: AppearanceColors
    change: (key: AppearanceColor, value: string) => void
}>) {
    return <div className="themed-field">
        <strong>{label}</strong>
        {(Object.keys(value) as AppearanceColor[]).map(key => <TextField
            key={key}
            label={colorLabel(key)}
            value={value[key]}
            change={next => change(key, next)}
        />)}
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

function NumberField({ label, value, minimum, maximum, change }: Readonly<{
    label: string
    value: number
    minimum: number
    maximum: number
    change: (value: number) => void
}>) {
    return <label className="range-field">
        <span>{label}</span>
        <input
            type="number"
            min={minimum}
            max={maximum}
            value={value}
            onChange={event => {
                const next = event.currentTarget.valueAsNumber
                if (Number.isFinite(next)) change(next)
            }}
        />
    </label>
}

function EasingField({ value, change }: Readonly<{ value: Easing, change: (value: Easing) => void }>) {
    const custom = Array.isArray(value)

    return <div className="themed-field">
        <label className="text-field">
            <span>Easing</span>
            <select
                value={custom ? "custom" : value as string}
                onChange={event => change(event.currentTarget.value === "custom"
                    ? [0.25, 0.1, 0.25, 1]
                    : event.currentTarget.value as Easing)}
            >
                {["linear", "ease", "ease-in", "ease-out", "ease-in-out"].map(easing => <option key={easing}>{easing}</option>)}
                <option value="custom">Custom cubic Bézier</option>
            </select>
        </label>
        {custom && value.map((coordinate, index) => <NumberField
            key={index}
            label={["X1", "Y1", "X2", "Y2"][index]}
            value={coordinate}
            minimum={index % 2 === 0 ? 0 : -10}
            maximum={index % 2 === 0 ? 1 : 10}
            change={next => {
                const easing = [...value] as [number, number, number, number]
                easing[index] = next
                change(easing)
            }}
        />)}
    </div>
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
    const { background, foreground, primary } = useThemedValue(appearance.colors)

    return {
        "--settings-background": background,
        "--settings-foreground": foreground,
        "--settings-primary": primary
    } as CSSProperties
}

function copy(appearance: Appearance): Appearance {
    return {
        colors: {
            light: { ...appearance.colors.light },
            dark: { ...appearance.colors.dark }
        },
        spacing: appearance.spacing,
        radius: appearance.radius,
        shadow: {
            light: { ...appearance.shadow.light },
            dark: { ...appearance.shadow.dark }
        },
        material: {
            light: { ...appearance.material.light },
            dark: { ...appearance.material.dark }
        },
        transaction: { ...appearance.transaction },
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

function colorLabel(color: AppearanceColor) {
    return color[0].toUpperCase() + color.slice(1)
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
