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

export function useCachedFetchWithParams(url: string) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        let isMounted = true;
        const cacheKey = `cache:${url}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { value, expiry } = JSON.parse(cached);
                if (Date.now() < expiry) {
                    setData(value);
                    setLoading(false);
                    return;
                } else {
                    localStorage.removeItem(cacheKey);
                }
            } catch { }
        }
        setLoading(true);
        fetch(url)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network error');
                }
                return res.json();
            })
            .then(json => {
                if (!isMounted) {
                    return;
                }
                setData(json);
                setLoading(false);
                // Set expiry to next 10PM UTC
                const expiry = Date.now() + getSecondsUntilNext10PMUTC() * 1000;
                localStorage.setItem(cacheKey, JSON.stringify({ value: json, expiry }));
            })
            .catch(e => {
                if (!isMounted) {
                    return;
                }
                setError(e);
                setLoading(false);
            });
        return () => { isMounted = false; };
    }, [url]);

    return { data, loading, error };
}
