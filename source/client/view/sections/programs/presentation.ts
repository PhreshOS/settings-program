import type { PermissionName } from "@phreshos/core"

/** How each permission is named to the owner, as the Desktop names it when a Program asks. */
export const permissionPresentation = {
    all: { title: "All permissions", description: "Every permission, including assigning them and running shell commands." },
    services: { title: "Services", description: "Reach Services by their Process and Service name." },
    programs: { title: "Programs", description: "See and manage every Program or selected Programs." },
    layers: { title: "Window layers", description: "Open windows below, above, or behind the others." },
    network: { title: "Network", description: "Send requests through the System, to every address or selected ones." },
    storage: { title: "Storage", description: "Use the files on this machine, all of them or selected paths." },
    uploads: { title: "Uploads", description: "Add files to the System's uploads." },
    logs: { title: "System log", description: "Read and follow what the System records." },
    appearance: { title: "Appearance", description: "Change the System Appearance." },
    desktopPreferences: { title: "Desktop preferences", description: "Change a Desktop's own preferences." },
    desktopViewport: { title: "Desktop view", description: "Move where a Desktop looks on the plane of windows." },
    desktopConnection: { title: "Desktop connection", description: "Read the browser Connection carrying a Desktop, and its Session." },
    authentication: { title: "Authentication", description: "Manage the owner's credentials, Connections, and Sessions." }
} satisfies Record<PermissionName, Readonly<{ title: string, description: string }>>

