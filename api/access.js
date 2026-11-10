/* Autorización de alumnos, rutinas y asignaciones.
   Un solo punto de decisión: canAccessAthlete(actor, athleteId, action).

   Relación entrenador-alumno:
   - Fuente compatible con datos ya existentes: users.coach_id (un alumno, un entrenador).
   - Fuente preparada para varios entrenadores: coach_athletes (varias filas históricas;
     el índice único parcial deja una sola fila activa). Quitar ese índice es el cambio
     de esquema para pasar a N entrenadores; esta función ya mira la lista, no un único id.

   allow_own_routines (columna, default false) es la base para que un alumno pueda
   armar sus propias rutinas. No se reescribe el JSON de /api/data: la app copia la
   rutina prescrita dentro de state.routines para poder ejecutarla (DailyRoutineCard).
   El permiso efectivo se calcula aquí y se entrega en /api/me. */

export const ATHLETE_ACTIONS = Object.freeze([
  'view',
  'assign',
  'confirm',
  'deactivate',
  'reassign'
]);

/** El entrenador actual es dueño del alumno si users.coach_id coincide o hay un vínculo activo. */
export function coachOwnsAthlete(coachId, athlete, activeCoachIds) {
  if (!coachId || !athlete) return false;
  if (athlete.coach_id === coachId) return true;
  return Array.isArray(activeCoachIds) && activeCoachIds.includes(coachId);
}

export const SQL = {
  loadUser: `/*q:load-user*/
    SELECT id, name, email, role, coach_id, is_active, allow_own_routines, session_version, created_at
    FROM users WHERE id = $1`,
  activeCoaches: `/*q:active-coaches*/
    SELECT coach_id FROM coach_athletes
    WHERE athlete_id = $1 AND ended_at IS NULL`,
  listAthletes: `/*q:list-athletes*/
    SELECT u.id, u.name, u.email, u.role, u.is_active, u.coach_id, u.allow_own_routines, u.created_at,
           (SELECT COUNT(*)::int FROM daily_assignments da WHERE da.athlete_id = u.id) AS total_assignments,
           (SELECT status FROM daily_assignments da WHERE da.athlete_id = u.id AND da.scheduled_date = CURRENT_DATE) AS today_status
    FROM users u
    WHERE u.role = 'ATHLETE'
      AND ($1::boolean OR u.coach_id = $2 OR EXISTS (
        SELECT 1 FROM coach_athletes ca
        WHERE ca.athlete_id = u.id AND ca.coach_id = $2 AND ca.ended_at IS NULL
      ))
    ORDER BY u.created_at DESC`,
  listTemplates: `/*q:list-templates*/
    SELECT id, coach_id, name, description, emoji, progression_policy, exercises, created_at, updated_at
    FROM routine_templates
    WHERE ($1::boolean OR coach_id = $2)
    ORDER BY updated_at DESC`,
  loadTemplate: `/*q:load-template*/
    SELECT id, coach_id, name, description, emoji, progression_policy, exercises, created_at, updated_at
    FROM routine_templates WHERE id = $1`,
  upsertTemplate: `/*q:upsert-template*/
    INSERT INTO routine_templates (id, coach_id, name, description, emoji, progression_policy, exercises)
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      emoji = EXCLUDED.emoji,
      progression_policy = EXCLUDED.progression_policy,
      exercises = EXCLUDED.exercises
    RETURNING id, coach_id, name, description, emoji, progression_policy, exercises, created_at, updated_at`,
  insertUser: `/*q:insert-user*/
    INSERT INTO users (id, name, email, role, coach_id, enrollment_token, token_expires_at, is_active, allow_own_routines)
    VALUES ($1, $2, $3, 'ATHLETE', $4, $5, $6, true, false)
    RETURNING id, name, email, role, coach_id, enrollment_token, token_expires_at, allow_own_routines, is_active`,
  insertLink: `/*q:insert-link*/
    INSERT INTO coach_athletes (id, coach_id, athlete_id, assigned_by)
    VALUES ($1, $2, $3, $4)
    RETURNING id, coach_id, athlete_id, assigned_by, ended_at`,
  upsertAssignment: `/*q:upsert-assignment*/
    INSERT INTO daily_assignments (id, athlete_id, coach_id, scheduled_date, routine_template_id, routine_payload, status)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'PENDING')
    ON CONFLICT (athlete_id, scheduled_date)
    DO UPDATE SET
      routine_payload = EXCLUDED.routine_payload,
      status = 'PENDING',
      coach_id = EXCLUDED.coach_id,
      confirmed_at = NULL
    RETURNING id, athlete_id, coach_id, scheduled_date, routine_template_id, routine_payload, status, confirmed_at`,
  listAssignments: `/*q:list-assignments*/
    SELECT da.id, da.athlete_id, u.name AS athlete_name, u.email AS athlete_email,
           da.scheduled_date, da.routine_payload, da.status, da.athlete_notes,
           da.session_rpe, da.confirmed_at, da.completed_at, da.created_at, da.coach_id
    FROM daily_assignments da
    JOIN users u ON u.id = da.athlete_id
    WHERE da.scheduled_date = $3::date
      AND ($1::boolean OR u.coach_id = $2 OR EXISTS (
        SELECT 1 FROM coach_athletes ca
        WHERE ca.athlete_id = da.athlete_id AND ca.coach_id = $2 AND ca.ended_at IS NULL
      ))
    ORDER BY da.created_at DESC`,
  setActive: `/*q:set-active*/
    UPDATE users SET is_active = $1 WHERE id = $2
    RETURNING id, is_active`,
  endOtherLinks: `/*q:end-other-links*/
    UPDATE coach_athletes
    SET ended_at = NOW()
    WHERE athlete_id = $1
      AND ended_at IS NULL
      AND ($2::text IS NULL OR coach_id <> $2)
    RETURNING id, coach_id, athlete_id`,
  insertLinkIfAbsent: `/*q:insert-link-if-absent*/
    INSERT INTO coach_athletes (id, coach_id, athlete_id, assigned_by)
    SELECT $1, $2, $3, $4
    WHERE $2::text IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM coach_athletes
        WHERE athlete_id = $3 AND coach_id = $2 AND ended_at IS NULL
      )
    RETURNING id, coach_id, athlete_id`,
  setCoach: `/*q:set-coach*/
    UPDATE users SET coach_id = $2 WHERE id = $1 AND role = 'ATHLETE'
    RETURNING id, coach_id`
};

