import { useProgramStore } from "@phreshos/react"
import type { Appearance } from "@phreshos/core"
import { freeName, type AppearanceEntry } from "@client/core/appearances"

/** The Appearances the owner saved, kept in Settings' store. */
export function useLibrary() {
    const [saved, setSaved] = useProgramStore<readonly AppearanceEntry[]>("appearances", [])

    return {
        loaded: saved !== undefined,
        saved: saved ?? [],
        /** Keeps an Appearance under a free name and returns it. */
        async save(name: string, appearance: Appearance) {
            const entry: AppearanceEntry = { id: crypto.randomUUID(), name: freeName(name, (saved ?? []).map(item => item.name)), appearance }
            await setSaved(current => [...current ?? [], entry])
            return entry
        },
        /** Replaces what one saved Appearance holds. */
        async replace(id: string, name: string, appearance: Appearance) {
            await setSaved(current => (current ?? []).map(item => item.id === id ? { ...item, name, appearance } : item))
        },
        /** Keeps a new look in one saved Appearance, under whatever name it has by then. */
        async change(id: string, appearance: Appearance) {
            await setSaved(current => (current ?? []).map(item => item.id === id ? { ...item, appearance } : item))
        },
        async remove(id: string) {
            await setSaved(current => (current ?? []).filter(item => item.id !== id))
        }
    }
}
