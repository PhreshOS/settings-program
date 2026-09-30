import type { AppearanceColor, AppearanceColors, Theme } from "@phreshos/core"
import { ColorArea, ColorField, ColorPicker, ColorSlider, Grid, Text } from "@phreshos/react-ui"
import { Group } from "../../components/section-parts"
import { useAppearanceDraft } from "./draft"

const roles: readonly AppearanceColor[] = ["background", "foreground", "default", "primary", "secondary", "success", "warning", "danger", "info"]

/** Each named color of the theme being edited, chosen in its picker. */
export default function Colors({ theme }: Readonly<{ theme: Theme }>) {
    const { draft, change } = useAppearanceDraft()
    const colors = draft.colors[theme] ?? draft.colors.light

    function set(role: AppearanceColor, value: string) {
        const next: AppearanceColors = { ...colors, [role]: value }
        change("colors", { ...draft.colors, [theme]: next })
    }

    return <Group title="Colors" description="The named colors every Program paints with; each color's levels are derived from it.">
        <Grid columns="repeat(auto-fit, minmax(min(15rem, 100%), 1fr))" gap="small" style={{ padding: "0.75rem" }}>
            {roles.map(role => <ColorRow key={role} role={role} value={colors[role]} onChange={value => set(role, value)} />)}
        </Grid>
    </Group>
}

function ColorRow({ role, value, onChange }: Readonly<{ role: AppearanceColor, value: string, onChange: (value: string) => void }>) {
    const name = role[0]!.toUpperCase() + role.slice(1)
    // The picker reads hex colors only, and starts from black for anything else; the trigger
    // shows the stored value as it is.
    const pickable = readable(value) ? value : "#000000"

    return <ColorPicker value={pickable} onChange={onChange}>
        <ColorPicker.Trigger size="small" style={{ justifyContent: "start" }}>
            {name}
            <Text size="small" tone="secondary" className="mono" style={{ marginInlineStart: "auto" }}>{value}</Text>
        </ColorPicker.Trigger>
        <ColorPicker.Content>
            <ColorArea aria-label={`${name} color`} colorSpace="hsb" xChannel="saturation" yChannel="brightness" />
            <ColorSlider label="Hue" channel="hue" colorSpace="hsb" size="small" />
            <ColorField aria-label={`${name} hex`} size="small" />
        </ColorPicker.Content>
    </ColorPicker>
}

/** Whether the picker can read a stored color: it reads hex only. */
function readable(value: string) {
    return /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)
}
