import sql from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSecondsUntilNext10PMUTC } from '@/lib/cache-headers';

export async function GET() {
    try {
        const result = await sql`
            SELECT DISTINCT "Team" 
            FROM sel.stats
            WHERE "Team" IS NOT NULL
            ORDER BY "Team" ASC
        `;

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
