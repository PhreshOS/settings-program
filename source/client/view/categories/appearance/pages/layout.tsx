import { appearanceLimits } from "@phreshos/core"
import { Fieldset, NumberField } from "@phreshos/react-ui"
import Page from "../../../components/page"
import { useAppearanceDraft } from "../draft"

/** The two values every size and corner derives from. */
export default function Layout() {
    const { draft, change } = useAppearanceDraft()

    return <Page>
        <Fieldset title="Spacing and corners" description="Controls, gaps, and headers follow the spacing; every corner follows the radius.">
            <NumberField label="Spacing (px)" value={draft.spacing} onChange={value => { if (value !== null) change("spacing", value) }}
                minValue={appearanceLimits.spacing.minimum} maxValue={appearanceLimits.spacing.maximum} />
            <NumberField label="Radius (px)" value={draft.radius} onChange={value => { if (value !== null) change("radius", value) }}
                minValue={appearanceLimits.radius.minimum} maxValue={appearanceLimits.radius.maximum} />
        </Fieldset>
    </Page>
}
