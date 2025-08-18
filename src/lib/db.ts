import postgres from 'postgres';

const isProduction = process.env.NODE_ENV === 'production';

const sql = postgres(process.env.DATABASE_URL!, {
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    max: 20,
    idle_timeout: 20,
    connect_timeout: 60,
});

export default sql;