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
            WITH speed_stats AS (
                SELECT
                    h.heat_id,
                    h.match_id,
                    h.heat_no::integer as heat,
                    h.points,
                    COALESCE(h.substitute_id, h.rider_id) as rider_id,
                    t.max_speed,
                    m.season,
                    m.datetime,
                    m.shortname_pl as match,
                    m.track_city as track,
                    m.track_id,
                    m.home_team_id,
                    m.away_team_id,
                    m.home_team_shortcut,
                    m.away_team_shortcut,
                    l.rider_name,
                    l.rider_surname,
                    l.team_id,
                    AVG(t.max_speed) OVER (PARTITION BY m.track_id) as track_avg_speed,
                    STDDEV(t.max_speed) OVER (PARTITION BY m.track_id) as track_stddev,
                    (t.max_speed - AVG(t.max_speed) OVER (PARTITION BY m.track_id)) as speed_diff_raw
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
            )
            SELECT
                ROW_NUMBER() OVER (ORDER BY 
                    CASE 
                        WHEN track_stddev > 0 
                        THEN (speed_diff_raw / track_stddev)
                        ELSE 0 
                    END DESC, 
                    datetime ASC
                ) AS rank,
                season,
                datetime as date,
                match,
                heat,
                rider_name,
                rider_surname,
                points,
                CASE
                    WHEN team_id = home_team_id THEN home_team_shortcut
                    WHEN team_id = away_team_id THEN away_team_shortcut
                    ELSE NULL
                END as team,
                max_speed,
                CASE 
                    WHEN track_stddev > 0 
                    THEN ROUND((speed_diff_raw / track_stddev)::numeric, 3)
                    ELSE 0
                END AS z_score,
                track,
                ROUND(track_avg_speed::numeric, 2) as track_avg_speed,
                ROUND(speed_diff_raw::numeric, 3) as speed_diff
            FROM speed_stats
            ORDER BY
                max_speed DESC,
                z_score DESC,
                datetime ASC
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