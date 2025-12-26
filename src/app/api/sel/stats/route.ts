import sql from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSecondsUntilNext10PMUTC } from '@/lib/cache-headers';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const seasonsParam = searchParams.get('season');
        const teamsParam = searchParams.get('team');

        let data: any[];

        // Build WHERE conditions based on filters
        let seasonFilter: number[] | null = null;
        let teamFilter: string[] | null = null;

        // Handle seasons filter
        if (seasonsParam) {
            const requestedSeasons = seasonsParam.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s));

            if (requestedSeasons.length > 0) {
                const availableSeasons = await sql`
                    SELECT DISTINCT "Season" 
                    FROM sel.stats
                    WHERE "Season" IS NOT NULL AND "League" = 'PGEE'
                `;
                const validSeasons = availableSeasons.map(row => row.Season);
                const filteredSeasons = requestedSeasons.filter(season => validSeasons.includes(season));

                if (filteredSeasons.length > 0) {
                    seasonFilter = filteredSeasons;
                }
            }
        }

        // Handle teams filter
        if (teamsParam) {
            const requestedTeams = teamsParam.split(',').map(t => t.trim()).filter(t => t.length > 0);

            if (requestedTeams.length > 0) {
                const availableTeams = await sql`
                    SELECT DISTINCT "Team" 
                    FROM sel.stats
                    WHERE "Team" IS NOT NULL AND "League" = 'PGEE'
                `;
                const validTeams = availableTeams.map(row => row.Team);
                const filteredTeams = requestedTeams.filter(team => validTeams.includes(team));

                if (filteredTeams.length > 0) {
                    teamFilter = filteredTeams;
                }
            }
        }

        // Build and execute query based on which filters are active
        if (seasonFilter && teamFilter) {
            // Both filters
            data = await sql`SELECT * FROM sel.stats WHERE "Season" = ANY(${seasonFilter}) AND "Team" = ANY(${teamFilter}) AND "League" = 'PGEE'`;
        } else if (seasonFilter) {
            // Only season filter
            data = await sql`SELECT * FROM sel.stats WHERE "Season" = ANY(${seasonFilter}) AND "League" = 'PGEE'`;
        } else if (teamFilter) {
            // Only team filter
            data = await sql`SELECT * FROM sel.stats WHERE "Team" = ANY(${teamFilter}) AND "League" = 'PGEE'`;
        } else {
            // No filters
            data = await sql`SELECT * FROM sel.stats WHERE "League" = 'PGEE'`;
        }

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
                error: 'Failed to fetch schedule data',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        );
    }
}
