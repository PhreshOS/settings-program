import { desktopPreferencesLimits, type AnimationsPreference, type DesktopPreferencesUpdate, type ThemePreference } from "@phreshos/core"
import { useDesktopPreferences } from "@phreshos/react"
import { Button, Fieldset, Flex, Slider } from "@phreshos/react-ui"
import { Monitor, Moon, Sun } from "@phreshos/react-ui/icons"
import usePromise from "@libs/react-promise"
import { useApplication } from "../../../application"
import ErrorAlert from "../../../components/error-alert"
import Page from "../../../components/page"

/**
 * Each change applies at once to this desktop; there is nothing to save. A
 * program reads only the effective values, not whether one follows the
 * system, so the choices are actions and the description tells the state.
 */
export default function Display() {
    const application = useApplication()
    const preferences = useDesktopPreferences()
    const updating = usePromise((update: DesktopPreferencesUpdate) => application.updateDesktopPreferences(update))
    const update = (next: DesktopPreferencesUpdate) => void updating.safeExecute(next)
    const theme = (value: ThemePreference) => update({ theme: value })
    const animations = (value: AnimationsPreference) => update({ animations: value })

    return <Page>
        <Fieldset title="Theme" description={`The desktop is currently ${preferences.theme}.`}>
            <Flex gap="small" wrap>
                <Button onPress={() => theme("default")}><Monitor />Follow system</Button>
                <Button onPress={() => theme("light")}><Sun />Light</Button>
                <Button onPress={() => theme("dark")}><Moon />Dark</Button>
            </Flex>
        </Fieldset>
        <Fieldset title="Animations" description={`Animations are currently ${preferences.animations ? "on" : "off"}.`}>
            <Flex gap="small" wrap>
                <Button onPress={() => animations("default")}>Follow system</Button>
                <Button onPress={() => animations(true)}>On</Button>
                <Button onPress={() => animations(false)}>Off</Button>
            </Flex>
        </Fieldset>
        <Fieldset title="Scale" description={`The desktop is currently at ${Math.round(preferences.scale * 100)}%.`}>
            <Flex gap="small" align="end">
                <Slider key={preferences.scale} aria-label="Scale" defaultValue={preferences.scale} style={{ flex: "1 1 auto" }}
                    minValue={desktopPreferencesLimits.scale.minimum} maxValue={desktopPreferencesLimits.scale.maximum} step={0.05}
                    formatOptions={{ style: "percent" }} onChangeEnd={scale => update({ scale })} />
                <Button size="small" onPress={() => update({ scale: "default" })}>Default</Button>
            </Flex>
        </Fieldset>
        {updating.exception && <ErrorAlert title="Could not apply" error={updating.exception.current} />}
    </Page>
}
