import type { ReactNode } from "react"
import type { Theme } from "@phreshos/core"
import { Fieldset, Grid } from "@phreshos/react-ui"

/** The same settings for the light and the dark theme, side by side when there is room. */
export default function ThemePair({ children }: Readonly<{ children: (theme: Theme) => ReactNode }>) {
    return <Grid columns="repeat(auto-fit, minmax(min(16rem, 100%), 1fr))" gap="xlarge">
        {(["light", "dark"] as const).map(theme => <Fieldset key={theme} title={theme === "light" ? "Light theme" : "Dark theme"}>
            {children(theme)}
        </Fieldset>)}
    </Grid>
}
