import sql from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSecondsUntilNext10PMUTC } from '@/lib/cache-headers';

export async function GET() {
    try {
        // Get unique seasons from the speed data
        const data = await sql`
            SELECT DISTINCT m.season
            FROM sel.heats h
            LEFT JOIN sel.matches m ON m.match_id = h.match_id
            LEFT JOIN sel.telemetry t ON h.heat_id = t.heat_id
                AND COALESCE(h.substitute_id, h.rider_id) = t.rider_id
            WHERE t.max_speed IS NOT NULL
                AND t.max_speed != 0
                AND m.season IS NOT NULL
            ORDER BY m.season DESC
        `;

        const seasons = data.map(row => row.season);
        const res = NextResponse.json(seasons);
        const sMaxAge = getSecondsUntilNext10PMUTC();
        res.headers.set(
            'Cache-Control',
            `public, s-maxage=${sMaxAge}, stale-while-revalidate=60`
        );
        return res;
    } catch (error) {
        console.error('Database query failed:', error);

        return NextResponse.json(
            {
                error: 'Failed to fetch seasons data',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        );
    }
}