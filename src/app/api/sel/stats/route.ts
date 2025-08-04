import sql from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const seasonsParam = searchParams.get('season');

        let data: any[];

        if (seasonsParam) {
            // Parse comma-separated seasons
            const requestedSeasons = seasonsParam.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s));

            if (requestedSeasons.length > 0) {
                // First, get all available seasons from the database
                const availableSeasons = await sql`
                    SELECT DISTINCT "Season" 
                    FROM stats 
                    WHERE "Season" IS NOT NULL
                `;

                const validSeasons = availableSeasons.map(row => row.Season);

                // Filter requested seasons to only include valid ones
                const filteredSeasons = requestedSeasons.filter(season => validSeasons.includes(season));

                if (filteredSeasons.length > 0) {
                    // Use safe parameterized query with SQL fragments
                    data = await sql`
                        SELECT * FROM stats 
                        WHERE "Season" = ANY(${filteredSeasons})
                    `;
                } else {
                    // If no valid seasons requested, return empty array
                    data = [];
                }
            } else {
                data = await sql`SELECT * FROM stats`;
            }
        } else {
            data = await sql`SELECT * FROM stats`;
        }

        // You need to return a NextResponse object
        return NextResponse.json(data);
    } catch (error) {
        console.error('Database query failed:', error);

        // Return an appropriate error response
        return NextResponse.json(
            {
                error: 'Failed to fetch schedule data',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        );
    }
}
