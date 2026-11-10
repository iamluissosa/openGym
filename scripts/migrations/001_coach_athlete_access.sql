-- ============================================================================
-- openGym — Fase 0: autorización entrenador ↔ alumno
-- Idempotente. Pensada para una base Supabase que ya tiene scripts/schema.sql
-- (users.coach_id, roles, plantillas y asignaciones diarias).
--
-- Cómo aplicarla: SQL Editor de Supabase, o psql contra DATABASE_URL.
-- Ejecutarla ANTES de desplegar la API que importa api/access.js.
--
-- Modelo:
--   * Un alumno tiene un entrenador activo (índice único parcial).
--   * coach_athletes guarda el historial. Para permitir varios entrenadores
--     a la vez, más adelante, basta con eliminar el índice
--     coach_athletes_one_active_coach. La API ya autoriza por la lista.
--   * users.coach_id se mantiene sincronizado (datos ya existentes y lecturas
--     anteriores a esta tabla).
--   * allow_own_routines queda apagado. El alta de un alumno no lo enciende.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS allow_own_routines BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS coach_athletes (
    id VARCHAR(32) PRIMARY KEY,
    coach_id VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    athlete_id VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    CONSTRAINT coach_athletes_not_self CHECK (coach_id <> athlete_id)
);

-- Un entrenador activo por alumno. Borrar este índice es el paso de esquema
-- para pasar a varios entrenadores simultáneos.
CREATE UNIQUE INDEX IF NOT EXISTS coach_athletes_one_active_coach
  ON coach_athletes (athlete_id)
  WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS coach_athletes_coach_active
  ON coach_athletes (coach_id)
  WHERE ended_at IS NULL;

-- Copia los vínculos que ya viven en users.coach_id. No pisa filas activas.
INSERT INTO coach_athletes (id, coach_id, athlete_id, assigned_by, assigned_at)
SELECT
  substr(md5(u.id || ':' || u.coach_id), 1, 32),
  u.coach_id,
  u.id,
  u.coach_id,
  COALESCE(u.created_at, NOW())
FROM users u
WHERE u.role = 'ATHLETE'
  AND u.coach_id IS NOT NULL
  AND u.coach_id <> u.id
  AND NOT EXISTS (
    SELECT 1 FROM coach_athletes ca
    WHERE ca.athlete_id = u.id
      AND ca.ended_at IS NULL
  );

-- Si la tabla ya tenía un vínculo activo y users.coach_id estaba vacío, rellena la columna.
UPDATE users u
SET coach_id = ca.coach_id
FROM coach_athletes ca
WHERE ca.athlete_id = u.id
  AND ca.ended_at IS NULL
  AND u.coach_id IS NULL
  AND u.role = 'ATHLETE';
