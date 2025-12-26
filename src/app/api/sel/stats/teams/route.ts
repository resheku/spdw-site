import sql from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSecondsUntilNext10PMUTC } from '@/lib/cache-headers';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const seasons = searchParams.get('seasons')?.split(',').map(s => parseInt(s)).filter(n => !isNaN(n)) || [];
        const leagues = searchParams.get('leagues')?.split(',').filter(Boolean) || [];

        // Build dynamic query based on filters
        let query = sql`
            SELECT DISTINCT "Team" 
            FROM sel.stats
            WHERE "Team" IS NOT NULL
        `;

        // Add season filter if provided
        if (seasons.length > 0) {
            query = sql`
                SELECT DISTINCT "Team" 
                FROM sel.stats
                WHERE "Team" IS NOT NULL
                    AND "Season" IN ${sql(seasons)}
            `;
        }

        // Add league filter if provided
        if (leagues.length > 0) {
            if (seasons.length > 0) {
                query = sql`
                    SELECT DISTINCT "Team" 
                    FROM sel.stats
                    WHERE "Team" IS NOT NULL
                        AND "Season" IN ${sql(seasons)}
                        AND "League" IN ${sql(leagues)}
                `;
            } else {
                query = sql`
                    SELECT DISTINCT "Team" 
                    FROM sel.stats
                    WHERE "Team" IS NOT NULL
                        AND "League" IN ${sql(leagues)}
                `;
            }
        }

        // Add ORDER BY
        query = sql`${query} ORDER BY "Team" ASC`;

        const result = await query;

        const teams = result.map(row => row.Team);
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
