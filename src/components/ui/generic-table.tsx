"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useCachedFetchWithParams } from '@/lib/useCachedFetchWithParams'

interface GenericTableProps<TData> {
    apiPath: string
    children: (args: { data: TData[]; isLoading: boolean }) => React.ReactNode
}

export function GenericTable<TData extends Record<string, any>>({ apiPath, children }: GenericTableProps<TData>) {
    const searchParams = useSearchParams()
    const query = searchParams.toString().replace(/%2C/g, ',')
    const url = query ? `${apiPath}?${query}` : apiPath

    const { data, loading } = useCachedFetchWithParams(url)

    return <>{children({ data: Array.isArray(data) ? data as TData[] : [], isLoading: !!loading })}</>
}

export default GenericTable
