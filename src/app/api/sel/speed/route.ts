import sql from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSecondsUntilNext10PMUTC } from '@/lib/cache-headers';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        
        // Parse filter parameters
        const seasonParam = searchParams.get('season');
        const teamParam = searchParams.get('team');
        const trackParam = searchParams.get('track');
        
        const selectedSeasons = seasonParam
            ? seasonParam.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s))
            : [];
            
        const selectedTeams = teamParam
            ? teamParam.split(',').map(t => t.trim()).filter(t => t.length > 0)
            : [];

        const selectedTracks = trackParam
            ? trackParam.split(',').map(t => t.trim()).filter(t => t.length > 0)
            : [];

        // Build conditional WHERE clauses
        const seasonFilter = selectedSeasons.length > 0 
            ? sql`AND m.season = ANY(${selectedSeasons})`
            : sql``;
            
        const teamFilter = selectedTeams.length > 0
            ? sql`AND CASE
                WHEN l.team_id = m.home_team_id THEN m.home_team_shortcut
                WHEN l.team_id = m.away_team_id THEN m.away_team_shortcut
                ELSE NULL
            END = ANY(${selectedTeams})`
            : sql``;

        const trackFilter = selectedTracks.length > 0
            ? sql`AND m.track_city = ANY(${selectedTracks})`
            : sql``;

        const data = await sql`
            SELECT
    ROW_NUMBER() OVER (ORDER BY t.max_speed DESC, m.datetime ASC) AS rank,
    m.season as season,
    m.datetime as date,
    m.shortname_pl as match,
    h.heat_no::integer as heat,
    l.rider_name,
    l.rider_surname,
    h.points,
    CASE
        WHEN l.team_id = m.home_team_id THEN m.home_team_shortcut
        WHEN l.team_id = m.away_team_id THEN m.away_team_shortcut
        ELSE NULL
    END as team,
    t.max_speed,
    m.track_city as track
FROM
    sel.heats h
    LEFT JOIN sel.matches m ON m.match_id = h.match_id
    LEFT JOIN sel.lineup l ON h.match_id = l.match_id
        AND COALESCE(h.substitute_id, h.rider_id) = l.rider_id
    LEFT JOIN sel.telemetry t ON h.heat_id = t.heat_id
        AND COALESCE(h.substitute_id, h.rider_id) = t.rider_id
WHERE
    t.max_speed IS NOT NULL
    AND t.max_speed != 0
    ${seasonFilter}
    ${teamFilter}
    ${trackFilter}
ORDER BY
    t.max_speed DESC,
    m.datetime ASC
        `;

        const res = NextResponse.json(data);
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
                error: 'Failed to fetch speed data',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        );
    }
}