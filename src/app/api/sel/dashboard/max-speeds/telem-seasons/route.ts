import sql from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSecondsUntilNext10PMUTC } from '@/lib/cache-headers';

export async function GET() {
  try {
    // Get all seasons that have telemetry data
    const data = await sql`
      SELECT DISTINCT m.season
      FROM sel.telemetry t
      JOIN sel.matches m ON t.match_id = m.match_id
      WHERE t.max_speed IS NOT NULL AND m.season IS NOT NULL
      ORDER BY m.season DESC
    `;
    const seasons = data.map(row => row.season);
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
        error: 'Failed to fetch telemetry seasons',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
