import { useSystemAppearance } from "@phreshos/react"
import { appearanceLimits, type Appearance, type TaskbarPosition } from "@phreshos/core"
import { SegmentedControl, Slider, Switch } from "@phreshos/react-ui"
import { PanelBottom, PanelLeft, PanelRight, PanelTop } from "@phreshos/react-ui/icons"
import { useApplication } from "../../application"
import { Group, Row } from "../../components/section-parts"

/** Where the Taskbar sits, how thick it is, and whether windows reach under it; each change applies at once. */
export default function Taskbar({ onProblem }: Readonly<{ onProblem: (problem: string | null) => void }>) {
    const application = useApplication()
    const taskbar = useSystemAppearance().taskbar

    function change(next: Partial<Appearance["taskbar"]>) {
        application.updateAppearance({ taskbar: { ...taskbar, ...next } })
            .then(() => onProblem(null), (error: unknown) => onProblem(error instanceof Error ? error.message : "The Taskbar could not change."))
    }

    return <Group title="Taskbar">
        <Row label="Edge">
            <SegmentedControl aria-label="Edge" size="small" value={taskbar.position} onChange={position => change({ position: position as TaskbarPosition })}>
                <SegmentedControl.Item id="top"><PanelTop />Top</SegmentedControl.Item>
                <SegmentedControl.Item id="left"><PanelLeft />Left</SegmentedControl.Item>
                <SegmentedControl.Item id="bottom"><PanelBottom />Bottom</SegmentedControl.Item>
                <SegmentedControl.Item id="right"><PanelRight />Right</SegmentedControl.Item>
            </SegmentedControl>
        </Row>
        <Row label="Size" description="Its thickness across its edge, in pixels.">
            <Slider key={taskbar.size} aria-label="Size" size="small" defaultValue={taskbar.size} minValue={appearanceLimits.taskbar.size.minimum} maxValue={appearanceLimits.taskbar.size.maximum}
                onChangeEnd={size => change({ size })} style={{ width: "14rem" }} />
        </Row>
        <Row label="Over windows" description="Windows use the whole screen, and the Taskbar appears from its edge.">
            <Switch aria-label="Over windows" checked={taskbar.overlay} onChange={overlay => change({ overlay })} />
        </Row>
    </Group>
}
