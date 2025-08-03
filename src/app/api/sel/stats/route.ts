import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Assuming your query is something like this:
        const data = await sql`SELECT * FROM stats`;

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
