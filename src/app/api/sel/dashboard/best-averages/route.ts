import sql from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSecondsUntilNext10PMUTC } from '@/lib/cache-headers';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const season = searchParams.get('season');
        const limit = parseInt(searchParams.get('limit') || '10');

        let data: any[];

        if (season && season !== 'all' && season !== 'undefined' && !isNaN(parseInt(season))) {
            // Current season best averages
            const seasonNumber = parseInt(season);
            data = await sql`
                SELECT 
                    ROW_NUMBER() OVER (ORDER BY "Average" DESC, "Points" DESC, "Heats" DESC, "Name") as "No",
                    "Name",
                    "Team",
                    "Average"
                FROM sel.stats 
                WHERE "Season" = ${seasonNumber}
                ORDER BY "Average" DESC, "Points" DESC, "Heats" DESC, "Name"
                LIMIT ${limit}
            `;
        } else {
            // All time best averages - only riders with at least 50% of team's available heats
            data = await sql`
                WITH team_heats AS (
                    SELECT 
                        "Team",
                        "Season",
                        COUNT(DISTINCT "Match") * 15 as team_available_heats
                    FROM sel.stats
                    GROUP BY "Team", "Season"
                ),
                rider_stats AS (
                    SELECT 
                        s."Name",
                        s."Team",
                        s."Season",
                        s."Average",
                        s."Points",
                        s."Heats",
                        th.team_available_heats,
                        (s."Heats"::DECIMAL / th.team_available_heats) as heat_percentage
                    FROM sel.stats s
                    JOIN team_heats th ON s."Team" = th."Team" AND s."Season" = th."Season"
                    WHERE (s."Heats"::DECIMAL / th.team_available_heats) >= 0.5
                )
                SELECT 
                    ROW_NUMBER() OVER (ORDER BY "Average" DESC, "Points" DESC, "Heats" DESC, "Name") as "No",
                    "Name",
                    "Team",
                    "Season",
                    "Average"
                FROM rider_stats
                ORDER BY "Average" DESC, "Points" DESC, "Heats" DESC, "Name"
                LIMIT ${limit}
            `;
        }

        const res = NextResponse.json(data);
        // Set Vercel/Next.js edge cache headers
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
                error: 'Failed to fetch best averages data',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        );
    }
}