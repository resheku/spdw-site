"use client"

import { useCallback, useMemo, useTransition } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

type Setter<T> = (value: T) => void

function parseCommaSeparatedNumbers(value: string | null) {
    if (!value) return [] as number[]
    return value.split(',').map(v => parseInt(v.trim())).filter(n => !isNaN(n))
}

function parseCommaSeparatedStrings(value: string | null) {
    if (!value) return [] as string[]
    return value.split(',').map(v => v.trim()).filter(s => s.length > 0)
}

export function useTableParams() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition()

    const search = useMemo(() => searchParams.get('search') || '', [searchParams])
    const selectedSeasons = useMemo(() => parseCommaSeparatedNumbers(searchParams.get('season')), [searchParams])
    const selectedTeams = useMemo(() => parseCommaSeparatedStrings(searchParams.get('team')), [searchParams])
    const selectedLeagues = useMemo(() => parseCommaSeparatedStrings(searchParams.get('league')), [searchParams])
    const selectedHeatsRange = useMemo(() => {
        const v = searchParams.get('heats')
        if (!v) return [] as number[]
        return v.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
    }, [searchParams])
    const sort = useMemo(() => {
        const v = searchParams.get('sort')
        if (!v) return []
        try {
            const parsed = JSON.parse(v)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }, [searchParams])

    const updateParam = useCallback((key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        
        // Check if update is actually needed
        const currentValue = params.get(key)
        if (value === null || value === '') {
            if (!currentValue) return // Already empty, no update needed
            params.delete(key)
        } else {
            if (currentValue === value) return // Already has this value, no update needed
            params.set(key, value)
        }

        // decode commas for nicer URLs
        const queryString = params.toString().replace(/%2C/g, ',')
        startTransition(() => {
            router.replace(`${pathname}?${queryString}`, { scroll: false })
        })
    }, [searchParams, router, pathname, startTransition])

    const setSearch: Setter<string> = useCallback((v: string) => updateParam('search', v.trim() || null), [updateParam])
    const setSeasons: Setter<number[]> = useCallback((arr: number[]) => updateParam('season', arr.length ? arr.join(',') : null), [updateParam])
    const setTeams: Setter<string[]> = useCallback((arr: string[]) => updateParam('team', arr.length ? arr.join(',') : null), [updateParam])
    const setLeagues: Setter<string[]> = useCallback((arr: string[]) => updateParam('league', arr.length ? arr.join(',') : null), [updateParam])
    const setHeats: Setter<number[]> = useCallback((arr: number[]) => updateParam('heats', arr.length === 2 ? arr.join(',') : null), [updateParam])
    const setSort = useCallback((sortObj: any[]) => updateParam('sort', sortObj && sortObj.length ? JSON.stringify(sortObj) : null), [updateParam])

    return {
        search,
        selectedSeasons,
        selectedTeams,
        selectedLeagues,
        selectedHeatsRange,
        sort,
        setSearch,
        setSeasons,
        setTeams,
        setLeagues,
        setHeats,
        setSort,
    }
}
