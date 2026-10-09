import { Fragment, useEffect, useState } from "react"
import { AppLayout, Text, Tree, useAppLayout, useAppearance, useScale } from "@phreshos/react-ui"
import { AppearanceDraftProvider } from "../sections/appearance/draft"
import { FrameContext } from "./frame"
import { sections } from "./sections"
import type { SettingsSection } from "./section"

type Location = Readonly<{ section: SettingsSection, rest: string | null }>

/**
 * The Settings frame, laid out as Files is: the name above the sections, grouped in the sidebar,
 * and the chosen section beside them drawing its header, content, and status line. A narrow window
 * keeps the sections in the layout's drawer, one press away. The Appearance draft wraps the whole
 * frame, so unsaved changes stay while the owner looks elsewhere.
 */
export default function Settings() {
    const space = useScale(useAppearance().spacing)
    const [location, setLocation] = useState(() => locate(window.location.hash.slice(1)))
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

    const go = (address: string) => setLocation(locate(address))

    return <FrameContext.Provider value={{ go }}>
        <AppearanceDraftProvider>
            <AppLayout style={{ padding: space.medium, paddingTop: space.small }}>
                <AppLayout.Title style={{ paddingInline: space.small, fontSize: "1.25rem" }}>Settings</AppLayout.Title>
                <AppLayout.Sidebar aria-label="Sections"><Navigation chosen={chosen} go={go} /></AppLayout.Sidebar>
                <section.View key={section.id} rest={rest} />
            </AppLayout>
        </AppearanceDraftProvider>
    </FrameContext.Provider>
}

/** The sections, grouped; choosing one also puts a narrow window's drawer away. */
function Navigation({ chosen, go }: Readonly<{ chosen: string, go: (address: string) => void }>) {
    const space = useScale(useAppearance().spacing)
    const { closeSidebar } = useAppLayout()

    return <div className="navigation">
        {groups().map(({ heading, entries }) => <Fragment key={heading ?? ""}>
            {heading && <Text tone="secondary" size="xsmall" className="navigation-heading" style={{ paddingInline: space.small, marginTop: space.large, marginBottom: space.xsmall }}>{heading}</Text>}
            <Tree aria-label={heading ?? "Settings"} selectionMode="single" value={chosen} onChange={value => { if (value) { go(value); closeSidebar() } }}>
                {entries.map(entry => <Tree.Item key={entry.id} id={entry.id} textValue={entry.title}>
                    <Tree.Content><entry.icon />{entry.title}</Tree.Content>
                </Tree.Item>)}
            </Tree>
        </Fragment>)}
    </div>
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
