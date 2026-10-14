import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Intenta cargar .env desde el directorio api o desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[DB Warning] Variable DATABASE_URL no definida. El backend utilizará fallback local si está disponible.');
}

export const pool = new Pool({
  connectionString,
  ssl: connectionString && /supabase\.co|pooler\.supabase\.com|aws|azure|sslmode=require/i.test(connectionString)
    ? { rejectUnauthorized: false }
    : false,
  max: +(process.env.PG_POOL_MAX || (process.env.VERCEL ? 4 : 20)),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]:', err.message);
});

/**
 * Ejecuta una consulta SQL parametrizada utilizando una conexión del pool.
 * @param {string} text - Sentencia SQL con placeholders $1, $2, etc.
 * @param {Array} [params] - Parámetros para la sentencia SQL.
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL) {
      console.log('[SQL Query]:', { text, duration: `${duration}ms`, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('[SQL Query Failed]:', { text, error: error.message });
    throw error;
  }
}

/**
 * Obtiene un cliente dedicado del pool para transacciones (BEGIN, COMMIT, ROLLBACK).
 * @returns {Promise<pg.PoolClient>}
 */
export async function getClient() {
  return await pool.connect();
}

/**
 * Verifica la conectividad con la base de datos Supabase.
 * @returns {Promise<boolean>}
 */
export async function checkDbConnection() {
  try {
    const res = await query('SELECT NOW() as current_time, current_database() as db_name;');
    return { ok: true, time: res.rows[0].current_time, db: res.rows[0].db_name };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
