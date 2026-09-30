import { appearanceLimits, type AppearanceShadow, type Theme } from "@phreshos/core"
import { Slider } from "@phreshos/react-ui"
import { Fields, Group } from "../../components/section-parts"
import { useAppearanceDraft } from "./draft"

const labels: Readonly<Record<keyof AppearanceShadow, string>> = {
    x: "Horizontal offset (px)",
    y: "Vertical offset (px)",
    blur: "Blur (px)",
    spread: "Spread (px)",
    opacity: "Opacity"
}

/** The shadow beneath raised surfaces, in the theme being edited. */
export default function Shadow({ theme }: Readonly<{ theme: Theme }>) {
    const { draft, change } = useAppearanceDraft()
    const shadow = draft.shadow[theme] ?? draft.shadow.light

    return <Group title="Shadow" description="The shadow beneath raised surfaces, windows included.">
        <Fields>
            {(Object.keys(labels) as (keyof AppearanceShadow)[]).map(key => {
                const range = appearanceLimits.shadow[key]
                return <Slider key={key} label={labels[key]} size="small" value={shadow[key]} minValue={range.minimum} maxValue={range.maximum}
                    step={key === "opacity" ? 0.01 : 1}
                    formatOptions={key === "opacity" ? { style: "percent" } : undefined}
                    onChange={value => change("shadow", { ...draft.shadow, [theme]: { ...shadow, [key]: value } })} />
            })}
        </Fields>
    </Group>
}
