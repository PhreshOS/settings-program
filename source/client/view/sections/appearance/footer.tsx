import { Button } from "@phreshos/react-ui"
import { SectionFooter } from "../../components/section-parts"
import { useAppearanceDraft } from "./draft"

/** Saves or discards the draft, and says whether anything waits to be saved. */
export default function AppearanceFooter() {
    const { dirty, saving, error, discard, save } = useAppearanceDraft()
    const status = error != null ? `Could not save. ${error instanceof Error ? error.message : ""}` : dirty ? "Unsaved changes, for every Desktop once saved" : "Saved"

    return <SectionFooter status={status} problem={error != null}>
        <Button size="small" disabled={!dirty || saving} onPress={discard}>Discard</Button>
        <Button size="small" color="primary" disabled={!dirty} pending={saving} onPress={() => void save()}>{saving ? "Saving…" : "Save"}</Button>
    </SectionFooter>
}
