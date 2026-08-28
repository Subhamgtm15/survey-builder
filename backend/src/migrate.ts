import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Applies the schema, then seeds a default admin so the panel is usable immediately.
async function migrate() {
  const sql = readFileSync(join(__dirname, "../migrations/0000_init.sql"), "utf-8");
  await pool.query(sql);
  console.log("Schema applied.");

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@survey.app";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  const hashed = await bcrypt.hash(password, 10);

  // ON CONFLICT keeps the migration idempotent if run more than once.
  await pool.query(
    `INSERT INTO admins (email, password) VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING`,
    [email, hashed]
  );
  console.log(`Seed admin ready: ${email}`);

  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
