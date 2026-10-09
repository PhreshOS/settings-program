/** Images, videos the browser plays everywhere, and offline HTML pages can all be a wallpaper. */
export const wallpaperFiles = ["image/*", "video/mp4", "video/ogg", "video/webm", ".html"]

/** The most the System takes as a wallpaper. */
export const wallpaperLimit = 50 * 1024 * 1024

export type WallpaperKind = "image" | "video" | "html"

const kinds: Readonly<Record<string, WallpaperKind>> = {
    avif: "image", bmp: "image", gif: "image", jpeg: "image", jpg: "image", png: "image", svg: "image", webp: "image",
    mp4: "video", ogg: "video", ogv: "video", webm: "video", html: "html"
}

/** Where a wallpaper upload is read from, and what it is. */
export function wallpaperSource(file: string): Readonly<{ url: string, kind: WallpaperKind }> {
    const extension = file.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? ""
    return { url: `/uploads/${encodeURIComponent(file)}`, kind: kinds[extension] ?? "image" }
}
