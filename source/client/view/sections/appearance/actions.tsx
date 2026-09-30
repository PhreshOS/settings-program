import { useState } from "react"
import { Button, Dialog, DropdownMenu, Menu, Textarea } from "@phreshos/react-ui"
import { Ellipsis, FileDown, FileUp, RotateCcw } from "@phreshos/react-ui/icons"
import { parseAppearance, serializeAppearance } from "./document"
import { useAppearanceDraft } from "./draft"

/** Moves the draft in and out as a document, or back to the PhreshOS defaults, from one menu. */
export default function AppearanceActions() {
    const { draft, load, reset, saving } = useAppearanceDraft()
    const [transfer, setTransfer] = useState<"import" | "export" | null>(null)
    const [document, setDocument] = useState("")
    const [error, setError] = useState<unknown>(null)
    const importing = transfer === "import"

    function open(kind: "import" | "export") {
        setTransfer(kind)
        setError(null)
        if (kind === "import") setDocument("")
    }

    function importDocument() {
        try {
            load(parseAppearance(document))
            setTransfer(null)
        } catch (failure) {
            setError(failure)
        }
    }

    return <>
        <DropdownMenu>
            <DropdownMenu.Trigger iconOnly depth="flat" size="small" aria-label="More"><Ellipsis /></DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <Menu aria-label="Appearance document" size="small" onAction={action => action === "defaults" ? reset() : open(action as "import" | "export")}>
                    <Menu.Item id="import" disabled={saving}><FileUp />Import…</Menu.Item>
                    <Menu.Item id="export"><FileDown />Export…</Menu.Item>
                    <Menu.Separator />
                    <Menu.Item id="defaults" disabled={saving}><RotateCcw />Load the defaults</Menu.Item>
                </Menu>
            </DropdownMenu.Content>
        </DropdownMenu>
        <Dialog open={transfer !== null} onOpenChange={next => { if (!next) setTransfer(null) }}>
            <Dialog.Backdrop dismissable>
                <Dialog.Content>
                    <Dialog.Header>
                        <Dialog.Title>{importing ? "Import Appearance" : "Export Appearance"}</Dialog.Title>
                        <Dialog.Description>
                            {importing
                                ? "Load a complete Appearance document into the draft, review it, then save to apply it."
                                : "Copy the current draft. Wallpaper references belong to this System and do not include their files."}
                        </Dialog.Description>
                    </Dialog.Header>
                    <Dialog.Body>
                        <Textarea
                            aria-label="Appearance JSON"
                            rows={14}
                            autoFocus
                            spellCheck="false"
                            readOnly={!importing}
                            value={importing ? document : serializeAppearance(draft)}
                            invalid={importing && error !== null}
                            errorMessage={importing && error instanceof Error ? error.message : undefined}
                            onChange={next => { setDocument(next); setError(null) }}
                            onFocus={event => { if (!importing) event.currentTarget.select() }}
                            style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
                        />
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Dialog.Close>Close</Dialog.Close>
                        {importing && <Button color="primary" disabled={!document.trim()} onPress={importDocument}>Load into draft</Button>}
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Backdrop>
        </Dialog>
    </>
}
