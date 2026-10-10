import { useEffect, useRef, useState } from "react"
import { appearanceLimits, systemWallpapers, wallpaperSizeLimit, type Appearance, type AppearanceColor, type AppearanceMaterial, type AppearanceShadow, type AppearanceWallpapers, type TaskbarPosition, type Theme } from "@phreshos/core"
import { useSystemAppearance } from "@phreshos/react"
import { AppLayout, Button, ColorArea, ColorField, ColorPicker, ColorSlider, FileTrigger, Flex, SegmentedControl, Slider, Switch, Text, useAppearance, useScale } from "@phreshos/react-ui"
import { PanelBottom, PanelLeft, PanelRight, PanelTop, Save } from "@phreshos/react-ui/icons"
import { sameAppearance } from "@client/core/appearances"
import { useApplication } from "../../application"
import { useArrival } from "../../components/arrival"
import { useFrame } from "../../settings/frame"
import { Group, Page, Row, SectionFooter, SectionHeader } from "../../components/section-parts"
import { useLibrary } from "./library"
import SaveDialog from "./save-dialog"
import { wallpaperFiles, wallpaperSource } from "./wallpaper"

const modes: readonly Theme[] = ["light", "dark"]

const colorNames: Readonly<Record<AppearanceColor, string>> = {
    background: "Background", foreground: "Text", default: "Surface", primary: "Primary", secondary: "Secondary",
    success: "Success", warning: "Warning", danger: "Danger", info: "Info"
}

const materialNames: Readonly<Record<keyof AppearanceMaterial, string>> = {
    opacity: "Opacity", backdrop: "Frost", saturation: "Saturation", grain: "Grain", grainAmount: "Grain amount", distortion: "Distortion"
}

const shadowNames: Readonly<Record<keyof AppearanceShadow, string>> = {
    opacity: "Opacity", blur: "Blur", x: "Across", y: "Down", spread: "Spread"
}

const wallpaperNames: Readonly<Record<keyof AppearanceWallpapers, string>> = { signIn: "Sign-in", desktop: "Desktop" }

/**
 * The Appearance in use, changed in place: every change applies to every Desktop a moment after it
 * settles, so dragging a slider sends where it ends. Light and dark stand side by side, so there is
 * nothing to switch between. Save keeps the result among the owner's Appearances, or in the one
 * being edited, and returns to them all; Revert returns every Desktop to where the page began.
 */
