import type { AppearanceColor, AppearanceColors, Theme } from "@phreshos/core"
import { ColorArea, ColorField, ColorPicker, ColorSlider, Grid } from "@phreshos/react-ui"
import Page from "../../../components/page"
import ThemePair from "../../../components/theme-pair"
import { useAppearanceDraft } from "../draft"

const roles: readonly AppearanceColor[] = ["background", "foreground", "default", "primary", "secondary", "success", "warning", "danger", "info"]

/** Each named color of each theme, picked or typed. */
export default function Colors() {
    const { draft, change } = useAppearanceDraft()

    function set(theme: Theme, role: AppearanceColor, value: string) {
        const colors: AppearanceColors = { ...draft.colors[theme], [role]: value }
        change("colors", { ...draft.colors, [theme]: colors })
    }

    return <Page>
        <ThemePair>{theme => <Grid columns="minmax(0, 1fr) minmax(0, 1fr)" gap="small">
            {roles.map(role => <ColorRow key={role} role={role} value={draft.colors[theme][role]} onChange={value => set(theme, role, value)} />)}
        </Grid>}</ThemePair>
    </Page>
}

function ColorRow({ role, value, onChange }: Readonly<{ role: AppearanceColor, value: string, onChange: (value: string) => void }>) {
    const name = role[0]!.toUpperCase() + role.slice(1)
    // A color the picker cannot read, such as a CSS function, stays editable
    // as text; the picker then starts from black.
    const pickable = readable(value) ? value : "#000000"

    return <>
        <ColorPicker value={pickable} onChange={onChange}>
            <ColorPicker.Trigger size="small" style={{ justifyContent: "start" }}>{name}</ColorPicker.Trigger>
            <ColorPicker.Content>
                <ColorArea aria-label={`${name} color`} colorSpace="hsb" xChannel="saturation" yChannel="brightness" />
                <ColorSlider label="Hue" channel="hue" colorSpace="hsb" size="small" />
                <ColorField aria-label={`${name} hex`} size="small" />
            </ColorPicker.Content>
        </ColorPicker>
        <ColorField aria-label={`${name} hex`} size="small" value={pickable} onChange={next => { if (next !== null) onChange(next) }} />
    </>
}

/** The Appearance stores hex colors; anything else is edited only as imported text. */
function readable(value: string) {
    return /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)
}
