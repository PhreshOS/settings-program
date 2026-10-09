import { useEffect, useState, type DependencyList, type ReactNode } from "react"
import type { Cleanup } from "@phreshos/core"
import { AppLayout, Button, Spinner, Text } from "@phreshos/react-ui"
import usePromise from "@libs/react-promise"
import { useArrival } from "./arrival"
import ErrorAlert from "./error-alert"

/** One read the View shows, and the value it last had while a fresh read replaces it. */
export type Read<Value> = Readonly<{
    value: Value | undefined
    exception: unknown
    retry: () => void
}>

/**
 * Reads a value, again whenever `follow` reports a change. A fresh read keeps the value it
 * replaces, so a change updates in place instead of flashing the wait again.
 */
export function useRead<Value>(read: () => Promise<Value>, dependencies: DependencyList, follow?: (change: () => void) => Cleanup): Read<Value> {
    const [revision, setRevision] = useState(0)
    const promise = usePromise(read, [...dependencies, revision])
    const [last, setLast] = useState<Readonly<{ value: Value }> | null>(null)

    useEffect(() => follow?.(() => setRevision(current => current + 1)), dependencies)

    if (promise.solve !== undefined && last?.value !== promise.solve) setLast({ value: promise.solve })

    return {
        value: promise.solve ?? last?.value,
        exception: promise.exception?.current,
        retry: () => setRevision(current => current + 1)
    }
}

/**
 * What a read shows: a Spinner while it is first waited for, what went wrong with a way to try
 * again, and then its value. The first two stand in the middle of the content. The first read of
 * the window holds the window's Loading instead.
 */
export function ReadView<Value>({ read, children }: Readonly<{ read: Read<Value>, children: (value: Value) => ReactNode }>) {
    useArrival(read.value !== undefined || read.exception !== undefined)

    // A fresh read that failed leaves the value it would have replaced, and says so above it.
    if (read.value !== undefined) return <>
        {read.exception !== undefined && <ErrorAlert title="Could not read the latest" error={read.exception} />}
        {children(read.value)}
    </>

    if (read.exception !== undefined) return <AppLayout.Placeholder>
        <Text tone="secondary">{read.exception instanceof Error ? read.exception.message : "Settings could not read this."}</Text>
        <Button size="small" onPress={read.retry}>Try again</Button>
    </AppLayout.Placeholder>

    return <AppLayout.Placeholder><Spinner label="Reading" /></AppLayout.Placeholder>
}