export default function Customize({ editing }: Readonly<{ editing?: string }>) {
    useArrival(true)
    const application = useApplication()
    const library = useLibrary()
    const { go } = useFrame()
    const edited = editing === undefined ? null : library.saved.find(entry => entry.id === editing) ?? null
    const authoritative = useSystemAppearance()
    const [draft, setDraft] = useState(authoritative)
    // What Revert returns to: one of the owner's own as it is saved, or the one in use on arrival.
    const [arrival] = useState(authoritative)
    const origin = edited?.appearance ?? arrival
    const changed = JSON.stringify(origin) !== JSON.stringify(draft)
    const [problem, setProblem] = useState<string | null>(null)
    const [uploading, setUploading] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const pending = useRef<ReturnType<typeof setTimeout> | null>(null)

    // What the System holds replaces the draft, unless a change of this page is still on its way.
    const held = JSON.stringify(authoritative)
    useEffect(() => { if (pending.current === null) setDraft(JSON.parse(held) as Appearance) }, [held])
    useEffect(() => () => { if (pending.current) clearTimeout(pending.current) }, [])

    function change(next: Appearance) {
        setDraft(next)
        if (pending.current) clearTimeout(pending.current)
        pending.current = setTimeout(() => {
            pending.current = null
            application.updateAppearance(next).then(() => setProblem(null), (error: unknown) => setProblem(error instanceof Error ? error.message : "The change could not be applied."))
        }, 250)
    }

    const themed = <Key extends "colors" | "material" | "shadow" | "wallpapers">(key: Key, mode: Theme, value: Partial<NonNullable<Appearance[Key]["light"]>>) =>
        change({ ...draft, [key]: { ...draft[key], [mode]: { ...(draft[key][mode] ?? draft[key].light), ...value } } })

    const taskbar = draft.taskbar

    // The file becomes an upload first; the System refuses a wallpaper it cannot show.
    async function chooseWallpaper(mode: Theme, place: keyof AppearanceWallpapers, file: File | undefined) {
        if (!file) return
        if (file.size > wallpaperSizeLimit) return setProblem("A wallpaper cannot exceed 50 MB.")
        setUploading(`${mode}:${place}`)
        try {
            themed("wallpapers", mode, { [place]: await application.upload(file) })
        } catch (error) {
            setProblem(error instanceof Error ? error.message : "The file could not be uploaded.")
        } finally {
            setUploading(null)
        }
    }

    return <>
        <SectionHeader title={edited?.name ?? "Customize"} above={{ title: "Appearance", address: "appearance" }}>
            <Button size="small" disabled={!changed} onPress={() => change(origin)}>Revert</Button>
            <Button size="small" color="primary" onPress={() => setSaving(true)}><Save />Save</Button>
        </SectionHeader>
        <AppLayout.Content>
            <Page>
                <Group title="Colors" aside={<Columns />}>
                    {(Object.keys(colorNames) as AppearanceColor[]).map(role => <Row key={role} label={colorNames[role]}>
                        {modes.map(mode => <Swatch key={mode} label={`${colorNames[role]}, ${mode}`} value={(draft.colors[mode] ?? draft.colors.light)[role]}
                            onChange={value => themed("colors", mode, { [role]: value })} />)}
                    </Row>)}
                </Group>
                <Group title="Shape">
                    <Row label="Spacing" description="Gaps, controls, and headers follow it.">
                        <Measure label="Spacing" value={draft.spacing} range={appearanceLimits.spacing} onChange={spacing => change({ ...draft, spacing })} />
                    </Row>
                    <Row label="Corners">
                        <Measure label="Corners" value={draft.radius} range={appearanceLimits.radius} onChange={radius => change({ ...draft, radius })} />
                    </Row>
                </Group>
                <Group title="Material" description="How every surface lets through what is behind it." aside={<Columns />}>
                    {(Object.keys(materialNames) as (keyof AppearanceMaterial)[]).map(key => <Row key={key} label={materialNames[key]}>
                        {modes.map(mode => <Measure key={mode} label={`${materialNames[key]}, ${mode}`} value={(draft.material[mode] ?? draft.material.light)[key]}
                            range={appearanceLimits.material[key]} onChange={value => themed("material", mode, { [key]: value })} />)}
                    </Row>)}
                </Group>
                <Group title="Shadow" description="Beneath raised surfaces, windows included." aside={<Columns />}>
                    {(Object.keys(shadowNames) as (keyof AppearanceShadow)[]).map(key => <Row key={key} label={shadowNames[key]}>
                        {modes.map(mode => <Measure key={mode} label={`Shadow ${shadowNames[key].toLowerCase()}, ${mode}`} value={(draft.shadow[mode] ?? draft.shadow.light)[key]}
                            range={appearanceLimits.shadow[key]} onChange={value => themed("shadow", mode, { [key]: value })} />)}
                    </Row>)}
                </Group>
                <Group title="Motion">
                    <Row label="Tempo" description="1 is the designed pace; higher is slower.">
                        <Measure label="Tempo" value={draft.tempo} range={appearanceLimits.tempo} step={0.05} onChange={tempo => change({ ...draft, tempo })} />
                    </Row>
                </Group>
                <Group title="Wallpapers" description="An image, a video, or an offline HTML page, up to 50 MB." aside={<Columns />}>
                    {(Object.keys(wallpaperNames) as (keyof AppearanceWallpapers)[]).map(place => <Row key={place} label={wallpaperNames[place]}>
                        {modes.map(mode => <FileTrigger key={mode} accept={wallpaperFiles} onSelect={files => void chooseWallpaper(mode, place, files[0])}>
                            <Button size="small" aria-label={`${wallpaperNames[place]} wallpaper, ${mode}`} pending={uploading === `${mode}:${place}`}
                                style={{ width: "6.5rem", height: "3.75rem", padding: 0, overflow: "hidden" }}>
                                <Thumbnail file={draft.wallpapers[mode][place]} />
                            </Button>
                        </FileTrigger>)}
                    </Row>)}
                    <Row label="The System's own" description="Puts back the wallpapers this release comes with.">
                        <Button size="small" disabled={sameAppearance(draft.wallpapers, systemWallpapers)} onPress={() => change({ ...draft, wallpapers: systemWallpapers })}>Use</Button>
                    </Row>
                </Group>
                <Group title="Taskbar">
                    <Row label="Edge">
                        <SegmentedControl aria-label="Edge" size="small" value={taskbar.position} onChange={position => change({ ...draft, taskbar: { ...taskbar, position: position as TaskbarPosition } })}>
                            <SegmentedControl.Item id="top" aria-label="Top"><PanelTop /></SegmentedControl.Item>
                            <SegmentedControl.Item id="left" aria-label="Left"><PanelLeft /></SegmentedControl.Item>
                            <SegmentedControl.Item id="bottom" aria-label="Bottom"><PanelBottom /></SegmentedControl.Item>
                            <SegmentedControl.Item id="right" aria-label="Right"><PanelRight /></SegmentedControl.Item>
                        </SegmentedControl>
                    </Row>
                    <Row label="Size" description="Its thickness, in pixels.">
                        <Measure label="Size" value={taskbar.size} range={appearanceLimits.taskbar.size} onChange={size => change({ ...draft, taskbar: { ...taskbar, size } })} />
                    </Row>
                    <Row label="Over windows" description="Windows use the whole screen; it appears from its edge.">
                        <Switch aria-label="Over windows" checked={taskbar.overlay} onChange={overlay => change({ ...draft, taskbar: { ...taskbar, overlay } })} />
                    </Row>
                </Group>
            </Page>
        </AppLayout.Content>
        <SectionFooter status={problem ?? "In use on every Desktop as you change it"} problem={problem !== null} />
        <SaveDialog open={saving} name={edited?.name} onClose={() => setSaving(false)}
            onSave={name => void (edited ? library.replace(edited.id, name, draft) : library.save(name, draft)).then(() => go("appearance"))} />
    </>
}

