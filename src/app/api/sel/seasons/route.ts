import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {

        const data = await sql`
            SELECT DISTINCT "Season" 
            FROM sel.stats
            WHERE "Season" IS NOT NULL
            ORDER BY "Season" DESC
        `;

        const seasons = data.map(row => row.Season);
        return NextResponse.json(seasons);
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