// import sql from '@/lib/db';
import { NextResponse } from 'next/server';

// export async function GET() {
//     // Assuming your query is something like this:
//     const data = await sql`SELECT * FROM schedule`;

//     // You need to return a NextResponse object
//     return NextResponse.json(data);
// }

export async function GET() {
    // Replace this with your actual data source
    const data = [
        {
            id: "728ed52f",
            amount: 100,
            status: "pending",
            email: "m@example.com",
        },
        {
            id: "728ed52a",
            amount: 101,
            status: "pending",
            email: "mo@example.com",
        },
    ];
    return NextResponse.json(data);
}
