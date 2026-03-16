import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import pkg from "pg";
const { Pool } = pkg;
console.log('DATABASE_URL:', process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool);
export { db };
