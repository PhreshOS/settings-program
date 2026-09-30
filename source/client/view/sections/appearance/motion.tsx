import { appearanceLimits } from "@phreshos/core"
import { Slider } from "@phreshos/react-ui"
import { Fields, Group } from "../../components/section-parts"
import { useAppearanceDraft } from "./draft"

/** How fast everything moves; every motion keeps its shape. */
export default function Motion() {
    const { draft, change } = useAppearanceDraft()
    const range = appearanceLimits.tempo

    return <Group title="Motion" description="How fast everything moves: 1 is the designed pace, lower is faster, higher is slower.">
        <Fields>
            <Slider label="Tempo" size="small" value={draft.tempo} minValue={range.minimum} maxValue={range.maximum} step={0.05}
                formatOptions={{ maximumFractionDigits: 2 }}
                onChange={tempo => change("tempo", tempo)} />
        </Fields>
    </Group>
}
