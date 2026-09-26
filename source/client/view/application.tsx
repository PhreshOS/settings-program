import { createContext, useContext, type ReactNode } from "react"
import type Application from "@client/core/application"

const ApplicationContext = createContext<Application | null>(null)

/** Gives every page the one owner of Settings operations. */
export function ApplicationProvider({ application, children }: Readonly<{ application: Application, children: ReactNode }>) {
    return <ApplicationContext.Provider value={application}>{children}</ApplicationContext.Provider>
}

export function useApplication() {
    const application = useContext(ApplicationContext)
    if (application == null) throw new Error("Settings pages require ApplicationProvider")
    return application
}
