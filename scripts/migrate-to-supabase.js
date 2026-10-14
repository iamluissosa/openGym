#!/usr/bin/env node
/**
 * openGym - Script de Migración de Archivos Planos a Supabase PostgreSQL
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL no está definida en .env');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes('supabase.co') ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  console.log('🚀 Iniciando migración de datos hacia Supabase PostgreSQL...');
  const dataDir = path.resolve(__dirname, '../data');
  const dbFile = path.join(dataDir, 'db.json');

  if (!fs.existsSync(dbFile)) {
    console.log('ℹ️  No se encontró data/db.json. No hay datos locales para migrar.');
    await pool.end();
    return;
  }

  let dbData;
  try {
    dbData = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  } catch (err) {
    console.error('❌ Error leyendo data/db.json:', err.message);
    await pool.end();
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Migrar Usuarios
    const users = dbData.users || [];
    console.log(`📦 Procesando ${users.length} usuario(s)...`);
    for (const u of users) {
      const role = u.admin ? 'ADMIN' : 'ATHLETE';
      await client.query(`
        INSERT INTO users (id, name, email, role, is_active, session_version, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          session_version = EXCLUDED.session_version;
      `, [
        u.id,
        u.name,
        u.email || null,
        role,
        !u.disabled,
        u.sv || 0,
        u.created || new Date().toISOString()
      ]);
    }

    // 2. Migrar Credenciales WebAuthn
    const creds = dbData.creds || [];
    console.log(`🔑 Procesando ${creds.length} credencial(es) Passkey...`);
    for (const c of creds) {
      await client.query(`
        INSERT INTO passkey_credentials (id, user_id, public_key, counter, transports)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          counter = EXCLUDED.counter,
          transports = EXCLUDED.transports;
      `, [
        c.id,
        c.userId,
        c.publicKey,
        c.counter || 0,
        c.transports || []
      ]);
    }

    // 3. Migrar Suscripciones Push
    const subs = dbData.subs || [];
    console.log(`🔔 Procesando ${subs.length} suscripción(es) Web Push...`);
    for (const s of subs) {
      await client.query(`
        INSERT INTO push_subscriptions (endpoint, user_id, keys, created_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (endpoint) DO NOTHING;
      `, [
        s.endpoint,
        s.userId,
        JSON.stringify(s.keys || {}),
        s.created || new Date().toISOString()
      ]);
    }

    // 4. Migrar Códigos de Invitación
    const invites = dbData.invites || [];
    console.log(`🎟️  Procesando ${invites.length} código(s) de invitación...`);
    for (const inv of invites) {
      await client.query(`
        INSERT INTO invite_codes (code, note, created_by, used_by, created_at, used_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (code) DO UPDATE SET
          used_by = EXCLUDED.used_by,
          used_at = EXCLUDED.used_at;
      `, [
        inv.code,
        inv.note || null,
        inv.createdBy || null,
        inv.usedBy || null,
        inv.created || new Date().toISOString(),
        inv.usedAt || null
      ]);
    }

    // 5. Migrar Estados de Usuario (state-<uid>.json)
    const files = fs.readdirSync(dataDir);
    let stateCount = 0;
    for (const file of files) {
      if (file.startsWith('state-') && file.endsWith('.json')) {
        const uid = file.slice(6, -5);
        try {
          const stateObj = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
          await client.query(`
            INSERT INTO user_states (user_id, state, updated_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id) DO UPDATE SET
              state = EXCLUDED.state,
              updated_at = EXCLUDED.updated_at;
          `, [
            uid,
            JSON.stringify(stateObj),
            stateObj._ts || Date.now()
          ]);
          stateCount++;
        } catch (e) {
          console.warn(`⚠️ Error leyendo archivo de estado ${file}:`, e.message);
        }
      }
    }
    console.log(`📊 Procesado(s) ${stateCount} archivo(s) de estado de usuario.`);

    await client.query('COMMIT');
    console.log('🎉 Migración completada exitosamente sin errores.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error crítico durante la migración:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
