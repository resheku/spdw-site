import sql from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const seasonsParam = searchParams.get('season');
        const teamsParam = searchParams.get('team');

        let data: any[];

        // Build WHERE conditions based on filters
        let whereConditions: string[] = [];
        let queryParams: any[] = [];

        // Handle seasons filter
        if (seasonsParam) {
            const requestedSeasons = seasonsParam.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s));

            if (requestedSeasons.length > 0) {
                const availableSeasons = await sql`
                    SELECT DISTINCT "Season" 
                    FROM stats 
                    WHERE "Season" IS NOT NULL
                `;
                const validSeasons = availableSeasons.map(row => row.Season);
                const filteredSeasons = requestedSeasons.filter(season => validSeasons.includes(season));

                if (filteredSeasons.length > 0) {
                    whereConditions.push(`"Season" = ANY($${queryParams.length + 1})`);
                    queryParams.push(filteredSeasons);
                }
            }
        }

        // Handle teams filter
        if (teamsParam) {
            const requestedTeams = teamsParam.split(',').map(t => t.trim()).filter(t => t.length > 0);

            if (requestedTeams.length > 0) {
                const availableTeams = await sql`
                    SELECT DISTINCT "Team" 
                    FROM stats 
                    WHERE "Team" IS NOT NULL
                `;
                const validTeams = availableTeams.map(row => row.Team);
                const filteredTeams = requestedTeams.filter(team => validTeams.includes(team));

                if (filteredTeams.length > 0) {
                    whereConditions.push(`"Team" = ANY($${queryParams.length + 1})`);
                    queryParams.push(filteredTeams);
                }
            }
        }

        // Build and execute query
        if (whereConditions.length > 0) {
            if (queryParams.length === 1) {
                // Single filter condition
                if (seasonsParam && !teamsParam) {
                    data = await sql`SELECT * FROM stats WHERE "Season" = ANY(${queryParams[0]})`;
                } else if (teamsParam && !seasonsParam) {
                    data = await sql`SELECT * FROM stats WHERE "Team" = ANY(${queryParams[0]})`;
                } else {
                    // Both filters
                    data = await sql`SELECT * FROM stats WHERE "Season" = ANY(${queryParams[0]}) AND "Team" = ANY(${queryParams[1]})`;
                }
            } else if (queryParams.length === 2) {
                // Both season and team filters
                data = await sql`SELECT * FROM stats WHERE "Season" = ANY(${queryParams[0]}) AND "Team" = ANY(${queryParams[1]})`;
            } else {
                data = await sql`SELECT * FROM stats`;
            }
        } else {
            data = await sql`SELECT * FROM stats`;
        }

        return NextResponse.json(data);
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
