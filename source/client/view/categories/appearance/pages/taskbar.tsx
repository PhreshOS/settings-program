import { appearanceLimits, type TaskbarPosition } from "@phreshos/core"
import { Fieldset, NumberField, SegmentedControl, Switch } from "@phreshos/react-ui"
import { PanelBottom, PanelLeft, PanelRight, PanelTop } from "@phreshos/react-ui/icons"
import Page from "../../../components/page"
import { useAppearanceDraft } from "../draft"

/** Where the Taskbar sits, how thick it is, and whether windows reach under it. */
export default function Taskbar() {
    const { draft, change } = useAppearanceDraft()
    const taskbar = draft.taskbar

    return <Page>
        <Fieldset title="Taskbar">
            <SegmentedControl label="Position" value={taskbar.position} onChange={position => change("taskbar", { ...taskbar, position: position as TaskbarPosition })}>
                <SegmentedControl.Item id="top"><PanelTop />Top</SegmentedControl.Item>
                <SegmentedControl.Item id="left"><PanelLeft />Left</SegmentedControl.Item>
                <SegmentedControl.Item id="bottom"><PanelBottom />Bottom</SegmentedControl.Item>
                <SegmentedControl.Item id="right"><PanelRight />Right</SegmentedControl.Item>
            </SegmentedControl>
            <NumberField label="Size (px)" description="Its thickness across its edge." value={taskbar.size}
                onChange={size => { if (size !== null) change("taskbar", { ...taskbar, size }) }}
                minValue={appearanceLimits.taskbar.size.minimum} maxValue={appearanceLimits.taskbar.size.maximum} />
            <Switch label="Overlay windows" description="Windows use the whole screen, and the Taskbar appears from its edge."
                checked={taskbar.overlay} onChange={overlay => change("taskbar", { ...taskbar, overlay })} />
        </Fieldset>
    </Page>
}
