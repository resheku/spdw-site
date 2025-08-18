import { useEffect, useState } from 'react';
import { getSecondsUntilNext10PMUTC } from './cache-headers';

export function useCachedFetch(url: string) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