/** The light and dark column heads above a Group's values. */
function Columns() {
    const space = useScale(useAppearance().spacing)
    return <Flex gap="small" style={{ paddingInlineEnd: space.medium }}>
        {modes.map(mode => <Text key={mode} size="xsmall" tone="secondary" style={{ width: "6.5rem" }}>{mode === "light" ? "Light" : "Dark"}</Text>)}
    </Flex>
}

/** A wallpaper, small: a picture or a video's first frame; a page is named, since it runs only on the Desktop. */
function Thumbnail({ file }: Readonly<{ file: string }>) {
    const { url, kind } = wallpaperSource(file)
    const cover = { width: "100%", height: "100%", objectFit: "cover", display: "block" } as const
    if (kind === "image") return <img src={url} alt="" draggable={false} style={cover} />
    if (kind === "video") return <video src={url} muted playsInline preload="metadata" style={cover} />
    return <Text size="xsmall" tone="secondary">Page</Text>
}

/** One color, shown as it is stored and chosen in a picker. */
function Swatch({ label, value, onChange }: Readonly<{ label: string, value: string, onChange: (value: string) => void }>) {
    // The picker reads hex colors only, and starts from black for anything else.
    const pickable = /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(value) ? value : "#000000"
    return <ColorPicker value={pickable} onChange={onChange}>
        <ColorPicker.Trigger size="small" aria-label={label} style={{ width: "6.5rem", justifyContent: "start" }}>
            <Text size="xsmall" className="mono truncate">{value}</Text>
        </ColorPicker.Trigger>
        <ColorPicker.Content>
            <ColorArea aria-label={label} colorSpace="hsb" xChannel="saturation" yChannel="brightness" />
            <ColorSlider label="Hue" channel="hue" colorSpace="hsb" size="small" />
            <ColorField aria-label={`${label}, hex`} size="small" />
        </ColorPicker.Content>
    </ColorPicker>
}

/** One number within its limits: fractions in hundredths, pixels whole, unless a step is given. */
function Measure({ label, value, range, step: given, onChange }: Readonly<{ label: string, value: number, range: Readonly<{ minimum: number, maximum: number }>, step?: number, onChange: (value: number) => void }>) {
    const step = given ?? (range.maximum <= 3 ? 0.01 : 1)
    return <Slider aria-label={label} size="small" value={value} minValue={range.minimum} maxValue={range.maximum} step={step} onChange={onChange} style={{ width: "6.5rem" }} />
}
