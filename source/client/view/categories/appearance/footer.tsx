import { Button, Flex } from "@phreshos/react-ui"
import ErrorAlert from "../../components/error-alert"
import { useAppearanceDraft } from "./draft"

/** Saves or discards the draft; it says whether anything is waiting to be saved. */
export default function AppearanceFooter() {
    const { dirty, saving, error, discard, save } = useAppearanceDraft()

    return <Flex gap="small" align="center" justify="end" style={{ flex: "1 1 auto", minWidth: 0 }}>
        {error != null && <div style={{ flex: "1 1 auto", minWidth: 0 }}><ErrorAlert title="Could not save" error={error} /></div>}
        <span style={{ fontSize: "0.75em", opacity: 0.66, marginInlineEnd: "auto" }}>{dirty ? "Unsaved changes" : "Saved"}</span>
        <Button size="small" disabled={!dirty || saving} onPress={discard}>Discard</Button>
        <Button size="small" color="primary" disabled={!dirty} pending={saving} onPress={() => void save()}>{saving ? "Saving…" : "Save"}</Button>
    </Flex>
}
