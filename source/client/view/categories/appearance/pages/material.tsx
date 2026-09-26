import { appearanceLimits, type AppearanceMaterial } from "@phreshos/core"
import { Slider } from "@phreshos/react-ui"
import Page from "../../../components/page"
import ThemePair from "../../../components/theme-pair"
import { useAppearanceDraft } from "../draft"

const labels: Readonly<Record<keyof AppearanceMaterial, string>> = {
    opacity: "Opacity",
    backdrop: "Backdrop blur",
    saturation: "Saturation",
    grain: "Grain intensity",
    grainAmount: "Grain amount",
    distortion: "Distortion"
}

/** The substance of every surface, for each theme. */
export default function Material() {
    const { draft, change } = useAppearanceDraft()

    return <Page>
        <ThemePair>{theme => (Object.keys(labels) as (keyof AppearanceMaterial)[]).map(key => {
            const range = appearanceLimits.material[key]
            return <Slider
                key={key}
                label={labels[key]}
                size="small"
                value={draft.material[theme][key]}
                minValue={range.minimum}
                maxValue={range.maximum}
                step={range.maximum <= 3 ? 0.01 : 1}
                onChange={value => change("material", { ...draft.material, [theme]: { ...draft.material[theme], [key]: value } })}
            />
        })}</ThemePair>
    </Page>
}
