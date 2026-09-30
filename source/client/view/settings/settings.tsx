import { Fragment, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react"
import { AppLayout, Drawer, Text, Tree, useAppearance, useScale } from "@phreshos/react-ui"
import { AppearanceDraftProvider } from "../sections/appearance/draft"
import { FrameContext } from "./frame"
import { sections } from "./sections"
import type { SettingsSection } from "./section"

type Location = Readonly<{ section: SettingsSection, rest: string | null }>

/**
 * The Settings frame, laid out as Files is: the name above the sections, grouped in the sidebar,
 * and the chosen section beside them drawing its header, content, and status line. A narrow window
 * keeps the sections in a drawer, one press away. The Appearance draft wraps the whole frame, so
 * unsaved changes stay while the owner looks elsewhere.
 */
export default function Settings() {
    const space = useScale(useAppearance().spacing)
    const [location, setLocation] = useState(() => locate(window.location.hash.slice(1)))
    const [drawer, setDrawer] = useState(false)
    const frame = useRef<HTMLDivElement>(null)
    const narrow = useNarrow(frame)
    const { section, rest } = location
    const chosen = section.pages ? `${section.id}/${rest ?? section.pages[0]!.id}` : section.id

    // The address is part of the page, so a reload returns to it and a link opens its section.
    useEffect(() => {
        const address = rest ? `${section.id}/${rest}` : section.id
        if (window.location.hash.slice(1) !== address) window.history.replaceState(null, "", `#${address}`)
    }, [section, rest])

    useEffect(() => {
        const follow = () => setLocation(locate(window.location.hash.slice(1)))
        window.addEventListener("hashchange", follow)
        return () => window.removeEventListener("hashchange", follow)
    }, [])

    function go(address: string) {
        setLocation(locate(address))
        setDrawer(false)
    }

    const navigation = <div className="navigation">
        {groups().map(({ heading, entries }) => <Fragment key={heading ?? ""}>
            {heading && <Text tone="secondary" size="xsmall" className="navigation-heading" style={{ paddingInline: space.small, marginTop: space.large, marginBottom: space.xsmall }}>{heading}</Text>}
            <Tree aria-label={heading ?? "Settings"} selectionMode="single" value={chosen} onChange={value => { if (value) go(value) }}>
                {entries.map(entry => <Tree.Item key={entry.id} id={entry.id} textValue={entry.title}>
                    <Tree.Content><entry.icon />{entry.title}</Tree.Content>
                </Tree.Item>)}
            </Tree>
        </Fragment>)}
    </div>

    return <FrameContext.Provider value={{ narrow, showSections: () => setDrawer(true), go }}>
        <AppearanceDraftProvider>
            <div ref={frame} style={{ position: "relative", height: "100%" }}>
                <AppLayout sidebarWidth={narrow ? 0 : undefined} style={{ padding: space.medium, paddingTop: space.small, ...(narrow ? { columnGap: 0 } : {}) }}>
                    {!narrow && <AppLayout.Title style={{ paddingInline: space.small, fontSize: "1.25rem" }}>Settings</AppLayout.Title>}
                    {!narrow && <AppLayout.Sidebar aria-label="Settings">{navigation}</AppLayout.Sidebar>}
                    <section.View key={section.id} rest={rest} />
                </AppLayout>
                {narrow && <Drawer open={drawer} onClose={() => setDrawer(false)} aria-label="Settings" title="Settings" style={{ display: "flex", flexDirection: "column" }}>
                    {navigation}
                </Drawer>}
            </div>
        </AppearanceDraftProvider>
    </FrameContext.Provider>
}

type Entry = Readonly<{ id: string, title: string, icon: SettingsSection["icon"] }>

/**
 * The sidebar's lists, in the sections' order: each group under its heading, and a section with
 * pages as a heading of its own, with its pages listed under it.
 */
function groups() {
    const lists: { heading: string | null, pages: boolean, entries: Entry[] }[] = []
    for (const section of sections) {
        if (section.pages) {
            lists.push({ heading: section.title, pages: true, entries: section.pages.map(page => ({ id: `${section.id}/${page.id}`, title: page.title, icon: page.icon })) })
            continue
        }
        const last = lists[lists.length - 1]
        if (last && !last.pages && last.heading === section.group) last.entries.push(section)
        else lists.push({ heading: section.group, pages: false, entries: [section] })
    }
    return lists
}

/** A section from its address; anything unknown opens the first section. */
function locate(address: string): Location {
    const [id, ...rest] = address.split("/")
    const section = sections.find(entry => entry.id === id)
    return section ? { section, rest: rest.length ? decodeURIComponent(rest.join("/")) : null } : { section: sections[0]!, rest: null }
}

/** Narrow enough that the sidebar would crowd the section out: the width at which Files gives up its places. */
function useNarrow(frame: RefObject<HTMLElement | null>) {
    const [narrow, setNarrow] = useState(false)
    useLayoutEffect(() => {
        const element = frame.current
        if (!element) return
        const observer = new ResizeObserver(([entry]) => setNarrow((entry?.contentRect.width ?? Infinity) <= 640))
        observer.observe(element)
        return () => observer.disconnect()
    }, [frame])
    return narrow
}
