import { useEffect, useState } from "react"
import type { SystemLogLevel, SystemLogRecord } from "@phreshos/core"
import { AppLayout, Badge, Button, Flex, Grid, GridList, Heading, Surface, Text, useAppearance, useScale } from "@phreshos/react-ui"
import { Activity, ChevronRight, LayoutGrid, Power, Users, type LucideIcon } from "@phreshos/react-ui/icons"
import { useApplication } from "../application"
import { ReadView, useRead } from "../components/read"
import Icon from "../components/icon"
import { Group, Page, SectionFooter, SectionHeader } from "../components/section-parts"
import { useFrame } from "../settings/frame"
import { DesktopPreferences, useDesktopUpdate } from "./display"

const levels: Readonly<Record<SystemLogLevel, "danger" | "warning" | "default">> = { debug: "default", info: "default", warning: "warning", error: "danger" }

/**
 * Where Settings opens: what this System is and how long it has run, what it holds at a glance,
 * each count a way into its section, this Desktop's own choices, and what happened lately.
 */
export default function Overview() {
    const application = useApplication()
    const frame = useFrame()
    const space = useScale(useAppearance().spacing)
    const read = useRead(() => Promise.all([application.about(), application.glance()]), [], change => application.followGlance(change))
    const updating = useDesktopUpdate()

    return <>
        <SectionHeader title="Overview" />
        <AppLayout.Content>
            <ReadView read={read}>{([about, glance]) => <Page>
                <Surface depth="flat" color="primary:subtle" style={{ display: "flex", alignItems: "center", gap: space.large, padding: space.large }}>
                    <Icon of={application} size={space.xlarge * 3} />
                    <Flex direction="column" gap="xsmall" style={{ flex: "1 1 auto", minWidth: 0 }}>
                        <Heading level={2} size="xlarge">{about.name}</Heading>
                        <Text tone="secondary" className="tabular">Version {about.version} · Release {about.release.name}</Text>
                        <Text tone="secondary" size="small"><Uptime since={about.startedAt} /></Text>
                    </Flex>
                </Surface>

                <GridList aria-label="At a glance" selectionMode="none" restColor="primary:subtle" itemWidth={space.xlarge * 5}
                    // Running Processes are listed with their Programs.
                    onAction={key => frame.go(key === "running" ? "programs" : String(key))}>
                    <Count id="programs" icon={LayoutGrid} value={glance.programs} label={glance.programs === 1 ? "Program installed" : "Programs installed"} />
                    <Count id="running" icon={Activity} value={glance.processes} label="Running now" />
                    <Count id="startup" icon={Power} value={glance.startups} label="Start with the System" />
                    <Count id="sessions" icon={Users} value={glance.sessions} label={glance.sessions === 1 ? "Session signed in" : "Sessions signed in"} />
                </GridList>

                <Grid columns="repeat(auto-fit, minmax(min(20rem, 100%), 1fr))" gap="large" style={{ alignItems: "start" }}>
                    <DesktopPreferences update={updating.update} compact />
                    <Group title="Recent activity" description="What the System recorded last."
                        aside={<Button size="small" depth="flat" onPress={() => frame.go("logs")}>All logs<ChevronRight /></Button>}>
                        {glance.recent.length === 0
                            ? <Text tone="secondary" size="small" style={{ padding: space.medium }}>Nothing recorded yet.</Text>
                            : glance.recent.map((record, index) => <Record key={index} record={record} />)}
                    </Group>
                </Grid>
            </Page>}</ReadView>
        </AppLayout.Content>
        <SectionFooter status={updating.problem ?? "This Desktop's choices apply at once"} problem={updating.problem !== null} />
    </>
}

/** One count at a glance: a number, what it counts, and the way into its section. */
function Count({ id, icon: Glyph, value, label }: Readonly<{ id: string, icon: LucideIcon, value: number, label: string }>) {
    return <GridList.Item id={id} textValue={`${value} ${label}`}>
        <Flex direction="column" gap="xsmall">
            <Glyph size={18} style={{ opacity: 0.7 }} />
            <Heading level={3} size="xlarge" className="tabular">{value}</Heading>
            <Text size="small" tone="secondary">{label}</Text>
        </Flex>
    </GridList.Item>
}

/** One log record, briefly: its level, what happened, and when. */
function Record({ record }: Readonly<{ record: SystemLogRecord }>) {
    const space = useScale(useAppearance().spacing)
    return <div className="row" style={{ display: "flex", alignItems: "center", gap: space.small, padding: `${space.small}px ${space.medium}px`, minWidth: 0 }}>
        <Badge size="xsmall" color={levels[record.level]}>{record.level}</Badge>
        <Text size="small" className="truncate" style={{ flex: "1 1 auto", minWidth: 0 }}>{record.content}</Text>
        <Text size="xsmall" tone="secondary" className="tabular" style={{ flex: "none" }}>{ago(record.createdAt)}</Text>
    </div>
}

/** How long the System has run, counted on while the page is open. */
function Uptime({ since }: Readonly<{ since: Date }>) {
    const [now, setNow] = useState(Date.now())
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 30_000)
        return () => window.clearInterval(timer)
    }, [])
    return <>Running for {span(now - since.getTime())}</>
}

function span(milliseconds: number) {
    const minutes = Math.max(0, Math.floor(milliseconds / 60_000))
    const days = Math.floor(minutes / 1440), hours = Math.floor(minutes % 1440 / 60), rest = minutes % 60
    if (days > 0) return `${days} ${days === 1 ? "day" : "days"}, ${hours} ${hours === 1 ? "hour" : "hours"}`
    if (hours > 0) return `${hours} ${hours === 1 ? "hour" : "hours"}, ${rest} min`
    return `${rest} min`
}

/** How long ago something happened, in words. */
export function ago(time: number) {
    const minutes = Math.floor((Date.now() - time) / 60_000)
    if (minutes < 1) return "now"
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} h ago`
    return new Date(time).toLocaleDateString()
}
