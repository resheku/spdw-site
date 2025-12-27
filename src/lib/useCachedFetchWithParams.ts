import { useEffect, useState } from 'react';

// Helper to get seconds until next 10PM UTC
function getSecondsUntilNext10PMUTC() {
    const now = new Date();
    const next10pm = new Date(now);
    next10pm.setUTCHours(22, 0, 0, 0);
    if (now >= next10pm) {
        next10pm.setUTCDate(next10pm.getUTCDate() + 1);
    }
    return Math.floor((next10pm.getTime() - now.getTime()) / 1000);
}

type SeasonCache = {
    bySeason: { [season: string]: any[] }
    allLoaded: boolean
    expiry: number
}

export function useCachedFetchWithParams(url: string) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        // safe URL parsing for relative urls
        let urlObj: URL;
        try {
            urlObj = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        } catch (e) {
            // fallback: simple fetch
            fetch(url)
                .then(res => res.json())
                .then(json => { if (isMounted) { setData(json); setLoading(false); } })
                .catch(e => { if (isMounted) { setError(e); setLoading(false); } })
            return () => { isMounted = false };
        }

        const apiPath = urlObj.pathname
        const params = new URLSearchParams(urlObj.search)
        const seasonParam = params.get('season')
        const requestedSeasons: number[] | null = seasonParam ? seasonParam.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) : null

        // Scope cache by apiPath + other params (excluding season)
        const paramsWithoutSeason = new URLSearchParams(params.toString())
        paramsWithoutSeason.delete('season')
        // Sort params to ensure consistent cache keys regardless of parameter order
        const sortedParams = Array.from(paramsWithoutSeason.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join('&')
        const scopeKey = `${apiPath}|${sortedParams}`
        const cacheKey = `seasonCache:${scopeKey}`

        const cachedStr = localStorage.getItem(cacheKey)
        let cache: SeasonCache | null = null
        if (cachedStr) {
            try {
                const parsed = JSON.parse(cachedStr) as SeasonCache
                if (parsed.expiry && Date.now() < parsed.expiry) {
                    cache = parsed
                } else {
                    localStorage.removeItem(cacheKey)
                }
            } catch { }
        }

        const dedupe = (arr: any[]) => {
            const map = new Map<string, boolean>()
            const out: any[] = []
            for (const item of arr) {
                const key = `${item?.Name ?? ''}::${item?.Season ?? ''}::${item?.Team ?? ''}`
                if (!map.has(key)) { map.set(key, true); out.push(item) }
            }
            return out
        }

        const assembleForSeasons = (seasons: number[] | null) => {
            if (!cache) return null
            if (!seasons) {
                if (!cache.allLoaded) return null
                const merged: any[] = []
                Object.values(cache.bySeason || {}).forEach(arr => merged.push(...arr))
                return dedupe(merged)
            }
            const parts: any[] = []
            for (const s of seasons) {
                const arr = cache.bySeason?.[String(s)]
                if (!arr) return null
                parts.push(...arr)
            }
            return dedupe(parts)
        }

        // If cache satisfies the request, use it
        const assembled = assembleForSeasons(requestedSeasons)
        if (assembled) {
            setData(assembled)
            setLoading(false)
            return () => { isMounted = false }
        }

        const fetchMissing = async () => {
            try {
                // If no seasons requested -> fetch all
                if (!requestedSeasons) {
                    const res = await fetch(url)
                    if (!res.ok) throw new Error('Network error')
                    const json = await res.json()
                    if (!isMounted) return
                    const newCache: SeasonCache = { bySeason: {}, allLoaded: true, expiry: Date.now() + getSecondsUntilNext10PMUTC() * 1000 }
                    if (Array.isArray(json)) {
                        for (const row of json) {
                            const s = String(row?.Season ?? 'all')
                            if (!newCache.bySeason[s]) newCache.bySeason[s] = []
                            newCache.bySeason[s].push(row)
                        }
                    }
                    localStorage.setItem(cacheKey, JSON.stringify(newCache))
                    setData(dedupe(Array.isArray(json) ? json : []))
                    setLoading(false)
                    return
                }

                // otherwise, fetch only missing seasons
                const missing = requestedSeasons.filter(s => !(cache && cache.bySeason && cache.bySeason[String(s)]))
                if (missing.length === 0) {
                    const assem = assembleForSeasons(requestedSeasons)
                    setData(assem)
                    setLoading(false)
                    return
                }

                const paramsForFetch = new URLSearchParams(params.toString())
                paramsForFetch.set('season', missing.join(','))
                const fetchUrl = `${apiPath}${paramsForFetch.toString() ? `?${paramsForFetch.toString().replace(/%2C/g, ',')}` : ''}`
                const res = await fetch(fetchUrl)
                if (!res.ok) throw new Error('Network error')
                const json = await res.json()
                if (!isMounted) return

                const newCache: SeasonCache = cache ? { bySeason: { ...(cache.bySeason || {}) }, allLoaded: cache.allLoaded, expiry: Date.now() + getSecondsUntilNext10PMUTC() * 1000 } : { bySeason: {}, allLoaded: false, expiry: Date.now() + getSecondsUntilNext10PMUTC() * 1000 }
                if (Array.isArray(json)) {
                    for (const row of json) {
                        const s = String(row?.Season ?? 'all')
                        if (!newCache.bySeason[s]) newCache.bySeason[s] = []
                        newCache.bySeason[s].push(row)
                    }
                }

                localStorage.setItem(cacheKey, JSON.stringify(newCache))

                // assemble final result for requestedSeasons
                const parts: any[] = []
                for (const s of requestedSeasons) {
                    parts.push(...(newCache.bySeason[String(s)] || []))
                }
                setData(dedupe(parts))
                setLoading(false)
            } catch (e) {
                if (!isMounted) return
                setError(e)
                setLoading(false)
            }
        }

        fetchMissing()

        return () => { isMounted = false }
    }, [url])

    return { data, loading, error };
}
