import { appearanceLimits } from "@phreshos/core"
import { Slider } from "@phreshos/react-ui"
import { Fields, Group } from "../../components/section-parts"
import { useAppearanceDraft } from "./draft"

/** The two values every size and corner derives from. */
export default function Layout() {
    const { draft, change } = useAppearanceDraft()

    return <Group title="Layout" description="Controls, gaps, and headers follow the spacing; every corner follows the radius.">
        <Fields>
            <Slider label="Spacing (px)" size="small" value={draft.spacing} minValue={appearanceLimits.spacing.minimum} maxValue={appearanceLimits.spacing.maximum} onChange={value => change("spacing", value)} />
            <Slider label="Corners (px)" size="small" value={draft.radius} minValue={appearanceLimits.radius.minimum} maxValue={appearanceLimits.radius.maximum} onChange={value => change("radius", value)} />
        </Fields>
    </Group>
}
