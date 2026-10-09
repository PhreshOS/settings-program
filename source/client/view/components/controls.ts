import { useState } from "react"

/**
 * Changes started from the controls of one page or list, each waiting only for its own: a control
 * is busy while its change runs, and every other stays free. `problem` hears what went wrong, and
 * `done` that a change applied.
 */
export function useControls(problem: (error: unknown) => void, done?: () => void) {
    const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set())

    return {
        busy: (control: string) => pending.has(control),
        run(control: string, change: () => Promise<unknown>) {
            setPending(current => new Set(current).add(control))
            void change()
                .then(() => done?.(), problem)
                .finally(() => setPending(current => {
                    const next = new Set(current)
                    next.delete(control)
                    return next
                }))
        }
    }
}