function allow(athlete) {
  return { ok: true, status: 200, athlete };
}

function deny(status, error) {
  return { ok: false, status, error };
}

export function createAccessControl({ query, getClient, isAdmin, adminUids = [] }) {
  if (typeof query !== 'function') throw new Error('query requerida');
  if (typeof isAdmin !== 'function') throw new Error('isAdmin requerido');

  async function loadUser(id) {
    if (!id) return null;
    const res = await query(SQL.loadUser, [id]);
    return res.rows[0] || null;
  }

  async function activeCoachIds(athleteId) {
    const res = await query(SQL.activeCoaches, [athleteId]);
    return res.rows.map(row => row.coach_id);
  }

  function requireActor(actor) {
    if (!actor) return deny(401, 'not signed in');
    return null;
  }

  function requireStaff(actor) {
    const missing = requireActor(actor);
    if (missing) return missing;
    if (isAdmin(actor) || actor.role === 'COACH') return null;
    return deny(403, 'forbidden');
  }

  /**
   * @param {object|null} actor sesión { id, role, coach_id, allow_own_routines }
   * @param {string} athleteId
   * @param {'view'|'assign'|'confirm'|'deactivate'|'reassign'} action
   */
  async function canAccessAthlete(actor, athleteId, action) {
    const missing = requireActor(actor);
    if (missing) return missing;
    if (!athleteId) return deny(400, 'athlete id required');
    if (!ATHLETE_ACTIONS.includes(action)) return deny(400, 'unknown action');

    const athlete = await loadUser(athleteId);
    if (!athlete) return deny(404, 'no such athlete');

    const isSelf = actor.id === athlete.id;
    if (athlete.role !== 'ATHLETE') {
      // Un coach o admin también usa la app personal: solo sus propias filas.
      if (isSelf && (action === 'view' || action === 'confirm')) return allow(athlete);
      return deny(404, 'no such athlete');
    }

    if (action === 'confirm') {
      return isSelf ? allow(athlete) : deny(403, 'forbidden');
    }

    if (action === 'deactivate' || action === 'reassign') {
      if (!isAdmin(actor)) return deny(403, 'forbidden');
      if (action === 'deactivate' && adminUids.includes(athlete.id)) {
        return deny(400, 'cannot disable an admin');
      }
      return allow(athlete);
    }

    if (isAdmin(actor)) return allow(athlete);
    if (action === 'view' && isSelf) return allow(athlete);

    if (actor.role === 'COACH') {
      const links = await activeCoachIds(athlete.id);
      if (coachOwnsAthlete(actor.id, athlete, links) && (action === 'view' || action === 'assign')) {
        return allow(athlete);
      }
    }

    return deny(403, 'forbidden');
  }

  async function canUseOwnRoutines(actor) {
    if (!actor) return false;
    if (isAdmin(actor) || actor.role === 'COACH') return true;
    if (actor.allow_own_routines) return true;
    if (actor.role !== 'ATHLETE') return true;
    const links = await activeCoachIds(actor.id);
    const hasCoach = !!actor.coach_id || links.length > 0;
    return !hasCoach;
  }

  async function listAthletes(actor) {
    const gate = requireStaff(actor);
    if (gate) return gate;
    const res = await query(SQL.listAthletes, [isAdmin(actor), actor.id]);
    return { ok: true, status: 200, athletes: res.rows };
  }

  async function createAthlete(actor, input, ids) {
    const gate = requireStaff(actor);
    if (gate) return gate;
    const name = String(input?.name || '').trim().slice(0, 80);
    const email = String(input?.email || '').trim().toLowerCase().slice(0, 120);
    if (!name || !email) return deny(400, 'Nombre y correo electrónico son requeridos');

    let coachId = actor.id;
    if (isAdmin(actor) && input.coachId) {
      const coach = await loadUser(input.coachId);
      if (!coach || coach.is_active === false) return deny(400, 'Entrenador no válido');
      if (coach.role !== 'COACH' && coach.role !== 'ADMIN') {
        return deny(400, 'El usuario indicado no es entrenador');
      }
      coachId = coach.id;
    }

    const athleteId = ids?.athleteId || input.athleteId;
    const linkId = ids?.linkId || input.linkId;
    const enrollmentToken = ids?.enrollmentToken || input.enrollmentToken;
    const expiresAt = ids?.expiresAt || input.expiresAt;
    if (!athleteId || !linkId || !enrollmentToken || !expiresAt) {
      return deny(500, 'identificadores de alta incompletos');
    }

    try {
      const athlete = await transaction(async (q) => {
        const inserted = await q(SQL.insertUser, [athleteId, name, email, coachId, enrollmentToken, expiresAt]);
        await q(SQL.insertLink, [linkId, coachId, athleteId, actor.id]);
        return inserted.rows[0];
      });
      return { ok: true, status: 201, athlete };
    } catch (err) {
      if (err.code === '23505') return deny(409, 'El correo electrónico ya está registrado');
      throw err;
    }
  }

  async function listTemplates(actor) {
    const gate = requireStaff(actor);
    if (gate) return gate;
    const res = await query(SQL.listTemplates, [isAdmin(actor), actor.id]);
    return { ok: true, status: 200, templates: res.rows };
  }

  async function saveTemplate(actor, input, ids) {
    const gate = requireStaff(actor);
    if (gate) return gate;
    const name = String(input?.name || '').trim().slice(0, 100);
    if (!name) return deny(400, 'Nombre de rutina requerido');
    const templateId = String(input?.id || '').trim() || ids?.templateId;
    if (!templateId) return deny(500, 'identificador de plantilla incompleto');

    const existing = input?.id ? (await query(SQL.loadTemplate, [templateId])).rows[0] : null;
    if (existing && !isAdmin(actor) && existing.coach_id !== actor.id) return deny(403, 'forbidden');

    const description = String(input?.description || '').slice(0, 500);
    const emoji = String(input?.emoji || 'dumbbell').slice(0, 32);
    const progressionPolicy = String(input?.progression_policy || input?.progressionPolicy || 'linear').slice(0, 32);
    const exercises = Array.isArray(input?.exercises) ? input.exercises : [];
    const ownerId = existing ? existing.coach_id : actor.id;
    const res = await query(SQL.upsertTemplate, [
      templateId, ownerId, name, description, emoji, progressionPolicy, JSON.stringify(exercises)
    ]);
    return { ok: true, status: 200, template: res.rows[0] };
  }

  async function assignRoutine(actor, input, ids) {
    const gate = requireStaff(actor);
    if (gate) return gate;
    const athleteIds = [...new Set((input?.athleteIds || []).map(id => String(id || '').trim()).filter(Boolean))];
    const scheduledDate = String(input?.scheduledDate || '').trim();
    const routine = input?.routine;
    if (!athleteIds.length || !scheduledDate || !routine || typeof routine !== 'object') {
      return deny(400, 'Se requiere lista de atletas, fecha programada y datos de rutina');
    }
    if (athleteIds.length > 100) return deny(400, 'Demasiados atletas');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) return deny(400, 'Fecha inválida');

    for (const athleteId of athleteIds) {
      const decision = await canAccessAthlete(actor, athleteId, 'assign');
      if (!decision.ok) return decision;
    }

    const routineTemplateId = input.routineTemplateId || null;
    if (routineTemplateId) {
      const template = (await query(SQL.loadTemplate, [routineTemplateId])).rows[0];
      if (!template) return deny(404, 'Plantilla no encontrada');
      if (!isAdmin(actor) && template.coach_id !== actor.id) return deny(403, 'forbidden');
    }

    const assignments = [];
    await transaction(async (q) => {
      for (let i = 0; i < athleteIds.length; i++) {
        const athleteId = athleteIds[i];
        const asgnId = ids?.assignmentIds?.[i] || ids?.nextAssignmentId?.(athleteId, i);
        if (!asgnId) throw Object.assign(new Error('identificador de asignación incompleto'), { status: 500 });
        const res = await q(SQL.upsertAssignment, [
          asgnId, athleteId, actor.id, scheduledDate, routineTemplateId, JSON.stringify(routine)
        ]);
        assignments.push(res.rows[0]);
      }
    });
    return { ok: true, status: 200, assignments };
  }

  async function listAssignments(actor, date) {
    const gate = requireStaff(actor);
    if (gate) return gate;
    const scheduledDate = date || new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) return deny(400, 'Fecha inválida');
    const res = await query(SQL.listAssignments, [isAdmin(actor), actor.id, scheduledDate]);
    return { ok: true, status: 200, assignments: res.rows, date: scheduledDate };
  }

  async function setUserActive(actor, { id, disabled }) {
    const missing = requireActor(actor);
    if (missing) return missing;
    if (!id) return deny(400, 'id required');

    const target = await loadUser(id);
    if (!target) return deny(404, 'no such user');

    if (target.role === 'ATHLETE') {
      const decision = await canAccessAthlete(actor, id, 'deactivate');
      if (!decision.ok) return decision;
    } else if (!isAdmin(actor)) {
      return deny(403, 'forbidden');
    } else if (adminUids.includes(id)) {
      return deny(400, 'cannot disable an admin');
    }

    const res = await query(SQL.setActive, [!disabled, id]);
    if (!res.rows.length) return deny(404, 'no such user');
    return { ok: true, status: 200, id, disabled: !!disabled };
  }

  async function reassignAthlete(actor, { athleteId, coachId }, ids) {
    const decision = await canAccessAthlete(actor, athleteId, 'reassign');
    if (!decision.ok) return decision;

    const nextCoach = coachId ? String(coachId) : null;
    if (nextCoach) {
      const coach = await loadUser(nextCoach);
      if (!coach || coach.is_active === false) return deny(400, 'Entrenador no válido');
      if (coach.role !== 'COACH' && coach.role !== 'ADMIN') {
        return deny(400, 'El usuario indicado no es entrenador');
      }
    }

    const linkId = ids?.linkId;
    await transaction(async (q) => {
      await q(SQL.endOtherLinks, [athleteId, nextCoach]);
      if (nextCoach) {
        if (!linkId) throw Object.assign(new Error('identificador de vínculo incompleto'), { status: 500 });
        await q(SQL.insertLinkIfAbsent, [linkId, nextCoach, athleteId, actor.id]);
      }
      await q(SQL.setCoach, [athleteId, nextCoach]);
    });
    return { ok: true, status: 200, athleteId, coachId: nextCoach };
  }

  async function authorizeUserRecord(actor, userId) {
    const missing = requireActor(actor);
    if (missing) return missing;
    if (!userId) return deny(400, 'id required');
    const user = await loadUser(userId);
    if (!user) return deny(404, 'no such user');
    if (user.role !== 'ATHLETE') {
      if (!isAdmin(actor)) return deny(403, 'forbidden');
      return allow(user);
    }
    const decision = await canAccessAthlete(actor, userId, 'view');
    if (!decision.ok) return decision;
    return allow(user);
  }

  async function transaction(fn) {
    if (typeof getClient !== 'function') return fn(query);
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const result = await fn((text, params) => client.query(text, params));
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch { /* el error original manda */ }
      throw err;
    } finally {
      client.release?.();
    }
  }

  return {
    canAccessAthlete,
    canUseOwnRoutines,
    listAthletes,
    createAthlete,
    listTemplates,
    saveTemplate,
    assignRoutine,
    listAssignments,
    setUserActive,
    reassignAthlete,
    authorizeUserRecord
  };
}
