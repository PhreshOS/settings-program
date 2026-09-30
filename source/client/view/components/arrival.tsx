import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRequirement } from "@phreshos/react-ui"

const ArrivalContext = createContext<Readonly<{ arrived: boolean, arrive: () => void }> | null>(null)

/**
 * Remembers whether the window's first state has arrived. Until then the window's Loading waits for
 * it; afterwards every section shows its own reads in place, so the window never covers again.
 */
export function ArrivalProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [arrived, setArrived] = useState(false)
    return <ArrivalContext.Provider value={{ arrived, arrive: () => setArrived(true) }}>{children}</ArrivalContext.Provider>
}

/** Holds the window's Loading until this has arrived, unless the window has already appeared. */
export function useArrival(ready: boolean) {
    const context = useContext(ArrivalContext)
    if (context === null) throw new Error("Settings reads require ArrivalProvider")
    const { arrived, arrive } = context

    useEffect(() => { if (ready && !arrived) arrive() }, [ready, arrived])
    useRequirement(arrived || ready)
}
