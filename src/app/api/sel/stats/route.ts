import sql from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSecondsUntilNext10PMUTC } from '@/lib/cache-headers';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const seasonsParam = searchParams.get('season');
        const teamsParam = searchParams.get('team');
        const leaguesParam = searchParams.get('league');

        let data: any[];

        // Build WHERE conditions based on filters
        let seasonFilter: number[] | null = null;
        let teamFilter: string[] | null = null;
        let leagueFilter: string[] | null = null;

        // Handle seasons filter
        if (seasonsParam) {
            const requestedSeasons = seasonsParam.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s));

            if (requestedSeasons.length > 0) {
                const availableSeasons = await sql`
                    SELECT DISTINCT "Season" 
                    FROM sel.stats
                    WHERE "Season" IS NOT NULL
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
                    WHERE "Team" IS NOT NULL
                `;
                const validTeams = availableTeams.map(row => row.Team);
                const filteredTeams = requestedTeams.filter(team => validTeams.includes(team));

                if (filteredTeams.length > 0) {
                    teamFilter = filteredTeams;
                }
            }
        }

        // Handle leagues filter
        if (leaguesParam) {
            const requestedLeagues = leaguesParam.split(',').map(l => l.trim()).filter(l => l.length > 0);

            if (requestedLeagues.length > 0) {
                const availableLeagues = await sql`
                    SELECT DISTINCT "League" 
                    FROM sel.stats
                    WHERE "League" IS NOT NULL
                `;
                const validLeagues = availableLeagues.map(row => row.League);
                const filteredLeagues = requestedLeagues.filter(league => validLeagues.includes(league));

                if (filteredLeagues.length > 0) {
                    leagueFilter = filteredLeagues;
                }
            }
        }

        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
            console.log('Filters:', { seasonFilter, teamFilter, leagueFilter });
        }

        // Build and execute query based on which filters are active
        if (seasonFilter && teamFilter && leagueFilter) {
            // All three filters
            data = await sql`SELECT * FROM sel.stats WHERE "Season" = ANY(${seasonFilter}) AND "Team" = ANY(${teamFilter}) AND "League" = ANY(${leagueFilter})`;
        } else if (seasonFilter && teamFilter) {
            // Season and team filters
            data = await sql`SELECT * FROM sel.stats WHERE "Season" = ANY(${seasonFilter}) AND "Team" = ANY(${teamFilter})`;
        } else if (seasonFilter && leagueFilter) {
            // Season and league filters
            data = await sql`SELECT * FROM sel.stats WHERE "Season" = ANY(${seasonFilter}) AND "League" = ANY(${leagueFilter})`;
        } else if (teamFilter && leagueFilter) {
            // Team and league filters
            data = await sql`SELECT * FROM sel.stats WHERE "Team" = ANY(${teamFilter}) AND "League" = ANY(${leagueFilter})`;
        } else if (seasonFilter) {
            // Only season filter
            data = await sql`SELECT * FROM sel.stats WHERE "Season" = ANY(${seasonFilter})`;
        } else if (teamFilter) {
            // Only team filter
            data = await sql`SELECT * FROM sel.stats WHERE "Team" = ANY(${teamFilter})`;
        } else if (leagueFilter) {
            // Only league filter
            data = await sql`SELECT * FROM sel.stats WHERE "League" = ANY(${leagueFilter})`;
        } else {
            // No filters
            data = await sql`SELECT * FROM sel.stats`;
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
