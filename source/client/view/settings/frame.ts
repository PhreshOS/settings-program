import { createContext, useContext } from "react"

/** What every section may ask of the frame around it. */
export type Frame = Readonly<{
    /** Opens an address, such as `programs/files`. */
    go: (address: string) => void
    /** Returns to the address opened before, or goes forward again to one returned from. */
    back: (() => void) | null
    forward: (() => void) | null
}>

export const FrameContext = createContext<Frame | null>(null)

export function useFrame() {
    const frame = useContext(FrameContext)
    if (frame === null) throw new Error("Settings sections require the Settings frame")
    return frame
}
