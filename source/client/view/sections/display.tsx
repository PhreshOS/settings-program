import { defaultDesktopScale, desktopPreferencesLimits, type DesktopPreferencesUpdate } from "@phreshos/core"
import { useDesktopPreferences } from "@phreshos/react"
import { AppLayout, Button, Flex, Slider } from "@phreshos/react-ui"
import { Monitor, Moon, Sun } from "@phreshos/react-ui/icons"
import usePromise from "@libs/react-promise"
import { useApplication } from "../application"
import { useArrival } from "../components/arrival"
import { Group, Page, Row, SectionFooter, SectionHeader } from "../components/section-parts"

/**
 * This Desktop's own preferences. Each change applies at once and only to this browser, so there
 * is nothing to save. A Program reads only the effective values, not whether one follows the
 * browser, so the choices are actions and each description tells the current state.
 */
export default function Display() {
    useArrival(true)
    const updating = useDesktopUpdate()

    return <>
        <SectionHeader title="Desktop" />
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

    return <Group title="This Desktop" description="Only this browser shows these.">
        <Row label="Theme" description={`Now ${preferences.theme}.`}>
            <Flex gap="xsmall" wrap>
                <Button size="small" onPress={() => update({ theme: "desktop" })}><Monitor />Follow browser</Button>
                <Button size="small" onPress={() => update({ theme: "light" })}><Sun />Light</Button>
                <Button size="small" onPress={() => update({ theme: "dark" })}><Moon />Dark</Button>
            </Flex>
        </Row>
        <Row label="Animations" description={`Now ${preferences.animations ? "on" : "off"}.`}>
            <Flex gap="xsmall" wrap>
                <Button size="small" onPress={() => update({ animations: "desktop" })}><Monitor />Follow browser</Button>
                <Button size="small" onPress={() => update({ animations: true })}>On</Button>
                <Button size="small" onPress={() => update({ animations: false })}>Off</Button>
            </Flex>
        </Row>
        {!compact && <Row label="Scale" description={`Now ${Math.round(preferences.scale * 100)}%.`}>
            <Slider key={preferences.scale} aria-label="Scale" size="small" defaultValue={preferences.scale} style={{ width: "12rem" }}
                minValue={desktopPreferencesLimits.scale.minimum} maxValue={desktopPreferencesLimits.scale.maximum} step={0.05}
                formatOptions={{ style: "percent" }} onChangeEnd={scale => update({ scale })} />
            <Button size="small" onPress={() => update({ scale: defaultDesktopScale })}>Default</Button>
        </Row>}
    </Group>
}
