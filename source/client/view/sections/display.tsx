import { desktopPreferencesLimits, type DesktopPreferencesUpdate } from "@phreshos/core"
import { useDesktopPreferences, useResolvedDesktopPreferences } from "@phreshos/react"
import { AppLayout, SegmentedControl, Slider } from "@phreshos/react-ui"
import { Monitor, Moon, Sun } from "@phreshos/react-ui/icons"
import usePromise from "@libs/react-promise"
import { useApplication } from "../application"
import { useArrival } from "../components/arrival"
import { Group, Page, Row, SectionFooter, SectionHeader } from "../components/section-parts"

/**
 * This Desktop's own preferences. Each change applies at once and only to this browser, so there
 * is nothing to save. Each control shows what was chosen; following the browser also says what
 * that gives now.
 */
export default function Display() {
    useArrival(true)
    const updating = useDesktopUpdate()

    return <>
        <SectionHeader title="Preferences" />
        <AppLayout.Content>
            <Page><DesktopPreferences update={updating.update} /></Page>
        </AppLayout.Content>
        <SectionFooter status={updating.problem ?? "Applies at once, to this browser only"} problem={updating.problem !== null} />
    </>
}

/** Applies Desktop preference changes, and what went wrong with the last one. */
export function useDesktopUpdate() {
    const application = useApplication()
    const updating = usePromise((update: DesktopPreferencesUpdate) => application.updateDesktopPreferences(update))
    const exception = updating.exception?.current
    return {
        update: (next: DesktopPreferencesUpdate) => void updating.safeExecute(next),
        problem: exception === undefined ? null : `Could not apply. ${exception instanceof Error ? exception.message : ""}`
    }
}

/** Theme, animations, and scale of this Desktop; `compact` leaves the scale out. */
export function DesktopPreferences({ update, compact = false }: Readonly<{ update: (update: DesktopPreferencesUpdate) => void, compact?: boolean }>) {
    const preferences = useDesktopPreferences()
    const resolved = useResolvedDesktopPreferences()

    return <Group title="This Desktop" description="Only this browser shows these.">
        <Row label="Theme" truncate description={preferences.theme === "browser" ? `Follows the browser, now ${resolved.theme}.` : undefined}>
            <SegmentedControl aria-label="Theme" size="small" value={preferences.theme} onChange={value => update({ theme: value as "browser" | "light" | "dark" })}>
                <SegmentedControl.Item id="browser"><Monitor />Browser</SegmentedControl.Item>
                <SegmentedControl.Item id="light"><Sun />Light</SegmentedControl.Item>
                <SegmentedControl.Item id="dark"><Moon />Dark</SegmentedControl.Item>
            </SegmentedControl>
        </Row>
        <Row label="Animations" truncate description={preferences.animations === "browser" ? `Follows the browser, now ${resolved.animations ? "on" : "off"}.` : undefined}>
            <SegmentedControl aria-label="Animations" size="small" value={String(preferences.animations)}
                onChange={value => update({ animations: value === "browser" ? "browser" : value === "true" })}>
                <SegmentedControl.Item id="browser"><Monitor />Browser</SegmentedControl.Item>
                <SegmentedControl.Item id="true">On</SegmentedControl.Item>
                <SegmentedControl.Item id="false">Off</SegmentedControl.Item>
            </SegmentedControl>
        </Row>
        {!compact && <Row label="Scale" description={`Now ${Math.round(preferences.scale * 100)}%.`}>
            <Slider key={preferences.scale} aria-label="Scale" size="small" defaultValue={preferences.scale} style={{ width: "12rem" }}
                minValue={desktopPreferencesLimits.scale.minimum} maxValue={desktopPreferencesLimits.scale.maximum} step={0.05}
                formatOptions={{ style: "percent" }} onChangeEnd={scale => update({ scale })} />
        </Row>}
    </Group>
}
