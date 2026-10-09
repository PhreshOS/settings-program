import { useEffect, useState } from "react"
import { Button, copyText, Text } from "@phreshos/react-ui"
import { Check, Copy } from "@phreshos/react-ui/icons"

/**
 * One recorded line in a table: its first line, cut short at the row's edge so a long record never
 * stretches the table, its whole text on hover, and a press that copies all of it.
 */
export default function LogLine({ content }: Readonly<{ content: string }>) {
    const [copied, setCopied] = useState(false)
    const first = content.split("\n", 1)[0] ?? ""
    const more = first.length < content.length

    useEffect(() => {
        if (!copied) return
        const timer = setTimeout(() => setCopied(false), 1500)
        return () => clearTimeout(timer)
    }, [copied])

    return <span style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
        <Text truncate title={content} className="log-content" style={{ flex: "1 1 auto" }}>{more ? `${first} …` : first}</Text>
        <Button size="xsmall" iconOnly depth="none" aria-label={copied ? "Copied" : "Copy"} onPress={() => void copyText(content).then(setCopied)}>
            {copied ? <Check /> : <Copy />}
        </Button>
    </span>
}
