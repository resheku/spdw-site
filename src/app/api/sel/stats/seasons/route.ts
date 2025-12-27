import sql from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getSecondsUntilNext10PMUTC } from '@/lib/cache-headers';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const leagues = searchParams.get('leagues')?.split(',').filter(Boolean) || [];

        // Build dynamic query based on filters
        let query;
        
        if (leagues.length > 0) {
            query = sql`
                SELECT DISTINCT "Season" 
                FROM sel.stats
                WHERE "Season" IS NOT NULL
                    AND "League" IN ${sql(leagues)}
                ORDER BY "Season" DESC
            `;
        } else {
            query = sql`
                SELECT DISTINCT "Season" 
                FROM sel.stats
                WHERE "Season" IS NOT NULL
                ORDER BY "Season" DESC
            `;
        }

        const data = await query;

        const seasons = data.map(row => row.Season);
        const res = NextResponse.json(seasons);
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
                error: 'Failed to fetch seasons data',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        );
    }
}
