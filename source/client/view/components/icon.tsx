import { useEffect, useState } from "react"
import type { IconSize } from "@phreshos/core"
import { AppWindow } from "@phreshos/react-ui/icons"

/** Anything with an icon to read: a Program, or the System itself. */
export type IconSource = Readonly<{ icon(size?: IconSize): Promise<Blob> }>

/**
 * An icon at a size, read at the standard size that stays sharp on dense screens; until it arrives,
 * or when it cannot, a plain window stands in.
 */
export default function Icon({ of: owner, size }: Readonly<{ of: IconSource, size: number }>) {
    const [source, setSource] = useState<string | null>(null)

    useEffect(() => {
        let address: string | null = null
        let current = true
        owner.icon(size > 32 ? "large" : "medium").then(icon => {
            if (!current) return
            address = URL.createObjectURL(icon)
            setSource(address)
        }, () => undefined)
        return () => {
            current = false
            if (address) URL.revokeObjectURL(address)
        }
    }, [owner, size])

    if (source === null) return <AppWindow size={size} style={{ flex: "none", opacity: 0.5 }} />
    return <img src={source} alt="" draggable={false} style={{ width: size, height: size, flex: "none", objectFit: "contain" }} />
}
