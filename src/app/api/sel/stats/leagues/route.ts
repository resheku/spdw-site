import sql from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSecondsUntilNext10PMUTC } from '@/lib/cache-headers';

export async function GET() {
    try {
        const result = await sql`
            SELECT DISTINCT "League" 
            FROM sel.stats
            WHERE "League" IS NOT NULL
            ORDER BY "League" ASC
        `;

        const leagues = result.map(row => row.League);
        const res = NextResponse.json(leagues);
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
                error: 'Failed to fetch leagues data',
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        );
    }
}
