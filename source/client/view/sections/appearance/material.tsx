import { appearanceLimits, type AppearanceMaterial, type Theme } from "@phreshos/core"
import { Slider } from "@phreshos/react-ui"
import { Fields, Group } from "../../components/section-parts"
import { useAppearanceDraft } from "./draft"

const labels: Readonly<Record<keyof AppearanceMaterial, string>> = {
    opacity: "Opacity",
    backdrop: "Backdrop blur",
    saturation: "Saturation",
    grain: "Grain intensity",
    grainAmount: "Grain amount",
    distortion: "Distortion"
}

/** The substance of every surface, in the theme being edited. */
export default function Material({ theme }: Readonly<{ theme: Theme }>) {
    const { draft, change } = useAppearanceDraft()
    const material = draft.material[theme] ?? draft.material.light

    return <Group title="Material" description="How every surface lets through what is behind it. Less frost is lighter to draw.">
        <Fields>
            {(Object.keys(labels) as (keyof AppearanceMaterial)[]).map(key => {
                const range = appearanceLimits.material[key]
                return <Slider key={key} label={labels[key]} size="small" value={material[key]} minValue={range.minimum} maxValue={range.maximum}
                    step={range.maximum <= 3 ? 0.01 : 1}
                    onChange={value => change("material", { ...draft.material, [theme]: { ...material, [key]: value } })} />
            })}
        </Fields>
    </Group>
}
