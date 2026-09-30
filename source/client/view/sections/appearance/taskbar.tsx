import { appearanceLimits, type TaskbarPosition } from "@phreshos/core"
import { SegmentedControl, Slider, Switch } from "@phreshos/react-ui"
import { PanelBottom, PanelLeft, PanelRight, PanelTop } from "@phreshos/react-ui/icons"
import { Group, Row } from "../../components/section-parts"
import { useAppearanceDraft } from "./draft"

/** Where the Taskbar sits, how thick it is, and whether windows reach under it. */
export default function Taskbar() {
    const { draft, change } = useAppearanceDraft()
    const taskbar = draft.taskbar

    return <Group title="Taskbar">
        <Row label="Edge">
            <SegmentedControl aria-label="Edge" size="small" value={taskbar.position} onChange={position => change("taskbar", { ...taskbar, position: position as TaskbarPosition })}>
                <SegmentedControl.Item id="top"><PanelTop />Top</SegmentedControl.Item>
                <SegmentedControl.Item id="left"><PanelLeft />Left</SegmentedControl.Item>
                <SegmentedControl.Item id="bottom"><PanelBottom />Bottom</SegmentedControl.Item>
                <SegmentedControl.Item id="right"><PanelRight />Right</SegmentedControl.Item>
            </SegmentedControl>
        </Row>
        <Row label="Size" description="Its thickness across its edge, in pixels.">
            <Slider aria-label="Size" size="small" value={taskbar.size} minValue={appearanceLimits.taskbar.size.minimum} maxValue={appearanceLimits.taskbar.size.maximum}
                onChange={size => change("taskbar", { ...taskbar, size })} style={{ width: "14rem" }} />
        </Row>
        <Row label="Over windows" description="Windows use the whole screen, and the Taskbar appears from its edge.">
            <Switch aria-label="Over windows" checked={taskbar.overlay} onChange={overlay => change("taskbar", { ...taskbar, overlay })} />
        </Row>
    </Group>
}
