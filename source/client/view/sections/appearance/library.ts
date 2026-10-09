import { useProgramStore } from "@phreshos/react"
import { freeName, type AppearanceEntry, type Look } from "@client/core/appearances"

/** The Appearances the owner saved, kept in Settings' store. */
export function useLibrary() {
    const [saved, setSaved] = useProgramStore<readonly AppearanceEntry[]>("appearances", [])

    return {
        loaded: saved !== undefined,
        saved: saved ?? [],
        /** Keeps a look under a free name and returns it. */
        async save(name: string, look: Look) {
            const entry: AppearanceEntry = { id: crypto.randomUUID(), name: freeName(name, (saved ?? []).map(item => item.name)), description: "Yours", look }
            await setSaved(current => [...current ?? [], entry])
            return entry
        },
        async remove(id: string) {
            await setSaved(current => (current ?? []).filter(item => item.id !== id))
        }
    }
}
