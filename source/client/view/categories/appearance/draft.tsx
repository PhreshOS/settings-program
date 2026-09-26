import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { defaultAppearance, type Appearance } from "@phreshos/core"
import { useSystemAppearance } from "@phreshos/react"
import usePromise from "@libs/react-promise"
import { useApplication } from "../../application"

export interface AppearanceDraft {
    /** The Appearance being edited, shared by every Appearance page. */
    readonly draft: Appearance
    /** Whether the draft differs from what the System holds. */
    readonly dirty: boolean
    readonly saving: boolean
    readonly error: unknown
    /** Replaces one top-level value of the draft. */
    readonly change: <Key extends keyof Appearance>(key: Key, value: Appearance[Key]) => void
    /** Replaces the whole draft, such as an imported document. */
    readonly load: (appearance: Appearance) => void
    readonly discard: () => void
    /** Loads the shared PhreshOS defaults into the draft. */
    readonly reset: () => void
    readonly save: () => Promise<void>
}

const DraftContext = createContext<AppearanceDraft | null>(null)

/**
 * The one Appearance draft. Changes stay here until saved, when the System
 * applies them to every connected desktop; a new Appearance from the System
 * replaces the draft.
 */
export function AppearanceDraftProvider({ children }: Readonly<{ children: ReactNode }>) {
    const application = useApplication()
    const authoritative = useSystemAppearance()
    const [draft, setDraft] = useState(authoritative)
    const saving = usePromise((appearance: Appearance) => application.updateAppearance(appearance))

    useEffect(() => setDraft(authoritative), [authoritative])

    const value: AppearanceDraft = {
        draft,
        dirty: JSON.stringify(draft) !== JSON.stringify(authoritative),
        saving: saving.isPending,
        error: saving.exception?.current ?? null,
        change: (key, next) => setDraft(current => ({ ...current, [key]: next })),
        load: setDraft,
        discard: () => setDraft(authoritative),
        reset: () => setDraft(defaultAppearance),
        save: async () => { await saving.safeExecute(draft) }
    }

    return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
}

export function useAppearanceDraft() {
    const draft = useContext(DraftContext)
    if (draft == null) throw new Error("Appearance pages require AppearanceDraftProvider")
    return draft
}
