// Prefetch helper for SEL stats page.
// - primes `cache:/api/sel/stats/seasons` and `cache:/api/sel/stats/teams`
// - primes `seasonCache:<apiPath>|<paramsWithoutSeason>` used by useCachedFetchWithParams

function getSecondsUntilNext10PMUTC() {
  const now = new Date();
  const next10pm = new Date(now);
  next10pm.setUTCHours(22, 0, 0, 0);
  if (now >= next10pm) next10pm.setUTCDate(next10pm.getUTCDate() + 1);
  return Math.floor((next10pm.getTime() - now.getTime()) / 1000);
}
// track which endpoints/scopeKeys have been prefetched this session
const _sessionPrefetched = {
  endpoints: new Set<string>(),
  scopes: new Set<string>(),
}

export async function prefetchStatsForLink(pageHref: string) {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pageUrl = new URL(pageHref, origin);

    // 1) Prefetch seasons and teams (these use useCachedFetch cache format)
    const endpoints = ['/api/sel/stats/seasons', '/api/sel/stats/teams'];
    const expiry = Date.now() + getSecondsUntilNext10PMUTC() * 1000;

    for (const ep of endpoints) {
      try {
        // skip if session already prefetched
        if (_sessionPrefetched.endpoints.has(ep)) continue

        // check localStorage cache entry
        const cached = localStorage.getItem(`cache:${ep}`)
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            if (parsed?.expiry && Date.now() < parsed.expiry) {
              _sessionPrefetched.endpoints.add(ep)
              continue
            }
          } catch {}
        }

        const res = await fetch(ep)
        if (!res.ok) continue
        const json = await res.json()
        try {
          localStorage.setItem(`cache:${ep}`, JSON.stringify({ value: json, expiry }))
        } catch {}
        _sessionPrefetched.endpoints.add(ep)
      } catch {}
    }

    // 2) Prefetch table data and populate seasonCache for the same scope
    // The API path used by GenericTable is '/api/sel/stats'
    const apiPath = '/api/sel/stats'
    const params = new URLSearchParams(pageUrl.search)
    const seasonParam = params.get('season')
    const requestedSeasons = seasonParam ? seasonParam.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) : null

    // compute scope key (params without season)
    const paramsWithoutSeason = new URLSearchParams(params.toString())
    paramsWithoutSeason.delete('season')
    const scopeKey = `${apiPath}|${paramsWithoutSeason.toString()}`
    const cacheKey = `seasonCache:${scopeKey}`

    // skip if already prefetched in session
    if (_sessionPrefetched.scopes.has(scopeKey)) return

    // check existing cache in localStorage
    try {
      const cachedScope = localStorage.getItem(cacheKey)
      if (cachedScope) {
        try {
          const parsed = JSON.parse(cachedScope)
          if (parsed?.expiry && Date.now() < parsed.expiry) {
            _sessionPrefetched.scopes.add(scopeKey)
            return
          }
        } catch {}
      }
    } catch {}

    // fetch either specific seasons or all
    const fetchUrl = requestedSeasons ? `${apiPath}?season=${requestedSeasons.join(',')}` : apiPath
    try {
      const res = await fetch(fetchUrl)
      if (!res.ok) return
      const json = await res.json()

      // build bySeason map
      const bySeason: { [k: string]: any[] } = {}
      if (Array.isArray(json)) {
        for (const row of json) {
          const s = String(row?.Season ?? 'all')
          if (!bySeason[s]) bySeason[s] = []
          bySeason[s].push(row)
        }
      }

      const newCache = {
        bySeason,
        allLoaded: requestedSeasons === null,
        expiry,
      }

      try {
        localStorage.setItem(cacheKey, JSON.stringify(newCache))
      } catch {}
      _sessionPrefetched.scopes.add(scopeKey)
    } catch (e) {
      // ignore fetch errors for prefetch
    }
  } catch (e) {
    // ignore
  }
}
