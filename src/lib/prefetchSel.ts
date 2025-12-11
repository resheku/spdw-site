// Prefetch helper for SEL main page.
// - primes cache entries used by `useCachedFetch` for dashboard widgets
// - avoids duplicate work using an in-memory session tracker and localStorage checks

function getSecondsUntilNext10PMUTC() {
  const now = new Date();
  const next10pm = new Date(now);
  next10pm.setUTCHours(22, 0, 0, 0);
  if (now >= next10pm) next10pm.setUTCDate(next10pm.getUTCDate() + 1);
  return Math.floor((next10pm.getTime() - now.getTime()) / 1000);
}

const _sessionPrefetched = new Set<string>()

export async function prefetchSel() {
  try {
    const currentSeason = Number(process.env.NEXT_PUBLIC_CURRENT_SEASON) || new Date().getFullYear();
    const expiry = Date.now() + getSecondsUntilNext10PMUTC() * 1000;

    const endpoints = [
      '/api/sel/seasons',
      '/api/sel/dashboard/max-speeds/telem-seasons',
      `/api/sel/dashboard/best-averages?season=${currentSeason}`,
      '/api/sel/dashboard/best-averages?season=all'
    ]

    for (const ep of endpoints) {
      try {
        if (_sessionPrefetched.has(ep)) continue

        const cached = localStorage.getItem(`cache:${ep}`)
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            if (parsed?.expiry && Date.now() < parsed.expiry) {
              _sessionPrefetched.add(ep)
              continue
            }
          } catch {}
        }

        const res = await fetch(ep)
        if (!res.ok) continue
        const json = await res.json()
        try { localStorage.setItem(`cache:${ep}`, JSON.stringify({ value: json, expiry })) } catch {}
        _sessionPrefetched.add(ep)
      } catch {}
    }

    // Do not eagerly fetch max-speeds tables (lower priority) here; they're fetched on SEL page after top tables load.
  } catch (e) {
    // ignore
  }
}
