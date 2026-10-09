import { wallpaperKind } from "@phreshos/core"

/** Images, videos the browser plays everywhere, and offline HTML pages can all be a wallpaper. */
export const wallpaperFiles = ["image/*", "video/mp4", "video/ogg", "video/webm", ".html"]

/** Where a wallpaper upload is read from, and what it is. */
export function wallpaperSource(file: string) {
    return { url: `/uploads/${encodeURIComponent(file)}`, kind: wallpaperKind(file) ?? "image" }
}
