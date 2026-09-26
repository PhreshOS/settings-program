import type { ReactNode } from "react"
import { Grid } from "@phreshos/react-ui"

/** A page's groups, stacked with the widest spacing between them. */
export default function Page({ children }: Readonly<{ children: ReactNode }>) {
    return <Grid gap="xlarge" style={{ alignContent: "start", maxWidth: "52rem" }}>{children}</Grid>
}
