import sql from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const season = searchParams.get('season');
        const limit = parseInt(searchParams.get('limit') || '10');

        let data: any[];

        if (season && season !== 'all' && season !== 'undefined' && !isNaN(parseInt(season))) {
            // Current season max speeds (top 10 overall, not just one per rider)
            const seasonNumber = parseInt(season);
            data = await sql`
                SELECT 
                    ROW_NUMBER() OVER (ORDER BY t.max_speed DESC, l.rider_surname, l.rider_name) as "No",
                    CONCAT(l.rider_name, ' ', l.rider_surname) as "Name",
                    CASE 
                        WHEN l.team_id = m.home_team_id THEN m.home_team_shortcut
                        WHEN l.team_id = m.away_team_id THEN m.away_team_shortcut
                        ELSE 'Unknown'
                    END as "Team",
                    t.max_speed as "Speed",
                    m.track_city as "Track",
                    SUBSTRING(m.datetime, 1, 10) as "Date"
                FROM sel.telemetry t
                JOIN sel.matches m ON t.match_id = m.match_id
                JOIN sel.lineup l ON t.match_id = l.match_id AND t.rider_id = l.rider_id
                WHERE t.max_speed IS NOT NULL AND m.season = ${seasonNumber}
                ORDER BY t.max_speed DESC, l.rider_surname, l.rider_name
                LIMIT ${limit}
            `;
        } else {
            // All time max speeds (top 10 overall, not just one per rider)
            data = await sql`
                SELECT 
                    ROW_NUMBER() OVER (ORDER BY t.max_speed DESC, l.rider_surname, l.rider_name) as "No",
                    CONCAT(l.rider_name, ' ', l.rider_surname) as "Name",
                    CASE 
                        WHEN l.team_id = m.home_team_id THEN m.home_team_shortcut
                        WHEN l.team_id = m.away_team_id THEN m.away_team_shortcut
                        ELSE 'Unknown'
                    END as "Team",
                    t.max_speed as "Speed",
                    m.track_city as "Track",
                    SUBSTRING(m.datetime, 1, 10) as "Date"
                FROM sel.telemetry t
                JOIN sel.matches m ON t.match_id = m.match_id
                JOIN sel.lineup l ON t.match_id = l.match_id AND t.rider_id = l.rider_id
                WHERE t.max_speed IS NOT NULL
                ORDER BY t.max_speed DESC, l.rider_surname, l.rider_name
                LIMIT ${limit}
            `;
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Database query failed:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch max speeds data',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        );
    }
}