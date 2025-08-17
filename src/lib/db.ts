import postgres from 'postgres';

const isProduction = process.env.NODE_ENV === 'production';

const sql = postgres(process.env.DATABASE_URL!, {
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    path: process.env.SOCKET_PATH || undefined,
});

export default sql;