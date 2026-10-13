import type { Process } from "@phreshos/core"
import { AlertDialog, Badge, Text, type ButtonActionProps } from "@phreshos/react-ui"
import type { EndpointState } from "@client/core/application"
import usePromise from "@libs/react-promise"
import { useApplication } from "../../application"

/** One side of a Process: running or stopped; a dash when its Program has no such side. */
export function Side({ state }: Readonly<{ state: EndpointState }>) {
    if (state === null) return <Text tone="secondary">—</Text>
    return state.running
        ? <Badge size="xsmall" color="success" dot>Running</Badge>
        : <Badge size="xsmall">Stopped</Badge>
}

/** The Service names a Process's running sides hold now, or `null` when they hold none. */
export function heldServices(...sides: readonly EndpointState[]) {
    const names = sides.flatMap(side => side?.running && side.service ? [side.service] : [])
    return names.length ? names.join(" · ") : null
}

/** Ends a Process after the owner confirms, from its row or from its own page. */
export function EndProcess({ process, onProblem, ...trigger }: Readonly<{ process: Process, onProblem: (problem: string) => void } & Pick<ButtonActionProps, "size" | "depth">>) {
    const application = useApplication()
    const ending = usePromise(async () => {
        try { await application.endProcess(process) }
        catch (error) { onProblem(error instanceof Error ? error.message : "Could not end this Process."); throw error }
    })
    const label = process.name ?? process.identity

    return <AlertDialog>
        <AlertDialog.Trigger size="small" {...trigger} color="danger" pending={ending.isPending} aria-label={`End ${label}`}>End</AlertDialog.Trigger>
        <AlertDialog.Backdrop>
            <AlertDialog.Content>
                <AlertDialog.Header>
                    <AlertDialog.Title>End “{label}”?</AlertDialog.Title>
                    <AlertDialog.Description>Its Server stops and its Window closes. What it has not saved is lost.</AlertDialog.Description>
                </AlertDialog.Header>
                <AlertDialog.Footer>
                    <AlertDialog.Close>Cancel</AlertDialog.Close>
                    <AlertDialog.Close color="danger" onPress={() => void ending.safeExecute()}>End</AlertDialog.Close>
                </AlertDialog.Footer>
            </AlertDialog.Content>
        </AlertDialog.Backdrop>
    </AlertDialog>
}
