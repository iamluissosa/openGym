-- ============================================================================
-- openGym - PostgreSQL Database Schema (Supabase)
-- Versión: 2.0.0 (Multi-Tenant, Coach Portal & Daily Routines Support)
-- ============================================================================

-- Habilitar extensión criptográfica para generación de UUIDs y hashes seguros
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS (ENUMS)
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'COACH', 'ATHLETE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE assignment_status AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 2. FUNCIÓN DISPARADORA PARA ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. TABLA: users (Usuarios del Sistema: Atletas, Entrenadores y Admins)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    email VARCHAR(120) UNIQUE,
    role user_role NOT NULL DEFAULT 'ATHLETE',
    coach_id VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL,
    enrollment_token VARCHAR(64) UNIQUE,
    token_expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    session_version INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_coach_id ON users(coach_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_token ON users(enrollment_token) WHERE enrollment_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

DROP TRIGGER IF EXISTS set_timestamp_users ON users;
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ----------------------------------------------------------------------------
-- 4. TABLA: passkey_credentials (Credenciales FIDO2 / WebAuthn)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS passkey_credentials (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    transports TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passkeys_user_id ON passkey_credentials(user_id);

-- ----------------------------------------------------------------------------
-- 5. TABLA: routine_templates (Plantillas de Rutinas Creadas por Entrenadores)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS routine_templates (
    id VARCHAR(32) PRIMARY KEY,
    coach_id VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    emoji VARCHAR(32) DEFAULT 'dumbbell',
    progression_policy VARCHAR(32) DEFAULT 'linear',
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routine_templates_coach ON routine_templates(coach_id);

DROP TRIGGER IF EXISTS set_timestamp_routine_templates ON routine_templates;
CREATE TRIGGER set_timestamp_routine_templates
BEFORE UPDATE ON routine_templates
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ----------------------------------------------------------------------------
-- 6. TABLA: daily_assignments (Asignación y Confirmación de Rutinas Diarias)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_assignments (
    id VARCHAR(32) PRIMARY KEY,
    athlete_id VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coach_id VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    routine_template_id VARCHAR(32) REFERENCES routine_templates(id) ON DELETE SET NULL,
    routine_payload JSONB NOT NULL,
    status assignment_status NOT NULL DEFAULT 'PENDING',
    athlete_notes TEXT,
    session_rpe NUMERIC(3,1),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_athlete_scheduled_date UNIQUE (athlete_id, scheduled_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_assignments_athlete_date ON daily_assignments(athlete_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_daily_assignments_coach_date ON daily_assignments(coach_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_daily_assignments_coach_status ON daily_assignments(coach_id, status, scheduled_date);

DROP TRIGGER IF EXISTS set_timestamp_daily_assignments ON daily_assignments;
CREATE TRIGGER set_timestamp_daily_assignments
BEFORE UPDATE ON daily_assignments
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ----------------------------------------------------------------------------
-- 7. TABLA: user_states (Almacén de Estado Local-First de Atletas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_states (
    user_id VARCHAR(32) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at BIGINT NOT NULL -- Epoch en milisegundos (_ts del cliente)
);

-- ----------------------------------------------------------------------------
-- 8. TABLA: push_subscriptions (Suscripciones Web Push RFC 8291/8292)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_subscriptions (
    endpoint TEXT PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    keys JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- ----------------------------------------------------------------------------
-- 9. TABLA: invite_codes (Códigos de Invitación para Registro Privado)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invite_codes (
    code VARCHAR(32) PRIMARY KEY,
    note VARCHAR(100),
    created_by VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL,
    used_by VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_used ON invite_codes(used_by) WHERE used_by IS NULL;
