import { useEffect, useRef, useState } from "react"
import { appearanceLimits, type Appearance, type AppearanceColor, type AppearanceMaterial, type AppearanceShadow, type TaskbarPosition, type Theme } from "@phreshos/core"
import { useSystemAppearance } from "@phreshos/react"
import { AppLayout, Button, ColorArea, ColorField, ColorPicker, ColorSlider, FileTrigger, Flex, Grid, SegmentedControl, Select, Slider, Switch, Text, useAppearance, useScale } from "@phreshos/react-ui"
import { ImageUp, PanelBottom, PanelLeft, PanelRight, PanelTop, Save } from "@phreshos/react-ui/icons"
import type { ReadyWallpaper } from "@client/core/appearances"
import { useApplication } from "../../application"
import { useArrival } from "../../components/arrival"
import { Group, Row, SectionFooter, SectionHeader } from "../../components/section-parts"
import Preview from "./preview"
import { readyWallpaperFiles, useLibrary } from "./library"
import SaveDialog from "./save-dialog"

const modes: readonly Theme[] = ["light", "dark"]

const colorNames: Readonly<Record<AppearanceColor, string>> = {
    background: "Background", foreground: "Text", default: "Surface", primary: "Primary", secondary: "Secondary",
    success: "Success", warning: "Warning", danger: "Danger", info: "Info"
}

const materialNames: Readonly<Record<keyof AppearanceMaterial, string>> = {
    opacity: "Opacity", backdrop: "Frost", saturation: "Saturation", grain: "Grain", grainAmount: "Grain amount", distortion: "Distortion"
}

const shadowNames: Readonly<Record<keyof AppearanceShadow, string>> = {
    opacity: "Shadow", blur: "Shadow blur", x: "Shadow across", y: "Shadow down", spread: "Shadow spread"
}

// Images, videos, and offline HTML documents can all be a wallpaper.
const accept = ["image/*", "video/mp4", "video/ogg", "video/webm", "text/html"]
const releaseWallpaper = "release"
const ownWallpaper = "own"

/**
 * The Appearance in use, changed in place: every change applies to every Desktop a moment after it
 * settles, so dragging a slider sends where it ends. Light and dark stand side by side, so there is
 * nothing to switch between. Save keeps the result among the owner's Appearances.
 */
