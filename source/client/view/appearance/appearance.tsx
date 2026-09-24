import {
    appearanceLimits,
    desktopPreferencesLimits,
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
    type TaskbarPosition,
    type Theme,
    type ThemePreference
} from "@phreshos/core"
import {
    Button,
    Dialog,
    Flex,
    Grid,
    Input,
    Select,
    Slider,
    Switch,
    Textarea,
    usePreferences,
    useThemedValue
} from "@phreshos/react-ui"
import Application from "@client/core/application"
import usePromise from "@libs/react-promise"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { parseAppearance, serializeAppearance } from "./document"

export default function AppearanceSettings({ appearance: authoritative, application, preferences }: Readonly<{
    appearance: Appearance
    application: Application
    preferences: DesktopPreferences
}>) {
    const { theme } = usePreferences()
    const foreground = useThemedValue(authoritative.colors).foreground
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

    function openTransfer(kind: "import" | "export") {
        setTransfer(kind)
        setImportError(null)
        if (kind === "import") setDocument("")
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

    return <main className="appearance" style={{ color: foreground }}>
        <header className="appearance-heading">
            <div>
                <span className="appearance-kicker">Appearance</span>
                <h1>Shape the desktop</h1>
                <p>Changes are stored by the System and published to every connected desktop.</p>
            </div>
            <Flex className="appearance-actions" gap="small" wrap justify="end">
                <Button disabled={saving.isPending} onPress={() => openTransfer("import")}>Import</Button>
                <Button onPress={() => openTransfer("export")}>Export</Button>
                <Button disabled={!dirty || saving.isPending} onPress={() => setDraft(copy(authoritative))}>Discard</Button>
                <Button color="primary:base" disabled={!dirty} pending={saving.isPending} onPress={() => void save()}>
                    {saving.isPending ? "Saving…" : "Save"}
                </Button>
            </Flex>
        </header>

        {saving.exception && <ErrorMessage value={saving.exception.current} />}

        <SettingsSection title="Theme" description={`The desktop is currently ${theme}.`}>
            <Flex gap="small" wrap>
                {(["default", "light", "dark"] as const).map(preference => <Button
                    key={preference}
                    pending={preferenceChange.isPending}
                    onPress={() => void preferenceChange.safeExecute({ theme: preference })}
                >{themeLabel(preference)}</Button>)}
            </Flex>
        </SettingsSection>

        <SettingsSection title="Animations" description={`Desktop animations are currently ${preferences.animations ? "enabled" : "disabled"}.`}>
            <Flex gap="small" wrap>
                {(["default", true, false] as const).map(preference => <Button
                    key={String(preference)}
                    pending={preferenceChange.isPending}
                    onPress={() => void preferenceChange.safeExecute({ animations: preference })}
                >{animationsLabel(preference)}</Button>)}
            </Flex>
        </SettingsSection>

        <SettingsSection title="Scale" description={`Desktop scale is currently ${Math.round(preferences.scale * 100)}%.`}>
            <Grid className="settings-fields compact" columns="minmax(0, 1fr) auto" align="end" gap="medium">
                <Slider
                    key={preferences.scale}
                    label="Desktop scale"
                    defaultValue={preferences.scale}
                    minValue={desktopPreferencesLimits.scale.minimum}
                    maxValue={desktopPreferencesLimits.scale.maximum}
                    step={0.05}
                    formatOptions={{ style: "percent" }}
                    disabled={preferenceChange.isPending}
                    onChangeEnd={scale => void preferenceChange.safeExecute({ scale })}
                />
                <Button pending={preferenceChange.isPending} onPress={() => void preferenceChange.safeExecute({ scale: "default" })}>Default</Button>
            </Grid>
            {preferenceChange.exception && <ErrorMessage value={preferenceChange.exception.current} />}
        </SettingsSection>

        <SettingsSection title="Colors" description="Independent colors for both effective themes.">
            <Grid className="settings-fields" columns={fieldColumns} gap="large">
                {(["light", "dark"] as const).map(theme => <ColorFields
                    key={theme}
                    label={themeLabel(theme)}
                    value={draft.colors[theme]}
                    change={(key, value) => replaceColor(theme, key, value)}
                />)}
            </Grid>
        </SettingsSection>

        <SettingsSection title="Layout" description="Shared spacing and corner dimensions.">
            <Grid className="settings-fields" columns={fieldColumns} gap="large">
                <RangeField label="Spacing" value={draft.spacing} range={appearanceLimits.spacing} change={value => replace("spacing", value)} />
                <RangeField label="Radius" value={draft.radius} range={appearanceLimits.radius} change={value => replace("radius", value)} />
            </Grid>
        </SettingsSection>

        <SettingsSection title="Taskbar" description="Choose its edge, cross-axis size, and relationship to standard windows.">
            <Grid className="settings-fields" columns={fieldColumns} gap="large">
                <Select
                    label="Position"
                    size="small"
                    value={draft.taskbar.position}
                    options={taskbarPositionOptions}
                    onChange={value => {
                        const position = taskbarPositionOptions.find(option => option.value === value)?.value
                        if (position) replace("taskbar", { ...draft.taskbar, position })
                    }}
                />
                <Slider
                    label="Size (px)"
                    size="small"
                    value={draft.taskbar.size}
                    minValue={appearanceLimits.taskbar.size.minimum}
                    maxValue={appearanceLimits.taskbar.size.maximum}
                    step={1}
                    onChange={size => replace("taskbar", { ...draft.taskbar, size })}
                />
                <Switch
                    label="Overlay standard windows"
                    description="Use the complete window area and reveal the Taskbar from its screen edge."
                    checked={draft.taskbar.overlay}
                    onChange={overlay => replace("taskbar", { ...draft.taskbar, overlay })}
                />
            </Grid>
        </SettingsSection>

        <SettingsSection title="Transaction" description="Shared timing for visual changes.">
            <Grid className="settings-fields" columns={fieldColumns} gap="large">
                <NumberField
                    label="Duration (ms)"
                    value={draft.transaction.duration}
                    minimum={appearanceLimits.transaction.duration.minimum}
                    maximum={appearanceLimits.transaction.duration.maximum}
                    change={duration => replace("transaction", { ...draft.transaction, duration })}
                />
                <EasingField value={draft.transaction.easing} change={easing => replace("transaction", { ...draft.transaction, easing })} />
            </Grid>
        </SettingsSection>

        <SettingsSection title="Material" description="Visual substance resolves independently for light and dark themes.">
            <Grid className="settings-fields" columns={fieldColumns} gap="large">
                <MaterialFields label="Light" value={draft.material.light} change={value => replace("material", { ...draft.material, light: value })} />
                <MaterialFields label="Dark" value={draft.material.dark} change={value => replace("material", { ...draft.material, dark: value })} />
            </Grid>
        </SettingsSection>

        <SettingsSection title="Wallpapers" description="Choose separate images, videos, or offline HTML documents for each desktop theme.">
            <Grid className="settings-fields" columns={fieldColumns} gap="large">
                <WallpaperFields title="Sign in" value={draft.signInWallpaper} application={application} change={value => replace("signInWallpaper", value)} />
                <WallpaperFields title="Desktop" value={draft.desktopWallpaper} application={application} change={value => replace("desktopWallpaper", value)} />
            </Grid>
        </SettingsSection>

        <SettingsSection title="Shadow" description="Independent outer shadow geometry and opacity.">
            <Grid className="settings-fields" columns={fieldColumns} gap="large">
                {(["light", "dark"] as const).map(theme => <FieldGroup key={theme} title={themeLabel(theme)}>
                    {(Object.keys(appearanceLimits.shadow) as (keyof AppearanceShadow)[]).map(key => <RangeField
                        key={key}
                        label={shadowLabels[key]}
                        value={draft.shadow[theme][key]}
                        range={appearanceLimits.shadow[key]}
                        change={value => replace("shadow", { ...draft.shadow, [theme]: { ...draft.shadow[theme], [key]: value } })}
                    />)}
                </FieldGroup>)}
            </Grid>
        </SettingsSection>

        <section className="reset-appearance">
            <div>
                <strong>Standard appearance</strong>
                <span>Restore every value to the shared PhreshOS defaults.</span>
            </div>
            <Button onPress={() => setDraft(copy(defaultAppearance))}>Reset</Button>
        </section>

        <AppearanceTransfer
            kind={transfer}
            draft={draft}
            document={document}
            error={importError}
            pending={saving.isPending}
            onDocument={value => { setDocument(value); setImportError(null) }}
            onImport={importDraft}
            onClose={() => setTransfer(null)}
        />
    </main>
}

function SettingsSection({ title, description, children }: Readonly<{ title: string, description: string, children: ReactNode }>) {
    return <section className="settings-section">
        <header className="section-heading">
            <h2>{title}</h2>
            <p>{description}</p>
        </header>
        <div className="section-content">{children}</div>
    </section>
}

function AppearanceTransfer({ kind, draft, document, error, pending, onDocument, onImport, onClose }: Readonly<{
    kind: "import" | "export" | null
    draft: Appearance
    document: string
    error: unknown
    pending: boolean
    onDocument: (value: string) => void
    onImport: () => void
    onClose: () => void
}>) {
    const importing = kind === "import"
    const title = importing ? "Import Appearance" : "Export Appearance"

    return <Dialog isOpen={kind !== null} onOpenChange={open => { if (!open) onClose() }}>
        <Dialog.Backdrop isDismissable>
            <Dialog.Content>
                <Dialog.Header>
                    <Dialog.Title>{title}</Dialog.Title>
                    <Dialog.Description>
                        {importing
                            ? "Load a complete Appearance document into the draft, review it, then save to apply it."
                            : "Copy the current draft. Wallpaper references belong to this System and do not include their files."}
                    </Dialog.Description>
                </Dialog.Header>
                <Dialog.Body>
                    <Textarea
                        label="Appearance JSON"
                        aria-label="Appearance JSON"
                        rows={14}
                        autoFocus
                        spellCheck="false"
                        readOnly={!importing}
                        value={importing ? document : serializeAppearance(draft)}
                        invalid={importing && error !== null}
                        errorMessage={importing && error !== null ? exceptionMessage(error) : undefined}
                        onChange={onDocument}
                        onFocus={event => { if (!importing) event.currentTarget.select() }}
                        style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
                    />
                </Dialog.Body>
                <Dialog.Footer>
                    {importing && <Button color="primary:base" disabled={pending || !document.trim()} onPress={onImport}>Load draft</Button>}
                    <Dialog.Close>Close</Dialog.Close>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog.Backdrop>
    </Dialog>
}

const taskbarPositionOptions = [
    { value: "top", label: "Top" },
    { value: "left", label: "Left" },
    { value: "bottom", label: "Bottom" },
    { value: "right", label: "Right" }
] as const satisfies readonly Readonly<{ value: TaskbarPosition, label: string }>[]

const fieldColumns = "repeat(auto-fit, minmax(min(16rem, 100%), 1fr))"

const easingOptions = ["linear", "ease", "ease-in", "ease-out", "ease-in-out"].map(value => ({ value, label: value }))
    .concat([{ value: "custom", label: "Custom cubic Bézier" }])

function ColorFields({ label, value, change }: Readonly<{
    label: string
    value: AppearanceColors
    change: (key: AppearanceColor, value: string) => void
}>) {
    return <FieldGroup title={label}>
        {(Object.keys(value) as AppearanceColor[]).map(key => <div className="color-field" key={key}>
            <Input label={colorLabel(key)} size="small" value={value[key]} onChange={next => change(key, next)} />
            <input
                className="color-picker"
                type="color"
                value={pickerColor(value[key])}
                aria-label={`Choose ${colorLabel(key).toLowerCase()} color`}
                onChange={event => change(key, event.currentTarget.value)}
            />
        </div>)}
    </FieldGroup>
}

function RangeField({ label, value, range, change }: Readonly<{
    label: string
    value: number
    range: Readonly<{ minimum: number, maximum: number }>
    change: (value: number) => void
}>) {
    return <Slider
        label={label}
        size="small"
        value={value}
        minValue={range.minimum}
        maxValue={range.maximum}
        step={range.maximum <= 3 ? 0.01 : 1}
        onChange={change}
    />
}

function NumberField({ label, value, minimum, maximum, change }: Readonly<{
    label: string
    value: number
    minimum: number
    maximum: number
    change: (value: number) => void
}>) {
    return <Input
        label={label}
        size="small"
        type="number"
        value={String(value)}
        onChange={text => {
            if (text.trim() === "") return
            const next = Number(text)
            if (Number.isFinite(next) && next >= minimum && next <= maximum) change(next)
        }}
    />
}

function EasingField({ value, change }: Readonly<{ value: Easing, change: (value: Easing) => void }>) {
    const custom = Array.isArray(value)

    return <FieldGroup title="Easing">
        <Select
            label="Curve"
            size="small"
            value={custom ? "custom" : value as string}
            options={easingOptions}
            onChange={next => {
                if (next === null) return
                change(next === "custom" ? [0.25, 0.1, 0.25, 1] : next as Easing)
            }}
        />
        {custom && <Grid columns={2} gap="small">
            {value.map((coordinate, index) => <NumberField
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
        </Grid>}
    </FieldGroup>
}

function MaterialFields({ label, value, change }: Readonly<{
    label: string
    value: AppearanceMaterial
    change: (value: AppearanceMaterial) => void
}>) {
    return <FieldGroup title={label}>
        {(Object.keys(appearanceLimits.material) as (keyof AppearanceMaterial)[]).map(key => <RangeField
            key={key}
            label={materialLabels[key]}
            value={value[key]}
            range={appearanceLimits.material[key]}
            change={next => change({ ...value, [key]: next })}
        />)}
    </FieldGroup>
}

function WallpaperFields({ title, value, application, change }: Readonly<{
    title: string
    value: Readonly<{ light: string | null, dark: string | null }>
    application: Application
    change: (value: Readonly<{ light: string | null, dark: string | null }>) => void
}>) {
    return <FieldGroup title={title}>
        <WallpaperField label="Light" value={value.light} application={application} change={light => change({ ...value, light })} />
        <WallpaperField label="Dark" value={value.dark} application={application} change={dark => change({ ...value, dark })} />
    </FieldGroup>
}

function WallpaperField({ label, value, application, change }: Readonly<{
    label: string
    value: string | null
    application: Application
    change: (value: string | null) => void
}>) {
    const input = useRef<HTMLInputElement>(null)
    const uploading = usePromise((file: File) => application.upload(file))

    async function select(file: File | undefined) {
        if (!file) return
        const key = await uploading.safeExecute(file)
        if (key) change(key)
    }

    return <div className="wallpaper-field">
        <span>{label}</span>
        <Flex gap="small" wrap>
            <Button size="small" pending={uploading.isPending} onPress={() => input.current?.click()}>
                {uploading.isPending ? "Uploading…" : value ? "Replace" : "Choose wallpaper"}
            </Button>
            {value && <Button size="small" onPress={() => change(null)}>Clear</Button>}
        </Flex>
        <input
            ref={input}
            className="file-input"
            type="file"
            accept="image/*,video/mp4,video/ogg,video/webm,.html"
            disabled={uploading.isPending}
            onChange={event => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ""
                void select(file)
            }}
        />
        {uploading.exception && <ErrorMessage value={uploading.exception.current} />}
    </div>
}

function FieldGroup({ title, children }: Readonly<{ title: string, children: ReactNode }>) {
    return <div className="field-group">
        <strong>{title}</strong>
        {children}
    </div>
}

function ErrorMessage({ value }: Readonly<{ value: unknown }>) {
    return <p className="operation-error" role="alert">{exceptionMessage(value)}</p>
}

function exceptionMessage(value: unknown) {
    return value instanceof Error ? value.message : "The operation failed"
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
        taskbar: { ...appearance.taskbar },
        signInWallpaper: { ...appearance.signInWallpaper },
        desktopWallpaper: { ...appearance.desktopWallpaper }
    }
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
