import { useEffect, useState } from "react"
import { Button, Dialog, Input } from "@phreshos/react-ui"

/**
 * Asks for a name, then keeps the Appearance in use under it; or, renaming one of the owner's own,
 * asks only for its new name.
 */
export default function SaveDialog({ open, name: initial = "My appearance", renaming = false, onClose, onSave }: Readonly<{ open: boolean, name?: string, renaming?: boolean, onClose: () => void, onSave: (name: string) => void }>) {
    const [name, setName] = useState(initial)
    useEffect(() => { if (open) setName(initial) }, [open, initial])

    return <Dialog open={open} onOpenChange={next => { if (!next) onClose() }}>
        <Dialog.Backdrop dismissable>
            <Dialog.Content>
                <Dialog.Header>
                    <Dialog.Title>{renaming ? `Rename ${initial}` : "Save this Appearance"}</Dialog.Title>
                    {!renaming && <Dialog.Description>Its colors, shape, material, shadow, motion, Taskbar, and wallpapers, kept together to choose again.</Dialog.Description>}
                </Dialog.Header>
                <Dialog.Body>
                    <Input label="Name" value={name} autoFocus onChange={setName} />
                </Dialog.Body>
                <Dialog.Footer>
                    <Dialog.Close>Cancel</Dialog.Close>
                    <Button color="primary" disabled={!name.trim()} onPress={() => { onSave(name.trim()); onClose() }}>{renaming ? "Rename" : "Save"}</Button>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog.Backdrop>
    </Dialog>
}
