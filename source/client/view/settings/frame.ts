import { createContext, useContext } from "react"

/** What every section may ask of the frame around it. */
export type Frame = Readonly<{
    /** Whether the window is too narrow for the sidebar, which then waits in a drawer. */
    narrow: boolean
    showSections: () => void
    /** Opens an address, such as `programs/files`. */
    go: (address: string) => void
}>

export const FrameContext = createContext<Frame | null>(null)

export function useFrame() {
    const frame = useContext(FrameContext)
    if (frame === null) throw new Error("Settings sections require the Settings frame")
    return frame
}
