import { useProgramStore } from "@phreshos/react"
import { freeName, type CustomTheme, type Look } from "@client/core/themes"

const key = "themes"

/** The owner's own themes, kept in Settings' store, and what can be done with them. */
export function useCustomThemes() {
    const [stored, setStored] = useProgramStore<readonly CustomTheme[]>(key, [])
    const list = stored ?? []

    return {
        /** Whether the store has answered; until then there are no themes to tell apart from none. */
        loaded: stored !== undefined,
        themes: list,
        /** Makes a theme from a look and returns it. */
        async create(name: string, description: string, look: Look) {
            const theme: CustomTheme = { id: crypto.randomUUID(), name: freeName(name, list), description, look, custom: true }
            await setStored(current => [...current ?? [], theme])
            return theme
        },
        async change(id: string, change: Partial<Pick<CustomTheme, "name" | "look">>) {
            await setStored(current => (current ?? []).map(theme => theme.id === id ? { ...theme, ...change } : theme))
        },
        async remove(id: string) {
            await setStored(current => (current ?? []).filter(theme => theme.id !== id))
        }
    }
}
