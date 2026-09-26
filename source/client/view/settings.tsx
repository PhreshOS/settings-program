import { Fragment, useEffect, useState } from "react"
import { AppLayout, Tree } from "@phreshos/react-ui"
import { categories } from "./categories"
import type { SettingsCategory, SettingsPage } from "./category"

type Location = Readonly<{ category: SettingsCategory, page: SettingsPage }>

/**
 * The Settings frame: the categories and their pages in a branching sidebar,
 * the chosen page in the content, and the category's own actions around it.
 * Every category's state lives above its pages, so moving between the pages
 * of a category keeps its unsaved changes.
 */
export default function Settings() {
    const [location, setLocation] = useState(() => locate(window.location.hash.slice(1)))
    const [expanded, setExpanded] = useState<readonly string[]>(() => categories.map(category => category.id))
    const { category, page } = location

    // The page is part of the address, so a reload returns to it and a link
    // to another page opens that page.
    useEffect(() => {
        const key = pageKey(category, page)
        if (window.location.hash.slice(1) !== key) window.history.replaceState(null, "", `#${key}`)
    }, [category, page])

    useEffect(() => {
        const follow = () => choose(window.location.hash.slice(1))
        window.addEventListener("hashchange", follow)
        return () => window.removeEventListener("hashchange", follow)
    }, [])

    function choose(key: string | null) {
        if (key === null) return
        const next = locate(key)
        setLocation(next)
        setExpanded(current => current.includes(next.category.id) ? current : [...current, next.category.id])
    }

    // Each category's state wraps the whole frame, so its actions, pages, and
    // footer share it; categories not shown still keep theirs.
    const frame = <AppLayout>
        <AppLayout.Sidebar aria-label="Settings">
            <nav aria-label="Settings">
                <Tree aria-label="Settings" selectionMode="single" value={pageKey(category, page)} onChange={choose} expanded={expanded} onExpandedChange={setExpanded}>
                    {categories.map(entry => <Tree.Item key={entry.id} id={entry.id} textValue={entry.title}>
                        <Tree.Content><entry.icon />{entry.title}</Tree.Content>
                        {entry.pages.map(item => <Tree.Item key={item.id} id={pageKey(entry, item)} textValue={item.title}>
                            <Tree.Content><item.icon />{item.title}</Tree.Content>
                        </Tree.Item>)}
                    </Tree.Item>)}
                </Tree>
            </nav>
        </AppLayout.Sidebar>
        <AppLayout.Header>
            <page.icon />
            <span className="page-heading">
                <strong>{page.title}</strong>
                <span>{page.description}</span>
            </span>
            {category.Actions && <category.Actions />}
        </AppLayout.Header>
        <AppLayout.Content>
            <page.Page />
        </AppLayout.Content>
        {category.Footer && <AppLayout.Footer><category.Footer /></AppLayout.Footer>}
    </AppLayout>

    return categories.reduceRight((children, entry) => entry.Provider
        ? <entry.Provider key={entry.id}>{children}</entry.Provider>
        : <Fragment key={entry.id}>{children}</Fragment>, frame)
}

function pageKey(category: SettingsCategory, page: SettingsPage) {
    return `${category.id}/${page.id}`
}

/** A page from its key; a category alone opens its first page, and anything unknown opens the first page of all. */
function locate(key: string): Location {
    const [categoryId, pageId] = key.split("/")
    const category = categories.find(entry => entry.id === categoryId) ?? categories[0]!
    const page = category.pages.find(entry => entry.id === pageId) ?? category.pages[0]
    return { category, page }
}
