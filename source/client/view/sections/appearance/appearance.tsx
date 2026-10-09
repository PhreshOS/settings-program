import { useState } from "react"
import { useSystemAppearance } from "@phreshos/react"
import { AppLayout, Button, Flex, GridList, Text, useAppearance, useScale } from "@phreshos/react-ui"
import { Plus } from "@phreshos/react-ui/icons"
import usePromise from "@libs/react-promise"
import { lookOf, themeOf, themes, type SettingsTheme } from "@client/core/themes"
import { useApplication } from "../../application"
import { useArrival } from "../../components/arrival"
import { Group, Page, SectionFooter, SectionHeader } from "../../components/section-parts"
import { useFrame } from "../../settings/frame"
import { PreviewPair } from "./preview"
import { useCustomThemes } from "./custom-themes"
import ThemeEditor from "./theme-editor"
import Wallpapers from "./wallpapers"
import Taskbar from "./taskbar"

/**
 * The System's Appearance, for every Desktop: a theme, a wallpaper, and the Taskbar. Choosing
 * applies at once through the System; there is nothing to save. A theme of the owner's own opens
 * in its editor, at `theme/<id>`.
 */
export default function Appearance({ rest }: Readonly<{ rest: string | null }>) {
    const editing = rest?.startsWith("theme/") ? rest.slice("theme/".length) : null
    return editing ? <ThemeEditor id={editing} /> : <Overview />
}

function Overview() {
    useArrival(true)
    const application = useApplication()
    const appearance = useSystemAppearance()
    const custom = useCustomThemes()
    const { go } = useFrame()
    const space = useScale(useAppearance().spacing)
    const [problem, setProblem] = useState<string | null>(null)
    const inUse = themeOf(appearance, [...themes, ...custom.themes])
    const applying = usePromise(async (theme: SettingsTheme) => {
        try { await application.updateAppearance(theme.look); setProblem(null) }
        catch (error) { setProblem(error instanceof Error ? error.message : "The theme could not be applied."); throw error }
    })

    async function createTheme() {
        const theme = await custom.create("My theme", inUse ? `Made from ${inUse.name}` : "Made from your look", lookOf(appearance))
        go(`appearance/theme/${theme.id}`)
    }

    return <>
        <SectionHeader title="Appearance">
            <Text size="small" tone="secondary">For every Desktop of this System</Text>
        </SectionHeader>
        <AppLayout.Content>
            <Page wide>
                <Group title="Theme" description="Choosing one applies it at once.">
                    <ThemeCards themes={themes} inUse={inUse} onChoose={theme => void applying.safeExecute(theme)} />
                </Group>
                <Group title="Your themes" aside={<Button size="small" onPress={() => void createTheme()}><Plus />New theme</Button>}>
                    {custom.themes.length
                        ? <ThemeCards themes={custom.themes} inUse={inUse} onChoose={theme => void applying.safeExecute(theme)} onEdit={theme => go(`appearance/theme/${theme.id}`)} />
                        : <Text size="small" tone="secondary" style={{ padding: space.medium }}>A new theme starts from the one in use; change anything in it.</Text>}
                </Group>
                <Wallpapers onProblem={setProblem} />
                <Taskbar onProblem={setProblem} />
            </Page>
        </AppLayout.Content>
        <SectionFooter status={problem ?? (inUse ? `${inUse.name} is in use` : "A look of your own is in use")} problem={problem !== null} />
    </>
}

/** Themes as cards, each in light and dark; the one in use is chosen. */
function ThemeCards({ themes, inUse, onChoose, onEdit }: Readonly<{
    themes: readonly SettingsTheme[]
    inUse: SettingsTheme | null
    onChoose: (theme: SettingsTheme) => void
    onEdit?: (theme: SettingsTheme) => void
}>) {
    const space = useScale(useAppearance().spacing)

    return <GridList aria-label="Themes" selectionMode="single" itemWidth={space.xlarge * 7} value={inUse && themes.includes(inUse) ? inUse.id : null} style={{ padding: space.small }}
        onChange={id => { const chosen = themes.find(theme => theme.id === id); if (chosen) onChoose(chosen) }}>
        {themes.map(theme => <GridList.Item key={theme.id} id={theme.id} textValue={theme.name}>
            <PreviewPair look={theme.look} />
            <Flex align="center" gap="small">
                <Text size="small" style={{ fontWeight: 600, flex: "1 1 auto" }}>{theme.name}</Text>
                {onEdit && <Button size="xsmall" onPress={() => onEdit(theme)}>Edit</Button>}
            </Flex>
            <Text size="xsmall" tone="secondary">{theme.description}</Text>
        </GridList.Item>)}
    </GridList>
}
