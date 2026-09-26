import { appearanceLimits, type Easing } from "@phreshos/core"
import { Fieldset, Grid, NumberField, Select } from "@phreshos/react-ui"
import Page from "../../../components/page"
import { useAppearanceDraft } from "../draft"

const curves = ["linear", "ease", "ease-in", "ease-out", "ease-in-out"] as const
const coordinates = ["X1", "Y1", "X2", "Y2"] as const

/** The duration and curve of every visual change. */
export default function Motion() {
    const { draft, change } = useAppearanceDraft()
    const transaction = draft.transaction
    const custom = Array.isArray(transaction.easing)

    function ease(easing: Easing) {
        change("transaction", { ...transaction, easing })
    }

    return <Page>
        <Fieldset title="Timing">
            <NumberField label="Duration" value={transaction.duration}
                onChange={duration => { if (duration !== null) change("transaction", { ...transaction, duration }) }}
                minValue={appearanceLimits.transaction.duration.minimum} maxValue={appearanceLimits.transaction.duration.maximum}
                step={10} formatOptions={{ style: "unit", unit: "millisecond" }} />
            <Select label="Curve" value={custom ? "custom" : transaction.easing as string}
                onChange={next => { if (next !== null) ease(next === "custom" ? [0.25, 0.1, 0.25, 1] : next as Easing) }}>
                {curves.map(curve => <Select.Item key={curve} id={curve}>{curve}</Select.Item>)}
                <Select.Item id="custom">Custom cubic Bézier</Select.Item>
            </Select>
            {Array.isArray(transaction.easing) && <Grid columns={4} gap="small">
                {(transaction.easing as readonly number[]).map((coordinate, index) => <NumberField
                    key={index}
                    label={coordinates[index]}
                    size="small"
                    value={coordinate}
                    // A curve's x coordinates stay within the transition's time.
                    minValue={index % 2 === 0 ? 0 : -10}
                    maxValue={index % 2 === 0 ? 1 : 10}
                    step={0.01}
                    onChange={next => {
                        if (next === null) return
                        const curve = [...transaction.easing as readonly number[]] as [number, number, number, number]
                        curve[index] = next
                        ease(curve)
                    }}
                />)}
            </Grid>}
        </Fieldset>
    </Page>
}
