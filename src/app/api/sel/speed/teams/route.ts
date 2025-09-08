import sql from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSecondsUntilNext10PMUTC } from '@/lib/cache-headers';

export async function GET() {
    try {
        const result = await sql`
            SELECT DISTINCT CASE
                WHEN l.team_id = m.home_team_id THEN m.home_team_shortcut
                WHEN l.team_id = m.away_team_id THEN m.away_team_shortcut
                ELSE NULL
            END as team
            FROM sel.heats h
            LEFT JOIN sel.matches m ON m.match_id = h.match_id
            LEFT JOIN sel.lineup l ON h.match_id = l.match_id
            AND COALESCE(h.substitute_id, h.rider_id) = l.rider_id
            LEFT JOIN sel.telemetry t ON h.heat_id = t.heat_id
            AND COALESCE(h.substitute_id, h.rider_id) = t.rider_id
            WHERE t.max_speed IS NOT NULL
            AND t.max_speed != 0
            AND CASE
                WHEN l.team_id = m.home_team_id THEN m.home_team_shortcut
                WHEN l.team_id = m.away_team_id THEN m.away_team_shortcut
                ELSE NULL
            END IS NOT NULL
            ORDER BY team ASC
        `;

        const teams = result.map(row => row.team);
        const res = NextResponse.json(teams);
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
                error: 'Failed to fetch teams data',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        );
    }
}