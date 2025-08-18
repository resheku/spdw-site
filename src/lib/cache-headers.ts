// Utility to calculate s-maxage for cache headers to expire at next 10PM UTC
export function getSecondsUntilNext10PMUTC() {
    const now = new Date();
    const next10pm = new Date(now);
    next10pm.setUTCHours(22, 0, 0, 0); // 22:00 UTC
    if (now >= next10pm) {
        // If it's already past 10PM UTC, set to next day
        next10pm.setUTCDate(next10pm.getUTCDate() + 1);
    }
    return Math.floor((next10pm.getTime() - now.getTime()) / 1000);
}
