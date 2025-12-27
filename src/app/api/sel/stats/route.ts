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
                seasonFilter = requestedSeasons;
            }
        }

        // Handle teams filter
        if (teamsParam) {
            const requestedTeams = teamsParam.split(',').map(t => t.trim()).filter(t => t.length > 0);
            if (requestedTeams.length > 0) {
                teamFilter = requestedTeams;
            }
        }

        // Handle leagues filter
        if (leaguesParam) {
            const requestedLeagues = leaguesParam.split(',').map(l => l.trim()).filter(l => l.length > 0);
            if (requestedLeagues.length > 0) {
                leagueFilter = requestedLeagues;
            }
        }

        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
            console.log('Filters:', { seasonFilter, teamFilter, leagueFilter });
        }

        // Build query with dynamic WHERE conditions
        let query = 'SELECT * FROM sel.stats WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;
        
        if (seasonFilter) {
            query += ` AND "Season" = ANY($${paramIndex})`;
            params.push(seasonFilter);
            paramIndex++;
        }
        
        if (leagueFilter) {
            query += ` AND "League" = ANY($${paramIndex})`;
            params.push(leagueFilter);
            paramIndex++;
        }
        
        if (teamFilter) {
            // For team filtering, match if the Team column contains any of the selected teams
            // This handles cases like "LOD/TAR" when filtering by "LOD" or "TAR"
            const teamConditions = teamFilter.map(team => {
                const conditions = [
                    `"Team" = $${paramIndex}`,
                    `"Team" LIKE $${paramIndex + 1}`,
                    `"Team" LIKE $${paramIndex + 2}`,
                    `"Team" LIKE $${paramIndex + 3}`
                ].join(' OR ');
                params.push(team, team + '/%', '%/' + team, '%/' + team + '/%');
                paramIndex += 4;
                return `(${conditions})`;
            }).join(' OR ');
            
            query += ` AND (${teamConditions})`;
        }
        
        // Execute query
        data = await sql.unsafe(query, params);

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