export default function Customize() {
    useArrival(true)
    const application = useApplication()
    const library = useLibrary(application)
    const authoritative = useSystemAppearance()
    const space = useScale(useAppearance().spacing)
    const [draft, setDraft] = useState(authoritative)
    const [problem, setProblem] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const pending = useRef<ReturnType<typeof setTimeout> | null>(null)

    // What the System holds replaces the draft, unless a change of this page is still on its way.
    useEffect(() => { if (pending.current === null) setDraft(authoritative) }, [authoritative])
    useEffect(() => () => { if (pending.current) clearTimeout(pending.current) }, [])

    function change(next: Appearance) {
        setDraft(next)
        if (pending.current) clearTimeout(pending.current)
        pending.current = setTimeout(() => {
            pending.current = null
            application.updateAppearance(next).then(() => setProblem(null), (error: unknown) => setProblem(error instanceof Error ? error.message : "The change could not be applied."))
        }, 250)
    }

    const themed = <Key extends "colors" | "material" | "shadow">(key: Key, mode: Theme, value: Partial<NonNullable<Appearance[Key]["light"]>>) =>
        change({ ...draft, [key]: { ...draft[key], [mode]: { ...(draft[key][mode] ?? draft[key].light), ...value } } })

    function wallpaper(mode: Theme, address: string | null) {
        change({ ...draft, desktopWallpaper: { ...draft.desktopWallpaper, [mode]: address }, signInWallpaper: { ...draft.signInWallpaper, [mode]: address } })
    }

    async function chooseWallpaper(mode: Theme, choice: string) {
        if (choice === releaseWallpaper) return wallpaper(mode, null)
        if (choice === ownWallpaper) return
        wallpaper(mode, (await library.wallpaper(choice as ReadyWallpaper))[mode])
    }

    async function ownFile(mode: Theme, files: File[]) {
        const [file] = files
        if (file) wallpaper(mode, await application.upload(file))
    }

    function wallpaperChoice(mode: Theme) {
        const address = draft.desktopWallpaper[mode] ?? null
        if (address === null) return releaseWallpaper
        return (Object.keys(readyWallpaperFiles) as ReadyWallpaper[]).find(id => library.uploaded[id]?.[mode] === address) ?? ownWallpaper
    }

    const taskbar = draft.taskbar

    return <>
        <SectionHeader title="Customize" above={{ title: "Appearance", address: "appearance" }}>
            <Button size="small" color="primary" onPress={() => setSaving(true)}><Save />Save</Button>
        </SectionHeader>
        <AppLayout.Content>
            <Flex direction="column" gap="large">
                <Grid columns="repeat(2, minmax(0, 1fr))" gap="medium">
                    {modes.map(mode => <Flex key={mode} direction="column" gap="xsmall">
                        <Text size="small" tone="secondary" style={{ fontWeight: 600 }}>{mode === "light" ? "Light" : "Dark"}</Text>
                        <div style={{ borderRadius: space.small, overflow: "hidden" }}><Preview look={draft} mode={mode} height="6rem" /></div>
                    </Flex>)}
                </Grid>
                <Grid columns="repeat(auto-fit, minmax(min(22rem, 100%), 1fr))" gap="large" style={{ alignItems: "start" }}>
                    <Flex direction="column" gap="large">
                        <Group title="Colors" aside={<Columns />}>
                            {(Object.keys(colorNames) as AppearanceColor[]).map(role => <Row key={role} label={colorNames[role]}>
                                {modes.map(mode => <Swatch key={mode} label={`${colorNames[role]}, ${mode}`} value={(draft.colors[mode] ?? draft.colors.light)[role]}
                                    onChange={value => themed("colors", mode, { [role]: value })} />)}
                            </Row>)}
                        </Group>
                        <Group title="Wallpaper" description="Behind the windows and the sign-in screen." aside={<Columns />}>
                            <Row label="Picture">
                                {modes.map(mode => <Select key={mode} aria-label={`Wallpaper, ${mode}`} size="small" value={wallpaperChoice(mode)} style={{ width: "6.5rem" }}
                                    onChange={value => { if (value) void chooseWallpaper(mode, String(value)) }}>
                                    <Select.Item id={releaseWallpaper}>Sprout</Select.Item>
                                    {(Object.keys(readyWallpaperFiles) as ReadyWallpaper[]).map(id => <Select.Item key={id} id={id}>{readyWallpaperFiles[id].name}</Select.Item>)}
                                    {wallpaperChoice(mode) === ownWallpaper && <Select.Item id={ownWallpaper}>Your own</Select.Item>}
                                </Select>)}
                            </Row>
                            <Row label="Your own file">
                                {modes.map(mode => <FileTrigger key={mode} accept={accept} onSelect={files => void ownFile(mode, files)}>
                                    <Button size="small" style={{ width: "6.5rem" }}><ImageUp />Choose</Button>
                                </FileTrigger>)}
                            </Row>
                        </Group>
                    </Flex>
                    <Flex direction="column" gap="large">
                        <Group title="Shape">
                            <Row label="Spacing" description="Gaps, controls, and headers follow it.">
                                <Measure label="Spacing" value={draft.spacing} range={appearanceLimits.spacing} onChange={spacing => change({ ...draft, spacing })} />
                            </Row>
                            <Row label="Corners">
                                <Measure label="Corners" value={draft.radius} range={appearanceLimits.radius} onChange={radius => change({ ...draft, radius })} />
                            </Row>
                        </Group>
                        <Group title="Surfaces" aside={<Columns />}>
                            {(Object.keys(materialNames) as (keyof AppearanceMaterial)[]).map(key => <Row key={key} label={materialNames[key]}>
                                {modes.map(mode => <Measure key={mode} label={`${materialNames[key]}, ${mode}`} value={(draft.material[mode] ?? draft.material.light)[key]}
                                    range={appearanceLimits.material[key]} onChange={value => themed("material", mode, { [key]: value })} />)}
                            </Row>)}
                            {(Object.keys(shadowNames) as (keyof AppearanceShadow)[]).map(key => <Row key={key} label={shadowNames[key]}>
                                {modes.map(mode => <Measure key={mode} label={`${shadowNames[key]}, ${mode}`} value={(draft.shadow[mode] ?? draft.shadow.light)[key]}
                                    range={appearanceLimits.shadow[key]} onChange={value => themed("shadow", mode, { [key]: value })} />)}
                            </Row>)}
                        </Group>
                        <Group title="Motion">
                            <Row label="Tempo" description="1 is the designed pace; higher is slower.">
                                <Measure label="Tempo" value={draft.tempo} range={appearanceLimits.tempo} onChange={tempo => change({ ...draft, tempo })} />
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
                    </Flex>
                </Grid>
            </Flex>
        </AppLayout.Content>
        <SectionFooter status={problem ?? "In use on every Desktop as you change it"} problem={problem !== null} />
        <SaveDialog open={saving} onClose={() => setSaving(false)} onSave={name => void library.save(name, draft)} />
    </>
}

/** The light and dark column heads above a Group's values. */
function Columns() {
    const space = useScale(useAppearance().spacing)
    return <Flex gap="small" style={{ paddingInlineEnd: space.medium }}>
        {modes.map(mode => <Text key={mode} size="xsmall" tone="secondary" style={{ width: "6.5rem" }}>{mode === "light" ? "Light" : "Dark"}</Text>)}
    </Flex>
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

/** One number within its limits. */
function Measure({ label, value, range, onChange }: Readonly<{ label: string, value: number, range: Readonly<{ minimum: number, maximum: number }>, onChange: (value: number) => void }>) {
    const step = range.maximum <= 3 ? 0.01 : 1
    return <Slider aria-label={label} size="small" value={value} minValue={range.minimum} maxValue={range.maximum} step={step} onChange={onChange} style={{ width: "6.5rem" }} />
}
