import { Alert } from "@phreshos/react-ui"

/** A failed operation, shown where it happened. */
export default function ErrorAlert({ title, error }: Readonly<{ title: string, error: unknown }>) {
    return <Alert color="danger" title={title}>{error instanceof Error ? error.message : "The operation failed."}</Alert>
}
