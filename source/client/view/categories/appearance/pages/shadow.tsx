import { appearanceLimits, type AppearanceShadow } from "@phreshos/core"
import { NumberField, Slider } from "@phreshos/react-ui"
import Page from "../../../components/page"
import ThemePair from "../../../components/theme-pair"
import { useAppearanceDraft } from "../draft"

const lengths: Readonly<Record<Exclude<keyof AppearanceShadow, "opacity">, string>> = {
    x: "Horizontal offset (px)",
    y: "Vertical offset (px)",
    blur: "Blur (px)",
    spread: "Spread (px)"
}

/** The outer shadow of raised surfaces, for each theme. */
export default function Shadow() {
    const { draft, change } = useAppearanceDraft()

    return <Page>
        <ThemePair>{theme => {
            const shadow = draft.shadow[theme]
            const set = (key: keyof AppearanceShadow, value: number) => change("shadow", { ...draft.shadow, [theme]: { ...shadow, [key]: value } })

            return <>
                {(Object.keys(lengths) as (keyof typeof lengths)[]).map(key => <NumberField
                    key={key}
                    label={lengths[key]}
                    size="small"
                    value={shadow[key]}
                    minValue={appearanceLimits.shadow[key].minimum}
                    maxValue={appearanceLimits.shadow[key].maximum}
                    onChange={value => { if (value !== null) set(key, value) }}
                />)}
                <Slider label="Opacity" size="small" value={shadow.opacity} minValue={0} maxValue={1} step={0.01}
                    formatOptions={{ style: "percent" }} onChange={value => set("opacity", value)} />
            </>
        }}</ThemePair>
    </Page>
}
