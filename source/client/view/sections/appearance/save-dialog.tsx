import { useState } from "react"
import { Button, Dialog, Input } from "@phreshos/react-ui"

/** Asks for a name, then keeps the Appearance in use under it. */
export default function SaveDialog({ open, onClose, onSave }: Readonly<{ open: boolean, onClose: () => void, onSave: (name: string) => void }>) {
    const [name, setName] = useState("My appearance")

    return <Dialog open={open} onOpenChange={next => { if (!next) onClose() }}>
        <Dialog.Backdrop dismissable>
            <Dialog.Content>
                <Dialog.Header>
                    <Dialog.Title>Save this Appearance</Dialog.Title>
                    <Dialog.Description>Its colors and shape, its wallpaper, and its Taskbar, kept together to choose again.</Dialog.Description>
                </Dialog.Header>
                <Dialog.Body>
                    <Input label="Name" value={name} autoFocus onChange={setName} />
                </Dialog.Body>
                <Dialog.Footer>
                    <Dialog.Close>Cancel</Dialog.Close>
                    <Button color="primary" disabled={!name.trim()} onPress={() => { onSave(name.trim()); onClose() }}>Save</Button>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog.Backdrop>
    </Dialog>
}
