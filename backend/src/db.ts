import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// In production a single DATABASE_URL is provided (Neon/Render) and requires SSL.
// Locally we fall back to the individual DB_* variables.
export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
    });
