import { useEffect, useRef, useState } from "react"
import { appearanceLimits, type AppearanceColor, type AppearanceMaterial, type AppearanceShadow, type Theme } from "@phreshos/core"
import { AlertDialog, AppLayout, Button, ColorArea, ColorField, ColorPicker, ColorSlider, Flex, Grid, Input, Slider, Text, useAppearance, useScale } from "@phreshos/react-ui"
import { Copy } from "@phreshos/react-ui/icons"
import type { Look } from "@client/core/themes"
import { useApplication } from "../../application"
import { useArrival } from "../../components/arrival"
import { Group, Row, SectionFooter, SectionHeader } from "../../components/section-parts"
import { useFrame } from "../../settings/frame"
import Preview from "./preview"
import { useCustomThemes } from "./custom-themes"

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

/**
 * One of the owner's themes, light and dark side by side, so there is nothing to switch between.
 * Editing it puts it in use on every Desktop and keeps it: each change is saved and applied a moment
 * after it settles, so dragging a slider sends its end, not every step.
 */
export default function ThemeEditor({ id }: Readonly<{ id: string }>) {
    const application = useApplication()
    const custom = useCustomThemes()
    const { go } = useFrame()
    const space = useScale(useAppearance().spacing)
    const theme = custom.themes.find(entry => entry.id === id) ?? null
    const [look, setLook] = useState<Look | null>(theme?.look ?? null)
    const [problem, setProblem] = useState<string | null>(null)
    const pending = useRef<ReturnType<typeof setTimeout> | null>(null)
    useArrival(custom.loaded)

    // The theme arrives with the store; one that is gone returns to the Appearance.
    useEffect(() => {
        if (!custom.loaded) return
        if (!theme) go("appearance")
        else if (look === null) setLook(theme.look)
    }, [custom.loaded, theme, look, go])

    useEffect(() => () => { if (pending.current) clearTimeout(pending.current) }, [])

    if (!theme || !look) return <SectionHeader title="Theme" above={{ title: "Appearance", address: "appearance" }} />

    function change(next: Look) {
        setLook(next)
        if (pending.current) clearTimeout(pending.current)
        pending.current = setTimeout(() => {
            Promise.all([custom.change(id, { look: next }), application.updateAppearance(next)])
                .then(() => setProblem(null), (error: unknown) => setProblem(error instanceof Error ? error.message : "The change could not be saved."))
        }, 250)
    }

    const themed = <Key extends "colors" | "material" | "shadow">(key: Key, mode: Theme, value: Partial<NonNullable<Look[Key]["light"]>>) =>
        change({ ...look, [key]: { ...look[key], [mode]: { ...(look[key][mode] ?? look[key].light), ...value } } })

    async function duplicate() {
        const copy = await custom.create(`${theme!.name} copy`, `Made from ${theme!.name}`, look!)
        go(`appearance/theme/${copy.id}`)
    }

    return <>
        <SectionHeader title={theme.name} above={{ title: "Appearance", address: "appearance" }}>
            <Button size="small" onPress={() => void duplicate()}><Copy />Duplicate</Button>
            <AlertDialog>
                <AlertDialog.Trigger size="small" color="danger">Delete</AlertDialog.Trigger>
                <AlertDialog.Backdrop>
                    <AlertDialog.Content>
                        <AlertDialog.Header>
                            <AlertDialog.Title>Delete {theme.name}?</AlertDialog.Title>
                            <AlertDialog.Description>The look in use stays as it is until another theme is chosen.</AlertDialog.Description>
                        </AlertDialog.Header>
                        <AlertDialog.Footer>
                            <AlertDialog.Close>Cancel</AlertDialog.Close>
                            <AlertDialog.Close color="danger" onPress={() => void custom.remove(id).then(() => go("appearance"))}>Delete</AlertDialog.Close>
                        </AlertDialog.Footer>
                    </AlertDialog.Content>
                </AlertDialog.Backdrop>
            </AlertDialog>
        </SectionHeader>
        <AppLayout.Content>
            <Flex direction="column" gap="large">
                <Grid columns="repeat(2, minmax(0, 1fr))" gap="medium">
                    {modes.map(mode => <Flex key={mode} direction="column" gap="xsmall">
                        <Text size="small" tone="secondary" style={{ fontWeight: 600 }}>{mode === "light" ? "Light" : "Dark"}</Text>
                        <div style={{ borderRadius: space.small, overflow: "hidden" }}><Preview look={look} mode={mode} height="6rem" /></div>
                    </Flex>)}
                </Grid>
                <Grid columns="repeat(auto-fit, minmax(min(22rem, 100%), 1fr))" gap="large" style={{ alignItems: "start" }}>
                    <Flex direction="column" gap="large">
                        <Group title="Name">
                            <Row label="Name"><Input aria-label="Name" size="small" value={theme.name} onChange={name => void custom.change(id, { name })} style={{ width: "14rem" }} /></Row>
                        </Group>
                        <Group title="Colors" aside={<Columns />}>
                            {(Object.keys(colorNames) as AppearanceColor[]).map(role => <Row key={role} label={colorNames[role]}>
                                {modes.map(mode => <Swatch key={mode} label={`${colorNames[role]}, ${mode}`} value={(look.colors[mode] ?? look.colors.light)[role]}
                                    onChange={value => themed("colors", mode, { [role]: value })} />)}
                            </Row>)}
                        </Group>
                    </Flex>
                    <Flex direction="column" gap="large">
                        <Group title="Shape">
                            <Row label="Spacing" description="Gaps, controls, and headers follow it.">
                                <Measure label="Spacing" value={look.spacing} range={appearanceLimits.spacing} onChange={spacing => change({ ...look, spacing })} />
                            </Row>
                            <Row label="Corners">
                                <Measure label="Corners" value={look.radius} range={appearanceLimits.radius} onChange={radius => change({ ...look, radius })} />
                            </Row>
                        </Group>
                        <Group title="Surfaces" aside={<Columns />}>
                            {(Object.keys(materialNames) as (keyof AppearanceMaterial)[]).map(key => <Row key={key} label={materialNames[key]}>
                                {modes.map(mode => <Measure key={mode} label={`${materialNames[key]}, ${mode}`} value={(look.material[mode] ?? look.material.light)[key]}
                                    range={appearanceLimits.material[key]} onChange={value => themed("material", mode, { [key]: value })} />)}
                            </Row>)}
                            {(Object.keys(shadowNames) as (keyof AppearanceShadow)[]).map(key => <Row key={key} label={shadowNames[key]}>
                                {modes.map(mode => <Measure key={mode} label={`${shadowNames[key]}, ${mode}`} value={(look.shadow[mode] ?? look.shadow.light)[key]}
                                    range={appearanceLimits.shadow[key]} onChange={value => themed("shadow", mode, { [key]: value })} />)}
                            </Row>)}
                        </Group>
                        <Group title="Motion">
                            <Row label="Tempo" description="1 is the designed pace; higher is slower.">
                                <Measure label="Tempo" value={look.tempo} range={appearanceLimits.tempo} onChange={tempo => change({ ...look, tempo })} />
                            </Row>
                        </Group>
                    </Flex>
                </Grid>
            </Flex>
        </AppLayout.Content>
        <SectionFooter status={problem ?? "In use on every Desktop · saved as you change it"} problem={problem !== null} />
    </>
}

/** The light and dark column heads above a themed Group's values. */
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
