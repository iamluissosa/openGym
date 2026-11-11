import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';
import { SQL, coachOwnsAthlete, createAccessControl } from './access.js';
import { canOpenCoachPortal } from '../frontend/src/lib/roles.js';

const admin = user({ id: 'admin1', name: 'Ada', role: 'ADMIN' });
const coachA = user({ id: 'coachA', name: 'Ana', role: 'COACH' });
const coachB = user({ id: 'coachB', name: 'Bea', role: 'COACH' });
const athleteA = user({ id: 'athA', name: 'Leo', role: 'ATHLETE', coach_id: 'coachA' });
const athleteB = user({ id: 'athB', name: 'Noa', role: 'ATHLETE', coach_id: 'coachB' });
const solo = user({ id: 'solo', name: 'Sol', role: 'ATHLETE', coach_id: null });
const legacy = user({ id: 'legacy', name: 'Lia', role: 'ATHLETE', coach_id: 'coachA' });
const linkedOnly = user({ id: 'linked', name: 'Luz', role: 'ATHLETE', coach_id: null });

function user(partial) {
  return {
    email: (partial.id + '@gym.test').toLowerCase(),
    is_active: true,
    allow_own_routines: false,
    coach_id: null,
    session_version: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    ...partial
  };
}

function seed(extra = {}) {
  return {
    users: [admin, coachA, coachB, athleteA, athleteB, solo, legacy, linkedOnly].map(u => ({ ...u })),
    links: [
      { id: 'ca-a', coach_id: 'coachA', athlete_id: 'athA', assigned_by: 'coachA', ended_at: null },
      { id: 'ca-b', coach_id: 'coachB', athlete_id: 'athB', assigned_by: 'coachB', ended_at: null },
      { id: 'ca-l', coach_id: 'coachA', athlete_id: 'linked', assigned_by: 'admin1', ended_at: null }
    ],
    templates: [
      { id: 'tplA', coach_id: 'coachA', name: 'Fuerza A', description: '', emoji: 'dumbbell', progression_policy: 'linear', exercises: [] },
      { id: 'tplB', coach_id: 'coachB', name: 'Fuerza B', description: '', emoji: 'dumbbell', progression_policy: 'linear', exercises: [] }
    ],
    assignments: [
      {
        id: 'asg1', athlete_id: 'athA', coach_id: 'coachA', scheduled_date: '2026-04-01',
        routine_payload: { name: 'Vieja' }, status: 'COMPLETED', athlete_notes: null,
        created_at: '2026-04-01T10:00:00.000Z'
      }
    ],
    ...extra
  };
}

function activeIds(db, athleteId) {
  return db.links.filter(link => link.athlete_id === athleteId && !link.ended_at).map(link => link.coach_id);
}

function seesAthlete(db, coachId, athlete, isAdminUser) {
  if (!athlete || athlete.role !== 'ATHLETE') return false;
  if (isAdminUser) return true;
  return coachOwnsAthlete(coachId, athlete, activeIds(db, athlete.id));
}

