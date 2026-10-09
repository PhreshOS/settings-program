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
        owner.icon(iconSize(size)).then(icon => {
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

/** The size an icon is read at to stay sharp at this size on dense screens. */
function iconSize(size: number): IconSize {
    return size > 32 ? "large" : "medium"
}

/**
 * An icon read and decoded before it is shown, for a page that waits for it with the rest of what it
 * shows; `null` when it cannot be read, so the page still shows, with the plain window in its place.
 */
export async function decodedIcon(owner: IconSource, size: number): Promise<string | null> {
    try {
        const address = URL.createObjectURL(await owner.icon(iconSize(size)))
        const image = new Image()
        image.src = address
        await image.decode()
        return address
    } catch {
        return null
    }
}

/** An icon already read with `decodedIcon`; it releases the picture when it is replaced or leaves. */
export function DecodedIcon({ address, size }: Readonly<{ address: string | null, size: number }>) {
    useEffect(() => () => { if (address) URL.revokeObjectURL(address) }, [address])
    if (address === null) return <AppWindow size={size} style={{ flex: "none", opacity: 0.5 }} />
    return <img src={address} alt="" draggable={false} style={{ width: size, height: size, flex: "none", objectFit: "contain" }} />
}
