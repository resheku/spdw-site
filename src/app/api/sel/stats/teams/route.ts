import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const result = await sql`
            SELECT DISTINCT "Team" 
            FROM stats 
            WHERE "Team" IS NOT NULL
            ORDER BY "Team" ASC
        `;

        const teams = result.map(row => row.Team);
        return NextResponse.json(teams);
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