function qtag(sql) {
  const match = String(sql).match(/\/\*q:([a-z0-9-]+)\*\//);
  if (!match) throw new Error('SQL sin etiqueta q:: ' + sql);
  return match[1];
}

function dispatch(db, sql, params) {
  switch (qtag(sql)) {
    case 'load-user': {
      const found = db.users.find(row => row.id === params[0]);
      return { rows: found ? [{ ...found }] : [] };
    }
    case 'active-coaches':
      return { rows: activeIds(db, params[0]).map(coach_id => ({ coach_id })) };
    case 'list-athletes': {
      const [isAdminUser, coachId] = params;
      const rows = db.users
        .filter(row => seesAthlete(db, coachId, row, isAdminUser))
        .map(row => ({
          ...row,
          total_assignments: db.assignments.filter(item => item.athlete_id === row.id).length,
          today_status: null
        }));
      return { rows };
    }
    case 'list-templates': {
      const [isAdminUser, coachId] = params;
      const rows = db.templates.filter(row => isAdminUser || row.coach_id === coachId);
      return { rows: rows.map(row => ({ ...row })) };
    }
    case 'load-template': {
      const found = db.templates.find(row => row.id === params[0]);
      return { rows: found ? [{ ...found }] : [] };
    }
    case 'upsert-template': {
      const [id, coachId, name, description, emoji, policy, exercises] = params;
      const parsed = typeof exercises === 'string' ? JSON.parse(exercises) : exercises;
      let row = db.templates.find(item => item.id === id);
      if (!row) {
        row = { id, coach_id: coachId, name, description, emoji, progression_policy: policy, exercises: parsed };
        db.templates.push(row);
      } else {
        Object.assign(row, { name, description, emoji, progression_policy: policy, exercises: parsed });
      }
      return { rows: [{ ...row }] };
    }
    case 'insert-user': {
      const [id, name, email, coachId, enrollmentToken, expiresAt] = params;
      if (db.users.some(row => row.email === email)) {
        throw Object.assign(new Error('duplicate'), { code: '23505' });
      }
      const row = user({
        id, name, email, role: 'ATHLETE', coach_id: coachId,
        enrollment_token: enrollmentToken, token_expires_at: expiresAt,
        allow_own_routines: false, is_active: true
      });
      db.users.push(row);
      return { rows: [{ ...row }] };
    }
    case 'insert-link': {
      const row = {
        id: params[0], coach_id: params[1], athlete_id: params[2],
        assigned_by: params[3], ended_at: null
      };
      db.links.push(row);
      return { rows: [{ ...row }] };
    }
    case 'upsert-assignment': {
      const [id, athleteId, coachId, date, templateId, payload] = params;
      const routine = typeof payload === 'string' ? JSON.parse(payload) : payload;
      let row = db.assignments.find(item => item.athlete_id === athleteId && item.scheduled_date === date);
      if (!row) {
        row = {
          id, athlete_id: athleteId, coach_id: coachId, scheduled_date: date,
          routine_template_id: templateId, routine_payload: routine, status: 'PENDING',
          confirmed_at: null, created_at: new Date().toISOString()
        };
        db.assignments.push(row);
      } else {
        row.routine_payload = routine;
        row.status = 'PENDING';
        row.coach_id = coachId;
        row.confirmed_at = null;
      }
      return { rows: [{ ...row }] };
    }
    case 'list-assignments': {
      const [isAdminUser, coachId, date] = params;
      const rows = db.assignments
        .filter(item => item.scheduled_date === date)
        .filter(item => seesAthlete(db, coachId, db.users.find(row => row.id === item.athlete_id), isAdminUser))
        .map(item => {
          const athlete = db.users.find(row => row.id === item.athlete_id);
          return { ...item, athlete_name: athlete?.name, athlete_email: athlete?.email };
        });
      return { rows };
    }
    case 'set-active': {
      const found = db.users.find(row => row.id === params[1]);
      if (!found) return { rows: [] };
      found.is_active = params[0];
      return { rows: [{ id: found.id, is_active: found.is_active }] };
    }
    case 'end-other-links': {
      const [athleteId, nextCoach] = params;
      const ended = [];
      for (const link of db.links) {
        if (link.athlete_id === athleteId && !link.ended_at && (nextCoach == null || link.coach_id !== nextCoach)) {
          link.ended_at = '2026-11-10T00:00:00.000Z';
          ended.push({ ...link });
        }
      }
      return { rows: ended };
    }
    case 'insert-link-if-absent': {
      const [id, coachId, athleteId, assignedBy] = params;
      if (!coachId) return { rows: [] };
      if (db.links.some(link => link.athlete_id === athleteId && link.coach_id === coachId && !link.ended_at)) {
        return { rows: [] };
      }
      const row = { id, coach_id: coachId, athlete_id: athleteId, assigned_by: assignedBy, ended_at: null };
      db.links.push(row);
      return { rows: [{ ...row }] };
    }
    case 'set-coach': {
      const found = db.users.find(row => row.id === params[0] && row.role === 'ATHLETE');
      if (!found) return { rows: [] };
      found.coach_id = params[1];
      return { rows: [{ id: found.id, coach_id: found.coach_id }] };
    }
    default:
      throw new Error('SQL no simulada: ' + qtag(sql));
  }
}

function createHarness(options = {}) {
  const state = { db: structuredClone(options.seed || seed()), snapshot: null };
  const adminUids = options.adminUids || [];
  async function query(sql, params = []) {
    const text = String(sql).trim();
    if (text === 'BEGIN') {
      state.snapshot = structuredClone(state.db);
      return { rows: [] };
    }
    if (text === 'COMMIT') {
      state.snapshot = null;
      return { rows: [] };
    }
    if (text === 'ROLLBACK') {
      if (state.snapshot) state.db = state.snapshot;
      state.snapshot = null;
      return { rows: [] };
    }
    return dispatch(state.db, text, params);
  }
  const access = createAccessControl({
    query,
    getClient: async () => ({ query, release() {} }),
    isAdmin: actor => !!actor && (actor.role === 'ADMIN' || adminUids.includes(actor.id)),
    adminUids
  });
  return { state, access };
}

const actors = { admin, coachA, coachB, athleteA, solo };

describe('canAccessAthlete', () => {
  const cases = [
    ['admin', 'athA', 'view', 200],
    ['admin', 'athB', 'assign', 200],
    ['admin', 'athA', 'deactivate', 200],
    ['admin', 'athA', 'reassign', 200],
    ['coachA', 'athA', 'view', 200],
    ['coachA', 'athA', 'assign', 200],
    ['coachA', 'athA', 'confirm', 403],
    ['coachA', 'athA', 'deactivate', 403],
    ['coachA', 'athA', 'reassign', 403],
    ['coachA', 'athB', 'view', 403],
    ['coachA', 'athB', 'assign', 403],
    ['coachB', 'athA', 'view', 403],
    ['coachB', 'athA', 'assign', 403],
    ['athleteA', 'athA', 'view', 200],
    ['athleteA', 'athA', 'confirm', 200],
    ['athleteA', 'athA', 'assign', 403],
    ['athleteA', 'athA', 'deactivate', 403],
    ['athleteA', 'athA', 'reassign', 403],
    ['athleteA', 'athB', 'view', 403],
    ['athleteA', 'athB', 'confirm', 403],
    ['solo', 'athA', 'view', 403]
  ];

  for (const [actorKey, athleteId, action, status] of cases) {
    it(`${actorKey} ${action} ${athleteId} → ${status}`, async () => {
      const { access } = createHarness();
      const decision = await access.canAccessAthlete(actors[actorKey], athleteId, action);
      assert.equal(decision.status, status);
      assert.equal(decision.ok, status === 200);
    });
  }

  it('sin sesión no pasa', async () => {
    const { access } = createHarness();
    const decision = await access.canAccessAthlete(null, 'athA', 'view');
    assert.equal(decision.status, 401);
  });

  it('alumno inexistente', async () => {
    const { access } = createHarness();
    const decision = await access.canAccessAthlete(admin, 'missing', 'view');
    assert.equal(decision.status, 404);
  });

  it('un coach ve al alumno legado solo con users.coach_id y al vinculado solo en coach_athletes', async () => {
    const { access } = createHarness();
    assert.equal((await access.canAccessAthlete(coachA, 'legacy', 'view')).status, 200);
    assert.equal((await access.canAccessAthlete(coachB, 'legacy', 'view')).status, 403);
    assert.equal((await access.canAccessAthlete(coachA, 'linked', 'assign')).status, 200);
    assert.equal((await access.canAccessAthlete(coachB, 'linked', 'view')).status, 403);
  });

  it('un alumno marcado en ADMIN_UIDS no se puede desactivar', async () => {
    const { access } = createHarness({ adminUids: ['athA'] });
    const decision = await access.canAccessAthlete(admin, 'athA', 'deactivate');
    assert.equal(decision.status, 400);
    assert.equal(decision.error, 'cannot disable an admin');
  });
});

describe('listados del entrenador', () => {
  it('el coach solo recibe a sus alumnos; el admin, a todos; el alumno, nada', async () => {
    const { access } = createHarness();
    const own = await access.listAthletes(coachA);
    assert.deepEqual(own.athletes.map(row => row.id).sort(), ['athA', 'legacy', 'linked']);
    const all = await access.listAthletes(admin);
    assert.ok(all.athletes.map(row => row.id).includes('athB'));
    assert.equal((await access.listAthletes(athleteA)).status, 403);
    assert.equal((await access.listAthletes(null)).status, 401);
  });

  it('las plantillas de otro coach no salen en el listado ni se pueden pisar', async () => {
    const { state, access } = createHarness();
    const listed = await access.listTemplates(coachA);
    assert.deepEqual(listed.templates.map(row => row.id), ['tplA']);
    assert.equal((await access.listTemplates(admin)).templates.length, 2);
    const denied = await access.saveTemplate(coachA, { id: 'tplB', name: 'Robada', exercises: [] });
    assert.equal(denied.status, 403);
    assert.equal(state.db.templates.find(row => row.id === 'tplB').name, 'Fuerza B');
    const renamed = await access.saveTemplate(admin, { id: 'tplB', name: 'Editada', exercises: [{ id: '1' }] });
    assert.equal(renamed.status, 200);
    assert.equal(state.db.templates.find(row => row.id === 'tplB').coach_id, 'coachB');
    assert.equal(state.db.templates.find(row => row.id === 'tplB').name, 'Editada');
  });
});

describe('asignaciones', () => {
  it('un coach ajeno no escribe; el propio y el admin sí', async () => {
    const { state, access } = createHarness();
    const before = state.db.assignments.length;
    const foreign = await access.assignRoutine(coachB, {
      athleteIds: ['athA'],
      scheduledDate: '2026-05-02',
      routine: { name: 'No' }
    }, { nextAssignmentId: () => 'asg-x' });
    assert.equal(foreign.status, 403);
    assert.equal(state.db.assignments.length, before);

    const own = await access.assignRoutine(coachA, {
      athleteIds: ['athA', 'athA'],
      scheduledDate: '2026-05-02',
      routine: { name: 'Sí' }
    }, { nextAssignmentId: () => 'asg-ok' });
    assert.equal(own.status, 200);
    assert.equal(own.assignments.length, 1);
    assert.equal(state.db.assignments.filter(row => row.scheduled_date === '2026-05-02').length, 1);

    const asAdmin = await access.assignRoutine(admin, {
      athleteIds: ['athB'],
      scheduledDate: '2026-05-02',
      routine: { name: 'Admin' }
    }, { nextAssignmentId: () => 'asg-admin' });
    assert.equal(asAdmin.status, 200);
  });

  it('no se puede asignar la plantilla de otro coach', async () => {
    const { state, access } = createHarness();
    const denied = await access.assignRoutine(coachA, {
      athleteIds: ['athA'],
      scheduledDate: '2026-05-03',
      routine: { name: 'X' },
      routineTemplateId: 'tplB'
    }, { nextAssignmentId: () => 'asg-tpl' });
    assert.equal(denied.status, 403);
    assert.equal(state.db.assignments.some(row => row.scheduled_date === '2026-05-03'), false);
  });

  it('el coach actual ve asignaciones anteriores, el anterior no', async () => {
    const { state, access } = createHarness();
    const moved = await access.reassignAthlete(admin, { athleteId: 'athA', coachId: 'coachB' }, { linkId: 'ca-new' });
    assert.equal(moved.status, 200);
    assert.equal(state.db.users.find(row => row.id === 'athA').coach_id, 'coachB');

    const nextCoach = await access.listAssignments(coachB, '2026-04-01');
    assert.equal(nextCoach.assignments.length, 1);
    assert.equal(nextCoach.assignments[0].coach_id, 'coachA');
    assert.equal(nextCoach.assignments[0].routine_payload.name, 'Vieja');

    const previous = await access.listAssignments(coachA, '2026-04-01');
    assert.deepEqual(previous.assignments, []);
    assert.equal((await access.canAccessAthlete(coachA, 'athA', 'view')).status, 403);
    assert.equal((await access.canAccessAthlete(coachB, 'athA', 'view')).status, 200);
  });

  it('el alumno no lista ni asigna', async () => {
    const { access } = createHarness();
    assert.equal((await access.listAssignments(athleteA, '2026-04-01')).status, 403);
    assert.equal((await access.assignRoutine(athleteA, {
      athleteIds: ['athA'], scheduledDate: '2026-05-04', routine: { name: 'Propia' }
    }, { nextAssignmentId: () => 'nope' })).status, 403);
  });
});

describe('desactivar y reasignar', () => {
  it('solo el admin desactiva a un alumno', async () => {
    const { state, access } = createHarness();
    assert.equal((await access.setUserActive(coachA, { id: 'athA', disabled: true })).status, 403);
    assert.equal(state.db.users.find(row => row.id === 'athA').is_active, true);
    assert.equal((await access.setUserActive(athleteA, { id: 'athA', disabled: true })).status, 403);
    assert.equal(state.db.users.find(row => row.id === 'athA').is_active, true);
    assert.equal((await access.setUserActive(coachA, { id: 'coachB', disabled: true })).status, 403);

    const done = await access.setUserActive(admin, { id: 'athA', disabled: true });
    assert.equal(done.status, 200);
    assert.equal(done.disabled, true);
    assert.equal(state.db.users.find(row => row.id === 'athA').is_active, false);

    const back = await access.setUserActive(admin, { id: 'athA', disabled: false });
    assert.equal(back.disabled, false);
    assert.equal(state.db.users.find(row => row.id === 'athA').is_active, true);
  });

  it('ADMIN_UIDS no se desactiva, ni aunque el admin lo pida', async () => {
    const { state, access } = createHarness({ adminUids: ['coachA'] });
    const decision = await access.setUserActive(admin, { id: 'coachA', disabled: true });
    assert.equal(decision.status, 400);
    assert.equal(state.db.users.find(row => row.id === 'coachA').is_active, true);
  });

  it('un coach no reasigna; el admin sí, y puede dejar al alumno sin entrenador', async () => {
    const { state, access } = createHarness();
    const denied = await access.reassignAthlete(coachA, { athleteId: 'athB', coachId: 'coachA' }, { linkId: 'x' });
    assert.equal(denied.status, 403);
    assert.equal(state.db.users.find(row => row.id === 'athB').coach_id, 'coachB');

    const cleared = await access.reassignAthlete(admin, { athleteId: 'athB', coachId: null }, { linkId: 'unused' });
    assert.equal(cleared.status, 200);
    assert.equal(cleared.coachId, null);
    assert.equal(state.db.users.find(row => row.id === 'athB').coach_id, null);
    assert.equal(state.db.links.some(link => link.athlete_id === 'athB' && !link.ended_at), false);
    assert.equal(await access.canUseOwnRoutines(state.db.users.find(row => row.id === 'athB')), true);
  });

  it('no se reasigna a otro alumno', async () => {
    const { access } = createHarness();
    const decision = await access.reassignAthlete(admin, { athleteId: 'athA', coachId: 'athB' }, { linkId: 'bad' });
    assert.equal(decision.status, 400);
  });
});

describe('alta de alumnos', () => {
  it('el coach queda como entrenador aunque mande el id de otro', async () => {
    const { state, access } = createHarness();
    const created = await access.createAthlete(coachA, {
      name: 'Nuevo', email: 'Nuevo@Gym.test', coachId: 'coachB'
    }, {
      athleteId: 'athNew', linkId: 'caNew', enrollmentToken: 'tok', expiresAt: '2026-12-01T00:00:00.000Z'
    });
    assert.equal(created.status, 201);
    assert.equal(created.athlete.coach_id, 'coachA');
    assert.equal(created.athlete.allow_own_routines, false);
    assert.equal(created.athlete.email, 'nuevo@gym.test');
    const link = state.db.links.find(row => row.athlete_id === 'athNew' && !row.ended_at);
    assert.equal(link.coach_id, 'coachA');
    assert.equal((await access.canAccessAthlete(coachB, 'athNew', 'view')).status, 403);
    assert.equal((await access.canAccessAthlete(coachA, 'athNew', 'view')).status, 200);
  });

  it('el admin puede dar de alta el alumno a nombre de un coach', async () => {
    const { access } = createHarness();
    const created = await access.createAthlete(admin, {
      name: 'De Bea', email: 'bea.athlete@gym.test', coachId: 'coachB'
    }, {
      athleteId: 'athBea', linkId: 'caBea', enrollmentToken: 'tok2', expiresAt: '2026-12-01T00:00:00.000Z'
    });
    assert.equal(created.athlete.coach_id, 'coachB');
    assert.equal((await access.listAthletes(coachB)).athletes.some(row => row.id === 'athBea'), true);
    assert.equal((await access.listAthletes(coachA)).athletes.some(row => row.id === 'athBea'), false);
  });

  it('el correo repetido no deja un alumno a medias', async () => {
    const { state, access } = createHarness();
    const before = state.db.users.length;
    const dup = await access.createAthlete(coachA, {
      name: 'Leo 2', email: 'atha@gym.test'
    }, {
      athleteId: 'athDup', linkId: 'caDup', enrollmentToken: 'tok3', expiresAt: '2026-12-01T00:00:00.000Z'
    });
    assert.equal(dup.status, 409);
    assert.equal(state.db.users.length, before);
    assert.equal(state.db.links.some(row => row.athlete_id === 'athDup'), false);
  });

  it('un alumno no puede dar de alta a otro', async () => {
    const { access } = createHarness();
    const decision = await access.createAthlete(athleteA, { name: 'X', email: 'x@gym.test' }, {
      athleteId: 'z', linkId: 'z', enrollmentToken: 'z', expiresAt: '2026-12-01'
    });
    assert.equal(decision.status, 403);
  });
});

describe('allowOwnRoutines', () => {
  it('apagado con entrenador; el tracker personal, un coach y el flag encendido sí pueden', async () => {
    const { access, state } = createHarness();
    assert.equal(await access.canUseOwnRoutines(athleteA), false);
    assert.equal(await access.canUseOwnRoutines(solo), true);
    assert.equal(await access.canUseOwnRoutines(coachA), true);
    assert.equal(await access.canUseOwnRoutines(admin), true);
    const flagged = { ...athleteA, allow_own_routines: true };
    state.db.users.find(row => row.id === 'athA').allow_own_routines = true;
    assert.equal(await access.canUseOwnRoutines(flagged), true);
  });
});

describe('historial de un alumno', () => {
  it('el coach propio puede abrir la ficha; el ajeno y el alumno, no', async () => {
    const { access } = createHarness();
    assert.equal((await access.authorizeUserRecord(coachA, 'athA')).status, 200);
    assert.equal((await access.authorizeUserRecord(coachB, 'athA')).status, 403);
    assert.equal((await access.authorizeUserRecord(athleteA, 'athB')).status, 403);
    assert.equal((await access.authorizeUserRecord(athleteA, 'athA')).status, 200);
    assert.equal((await access.authorizeUserRecord(admin, 'coachA')).status, 200);
    assert.equal((await access.authorizeUserRecord(coachA, 'coachB')).status, 403);
  });
});

describe('portal y SQL', () => {
  it('el portal se abre para un coach que no es admin, y también para un admin', () => {
    assert.equal(canOpenCoachPortal({ role: 'COACH', admin: false }), true);
    assert.equal(canOpenCoachPortal({ role: 'ATHLETE', admin: false }), false);
    assert.equal(canOpenCoachPortal({ role: 'ATHLETE', admin: true }), true);
    assert.equal(canOpenCoachPortal({ role: 'ADMIN', admin: true }), true);
    assert.equal(canOpenCoachPortal(null), false);
  });

  it('el listado de asignaciones sigue al alumno, no al coach que creó la fila', () => {
    assert.match(SQL.listAthletes, /u\.role = 'ATHLETE'/);
    assert.match(SQL.listAthletes, /u\.coach_id = \$2/);
    assert.match(SQL.listAthletes, /coach_athletes/);
    assert.match(SQL.listAthletes, /ca\.ended_at IS NULL/);
    assert.match(SQL.listAssignments, /da\.scheduled_date = \$3/);
    assert.match(SQL.listAssignments, /u\.coach_id = \$2/);
    assert.match(SQL.listAssignments, /coach_athletes/);
    assert.doesNotMatch(SQL.listAssignments, /da\.coach_id\s*=/);
    assert.match(SQL.listTemplates, /coach_id = \$2/);
  });
});

describe('cableado de las rutas', () => {
  const server = fs.readFileSync(new URL('./server.js', import.meta.url), 'utf8');
  const app = fs.readFileSync(new URL('../frontend/src/App.jsx', import.meta.url), 'utf8');
  const settings = fs.readFileSync(new URL('../frontend/src/views/Settings.jsx', import.meta.url), 'utf8');

  function routeBody(name) {
    const token = `'${name}':`;
    const start = server.indexOf(token);
    assert.notEqual(start, -1, name);
    const rest = server.slice(start + token.length);
    const next = rest.search(/\n  '(?:GET|POST|PUT|DELETE) /);
    return rest.slice(0, next === -1 ? rest.length : next);
  }

  const wired = {
    'GET /api/admin/athletes': /listAthletes/,
    'POST /api/admin/athletes': /createAthlete/,
    'POST /api/admin/athletes/reassign': /reassignAthlete/,
    'GET /api/coach/templates': /listTemplates/,
    'POST /api/coach/templates': /saveTemplate/,
    'POST /api/coach/assign-routine': /assignRoutine/,
    'GET /api/coach/assignments': /listAssignments/,
    'GET /api/athlete/routine/today': /canAccessAthlete\([\s\S]*'view'/,
    'POST /api/athlete/routine/confirm': /canAccessAthlete\([\s\S]*'confirm'/,
    'POST /api/admin/user/disable': /setUserActive/,
    'GET /api/admin/user': /authorizeUserRecord/,
    'GET /api/me': /canUseOwnRoutines|toPublicUser/
  };

  for (const [route, pattern] of Object.entries(wired)) {
    it(route, () => {
      assert.match(routeBody(route), pattern);
    });
  }

  it('el directorio global sigue siendo solo de admin y no queda el filtro viejo', () => {
    assert.match(routeBody('GET /api/admin/users'), /requireAdmin/);
    assert.doesNotMatch(server, /requireCoachOrAdmin/);
    assert.match(app, /canOpenCoachPortal\(user\)/);
    assert.match(settings, /canOpenCoachPortal\(user\)/);
    assert.match(server, /from '\.\/access\.js'/);
  });
});
