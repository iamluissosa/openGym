/* opengym-api — passkey (WebAuthn) auth + PostgreSQL/Supabase storage
   Production-ready serverless and standalone compatible backend. */
import http from 'node:http';
import crypto from 'node:crypto';
import {
  generateRegistrationOptions, verifyRegistrationResponse,
  generateAuthenticationOptions, verifyAuthenticationResponse
} from '@simplewebauthn/server';
import webpush from 'web-push';
import { query, pool } from './db.js';

const PORT = +(process.env.PORT || 3000);
const RP_ID = process.env.RP_ID || 'localhost';
const ORIGIN = process.env.ORIGIN || 'http://localhost:8080';
const RP_NAME = process.env.RP_NAME || 'balackGym';
const ADMIN_UIDS = (process.env.ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
const INVITE_ONLY = /^(1|true|yes|on)$/i.test(process.env.INVITE_ONLY || '');
const SESSION_DAYS = Math.max(1, +(process.env.SESSION_DAYS || 90) || 90);
const MAX_BODY = 5 * 1024 * 1024;
const SECURE = /^https:/i.test(ORIGIN) ? ' Secure;' : '';

/* ---------- secret & HMAC ---------- */
const SECRET = process.env.SESSION_SECRET || process.env.SECRET || 'opengym-secret-fallback-key-32charsmin';

/* ---------- push notifications (Web Push / VAPID) ---------- */
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || (SECURE ? ORIGIN : 'mailto:admin@localhost');

let vapid = {
  publicKey: VAPID_PUBLIC_KEY,
  privateKey: VAPID_PRIVATE_KEY
};

if (!vapid.publicKey || !vapid.privateKey) {
  // Genera llaves en memoria si no están configuradas en variables de entorno
  vapid = webpush.generateVAPIDKeys();
}

try {
  webpush.setVapidDetails(VAPID_SUBJECT, vapid.publicKey, vapid.privateKey);
} catch (e) {
  console.warn('[VAPID Warning]:', e.message);
}

async function sendPush(userId, payload) {
  try {
    const subsRes = await query('SELECT endpoint, keys FROM push_subscriptions WHERE user_id = $1', [userId]);
    if (!subsRes.rows.length) return;
    const body = JSON.stringify(payload);
    await Promise.all(subsRes.rows.map(async sub => {
      try {
        const keys = typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys;
        await webpush.sendNotification({ endpoint: sub.endpoint, keys }, body, { urgency: 'high' });
      } catch (e) {
        console.error('push send failed', userId, e.statusCode, e.body || e.message);
        if (e.statusCode === 404 || e.statusCode === 410) {
          await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]).catch(() => {});
        }
      }
    }));
  } catch (e) {
    console.error('Error in sendPush:', e.message);
  }
}

/* ---------- rest timers (in-memory) ---------- */
const restTimers = new Map();
function scheduleRestTimer(userId, sec) {
  const t = restTimers.get(userId);
  if (t) clearTimeout(t);
  restTimers.set(userId, setTimeout(() => {
    restTimers.delete(userId);
    sendPush(userId, { title: 'Rest over 💪', body: 'Time for your next set.', tag: 'rest-timer' });
  }, sec * 1000));
}
function cancelRestTimer(userId) {
  const t = restTimers.get(userId);
  if (t) { clearTimeout(t); restTimers.delete(userId); }
}

/* ---------- workout reminders helper ---------- */
function effectiveRoutineId(S, iso) {
  const ov = S?.dayPlan?.[iso];
  if (ov === 'rest') return null;
  if (ov && S.routines?.some(r => r.id === ov)) return ov;
  const wd = new Date(iso + 'T12:00:00').getDay();
  return S?.week?.[wd] || null;
}

function userNow(tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    }).formatToParts(new Date());
    const g = t => parts.find(p => p.type === t)?.value;
    return { date: `${g('year')}-${g('month')}-${g('day')}`, hhmm: `${g('hour')}:${g('minute')}` };
  } catch { return null; }
}

async function checkReminders() {
  try {
    const res = await query(`
      SELECT u.id, u.name, us.state
      FROM users u
      JOIN push_subscriptions ps ON ps.user_id = u.id
      JOIN user_states us ON us.user_id = u.id
      WHERE u.is_active = true
      GROUP BY u.id, u.name, us.state;
    `);

    for (const row of res.rows) {
      const S = row.state;
      if (!S?.reminder?.on) continue;
      const now = userNow(S.reminder.tz || 'UTC');
      if (!now || S.reminder.time !== now.hhmm) continue;
      if ((S.workouts || []).some(w => w.d === now.date)) continue;
      const rid = effectiveRoutineId(S, now.date);
      if (!rid) continue;
      const routine = (S.routines || []).find(r => r.id === rid);
      await sendPush(row.id, {
        title: routine ? `${routine.emoji || '🏋️'} ${routine.name} today` : 'Workout planned today',
        body: "It's on your plan — let's go 💪",
        tag: 'day-reminder'
      });
    }
  } catch (err) {
    // Modo silencioso para timer de fondo
  }
}

if (!process.env.VERCEL) {
  setInterval(checkReminders, 10000).unref();
}

/* ---------- sessions (signed cookie) ---------- */
function sign(payload) {
  const mac = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return payload + '.' + mac;
}

function verifySig(token) {
  const i = token.lastIndexOf('.');
  if (i < 0) return null;
  const payload = token.slice(0, i), mac = token.slice(i + 1);
  const expect = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expect))) return null;
  } catch { return null; }
  return payload;
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(cookieHeader.split(';').map(c => {
    const i = c.indexOf('=');
    return i < 0 ? ['', ''] : [c.slice(0, i).trim(), c.slice(i + 1).trim()];
  }));
}

const isAdmin = user => !!user && (user.role === 'ADMIN' || ADMIN_UIDS.includes(user.id));

function makeSession(user) {
  const exp = Date.now() + SESSION_DAYS * 86400000;
  return sign(user.id + ':' + exp + ':' + (user.session_version || 0));
}

async function readSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const tok = cookies.gymsid;
  if (!tok) return null;
  const payload = verifySig(tok);
  if (!payload) return null;
  const [uid, exp, ver] = payload.split(':');
  if (!uid || +exp < Date.now()) return null;

  try {
    const res = await query('SELECT id, name, email, role, is_active, session_version FROM users WHERE id = $1', [uid]);
    if (!res.rows.length) return null;
    const user = res.rows[0];
    if (user.is_active === false) return null;
    const claimed = ver === undefined ? 0 : Number(ver);
    if (!Number.isInteger(claimed) || claimed !== (user.session_version || 0)) return null;
    return user;
  } catch (err) {
    console.error('[readSession DB error]:', err.message);
    return null;
  }
}

async function requireAdmin(req, res) {
  const user = await readSession(req);
  if (!user) { json(res, 401, { error: 'not signed in' }); return null; }
  if (!isAdmin(user)) { json(res, 403, { error: 'forbidden' }); return null; }
  return user;
}

async function requireCoachOrAdmin(req, res) {
  const user = await readSession(req);
  if (!user) { json(res, 401, { error: 'not signed in' }); return null; }
  if (isAdmin(user) || user.role === 'COACH') return user;
  json(res, 403, { error: 'forbidden' });
  return null;
}

function getOrigin(req) {
  if (process.env.ORIGIN && !process.env.ORIGIN.includes('localhost')) {
    return process.env.ORIGIN.replace(/\/$/, '');
  }
  const originHeader = req?.headers?.origin;
  if (originHeader) return originHeader.replace(/\/$/, '');
  const proto = req?.headers?.['x-forwarded-proto'] || (req?.socket?.encrypted ? 'https' : 'http');
  const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host;
  if (host) return `${proto}://${host}`;
  return process.env.ORIGIN || 'http://localhost:8080';
}

function getRpId(req) {
  if (process.env.RP_ID && process.env.RP_ID !== 'localhost') {
    return process.env.RP_ID;
  }
  const origin = getOrigin(req);
  try {
    const url = new URL(origin);
    return url.hostname;
  } catch {
    const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host || '';
    return host.split(':')[0] || 'localhost';
  }
}

function sessionCookie(user, req) {
  const origin = req ? getOrigin(req) : ORIGIN;
  const isSecure = /^https:/i.test(origin) ? ' Secure;' : '';
  return `gymsid=${makeSession(user)}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly;${isSecure} SameSite=Lax`;
}

function clearCookie(req) {
  const origin = req ? getOrigin(req) : ORIGIN;
  const isSecure = /^https:/i.test(origin) ? ' Secure;' : '';
  return `gymsid=; Path=/; Max-Age=0; HttpOnly;${isSecure} SameSite=Lax`;
}

/* ---------- challenge store (in-memory, 5 min TTL) ---------- */
const challenges = new Map();
function putChallenge(data) {
  const cid = crypto.randomBytes(16).toString('base64url');
  challenges.set(cid, { ...data, exp: Date.now() + 5 * 60000 });
  return cid;
}
function takeChallenge(cid) {
  const c = challenges.get(cid);
  challenges.delete(cid);
  if (!c || c.exp < Date.now()) return null;
  return c;
}
setInterval(() => { for (const [k, v] of challenges) if (v.exp < Date.now()) challenges.delete(k); }, 60000).unref();

/* ---------- helpers ---------- */
function json(res, code, obj, extraHeaders) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...(extraHeaders || {}) });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', d => {
      size += d.length;
      if (size > MAX_BODY) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(d);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch { reject(new Error('bad json')); }
    });
    req.on('error', reject);
  });
}
const b64uToBuf = s => Buffer.from(s, 'base64url');

/* ---------- live presence (in-memory) ---------- */
const presence = new Map();
const PRESENCE_TTL = 70000;
function livePresence(uid) {
  const p = presence.get(uid);
  if (!p) return null;
  if (Date.now() - p.updatedAt > PRESENCE_TTL) { presence.delete(uid); return null; }
  return p;
}
setInterval(() => { for (const [k, v] of presence) if (Date.now() - v.updatedAt > PRESENCE_TTL) presence.delete(k); }, 30000).unref();

/* ---------- routes ---------- */
const routes = {
  'GET /api/health': async (req, res) => {
    try {
      const countRes = await query('SELECT COUNT(*)::int as count FROM users');
      json(res, 200, { ok: true, users: countRes.rows[0]?.count || 0 });
    } catch (e) {
      json(res, 200, { ok: false, error: e.message, users: 0 });
    }
  },

  'GET /api/config': async (req, res) => json(res, 200, { invite_only: INVITE_ONLY }),

  'GET /api/me': async (req, res) => {
    const user = await readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    json(res, 200, { user: { id: user.id, name: user.name, role: user.role, admin: isAdmin(user) } });
  },

  'POST /api/register/options': async (req, res) => {
    const body = await readBody(req);
    let name = String(body.name || '').trim().slice(0, 40);
    let uid = null;
    const enrollmentToken = String(body.enrollmentToken || '').trim();

    if (enrollmentToken) {
      try {
        const r = await query('SELECT id, name, email FROM users WHERE enrollment_token = $1 AND token_expires_at > NOW()', [enrollmentToken]);
        if (!r.rows.length) return json(res, 400, { error: 'Enlace de activación inválido o expirado' });
        uid = r.rows[0].id;
        name = name || r.rows[0].name;
      } catch (e) {
        return json(res, 500, { error: 'Error al validar token de enrolamiento' });
      }
    }

    if (!name) return json(res, 400, { error: 'name required' });
    const code = String(body.code || '').trim().toUpperCase();
    if (INVITE_ONLY && !enrollmentToken) {
      try {
        const invRes = await query('SELECT code FROM invite_codes WHERE code = $1 AND used_by IS NULL', [code]);
        if (!invRes.rows.length) {
          return json(res, 403, { error: 'a valid invite code is required' });
        }
      } catch (e) {
        return json(res, 500, { error: 'Error al verificar código de invitación' });
      }
    }

    if (!uid) uid = crypto.randomBytes(12).toString('base64url');
    const activeRpId = getRpId(req);
    const activeOrigin = getOrigin(req);
    const options = await generateRegistrationOptions({
      rpName: RP_NAME, rpID: activeRpId,
      userID: Buffer.from(uid), userName: name, userDisplayName: name,
      attestationType: 'none',
      authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
      excludeCredentials: []
    });
    const cid = putChallenge({ challenge: options.challenge, name, uid, code, enrollmentToken, rpId: activeRpId, origin: activeOrigin });
    json(res, 200, { cid, options });
  },

  'POST /api/register/verify': async (req, res) => {
    const body = await readBody(req);
    const c = takeChallenge(body.cid);
    if (!c || !c.uid) return json(res, 400, { error: 'challenge expired — try again' });
    const activeRpId = c.rpId || getRpId(req);
    const activeOrigin = c.origin || getOrigin(req);
    const expectedOrigins = Array.from(new Set([
      activeOrigin,
      `https://${activeRpId}`,
      `http://${activeRpId}`,
      ORIGIN
    ])).filter(Boolean);

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body.credential,
        expectedChallenge: c.challenge,
        expectedOrigin: expectedOrigins,
        expectedRPID: activeRpId,
        requireUserVerification: false
      });
    } catch (e) { return json(res, 400, { error: 'verification failed: ' + e.message }); }
    if (!verification.verified) return json(res, 400, { error: 'not verified' });
    const { credential } = verification.registrationInfo;

    try {
      const existing = await query('SELECT id FROM passkey_credentials WHERE id = $1', [credential.id]);
      if (existing.rows.length) return json(res, 409, { error: 'credential already registered' });
    } catch (e) {
      console.error('[DB Error] al verificar credencial existente:', e.message);
      return json(res, 500, { error: 'Error en base de datos: ' + e.message });
    }

    if (INVITE_ONLY && !c.enrollmentToken) {
      try {
        const invRes = await query('SELECT code FROM invite_codes WHERE code = $1 AND used_by IS NULL', [c.code]);
        if (!invRes.rows.length) {
          return json(res, 403, { error: 'invite code is no longer valid — ask for a new one' });
        }
        await query('UPDATE invite_codes SET used_by = $1, used_at = NOW() WHERE code = $2', [c.uid, c.code]);
      } catch (e) {
        return json(res, 500, { error: 'Error al consumir código de invitación' });
      }
    }

    let user;
    try {
      if (c.enrollmentToken) {
        const uRes = await query(`
          UPDATE users
          SET enrollment_token = NULL, token_expires_at = NULL, is_active = true
          WHERE id = $1
          RETURNING id, name, email, role, is_active, session_version;
        `, [c.uid]);
        user = uRes.rows[0];
      } else {
        const uRes = await query(`
          INSERT INTO users (id, name, role, is_active, session_version, created_at)
          VALUES ($1, $2, 'ATHLETE', true, 0, NOW())
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
          RETURNING id, name, email, role, is_active, session_version;
        `, [c.uid, c.name]);
        user = uRes.rows[0];
      }

      await query(`
        INSERT INTO passkey_credentials (id, user_id, public_key, counter, transports)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET counter = EXCLUDED.counter;
      `, [credential.id, user.id, Buffer.from(credential.publicKey).toString('base64url'), credential.counter || 0, body.credential?.response?.transports || []]);
    } catch (e) {
      console.error('Error saving user/credential in DB:', e.message);
      return json(res, 500, { error: 'Error al registrar credencial en base de datos: ' + e.message });
    }

    json(res, 200, { user: { id: user.id, name: user.name, role: user.role, admin: isAdmin(user) } }, { 'Set-Cookie': sessionCookie(user, req) });
  },

  'POST /api/login/options': async (req, res) => {
    const activeRpId = getRpId(req);
    const activeOrigin = getOrigin(req);
    const options = await generateAuthenticationOptions({
      rpID: activeRpId, userVerification: 'preferred', allowCredentials: []
    });
    const cid = putChallenge({ challenge: options.challenge, rpId: activeRpId, origin: activeOrigin });
    json(res, 200, { cid, options });
  },

  'POST /api/login/verify': async (req, res) => {
    const body = await readBody(req);
    const c = takeChallenge(body.cid);
    if (!c) return json(res, 400, { error: 'challenge expired — try again' });
    if (!body.credential?.id) return json(res, 400, { error: 'credential id required' });

    let cred;
    try {
      const resCred = await query(`
        SELECT c.id, c.user_id, c.public_key, c.counter, c.transports,
               u.id as uid, u.name, u.email, u.role, u.is_active, u.session_version
        FROM passkey_credentials c
        JOIN users u ON u.id = c.user_id
        WHERE c.id = $1;
      `, [body.credential.id]);
      if (!resCred.rows.length) {
        return json(res, 404, { error: 'unknown passkey — create a profile first' });
      }
      cred = resCred.rows[0];
    } catch (e) {
      console.error('POST /api/login/verify DB error:', e.message);
      return json(res, 500, { error: 'Error al buscar credencial' });
    }

    if (!cred.is_active) {
      return json(res, 403, { error: 'this account has been disabled' });
    }

    const activeRpId = c.rpId || getRpId(req);
    const activeOrigin = c.origin || getOrigin(req);
    const expectedOrigins = Array.from(new Set([
      activeOrigin,
      `https://${activeRpId}`,
      `http://${activeRpId}`,
      ORIGIN
    ])).filter(Boolean);

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body.credential,
        expectedChallenge: c.challenge,
        expectedOrigin: expectedOrigins,
        expectedRPID: activeRpId,
        requireUserVerification: false,
        credential: {
          id: cred.id,
          publicKey: b64uToBuf(cred.public_key),
          counter: Number(cred.counter),
          transports: cred.transports || []
        }
      });
    } catch (e) { return json(res, 400, { error: 'verification failed: ' + e.message }); }
    if (!verification.verified) return json(res, 400, { error: 'not verified' });

    try {
      await query('UPDATE passkey_credentials SET counter = $1 WHERE id = $2', [verification.authenticationInfo.newCounter, cred.id]);
    } catch (e) {
      console.warn('Could not update passkey counter:', e.message);
    }

    const user = {
      id: cred.uid,
      name: cred.name,
      email: cred.email,
      role: cred.role,
      is_active: cred.is_active,
      session_version: cred.session_version
    };

    json(res, 200, { user: { id: user.id, name: user.name, role: user.role, admin: isAdmin(user) } }, { 'Set-Cookie': sessionCookie(user, req) });
  },

  'POST /api/logout': async (req, res) => json(res, 200, { ok: true }, { 'Set-Cookie': clearCookie(req) }),

  'POST /api/logout/all': async (req, res) => {
    const user = await readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    try {
      await query('UPDATE users SET session_version = session_version + 1 WHERE id = $1', [user.id]);
      json(res, 200, { ok: true }, { 'Set-Cookie': clearCookie(req) });
    } catch (e) {
      console.error('POST /api/logout/all error:', e.message);
      json(res, 500, { error: 'Error al revocar sesiones' });
    }
  },

  'GET /api/data': async (req, res) => {
    const user = await readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    try {
      const result = await query('SELECT state FROM user_states WHERE user_id = $1', [user.id]);
      if (result.rows.length && result.rows[0].state) {
        json(res, 200, { state: result.rows[0].state });
      } else {
        json(res, 200, { state: null });
      }
    } catch (e) {
      console.error('GET /api/data error:', e.message);
      json(res, 500, { error: 'Error al obtener estado' });
    }
  },

  'PUT /api/data': async (req, res) => {
    const user = await readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    const body = await readBody(req);
    if (!body.state || typeof body.state !== 'object') return json(res, 400, { error: 'state required' });
    delete body.state.active;
    const ts = body.state._ts || Date.now();
    try {
      await query(`
        INSERT INTO user_states (user_id, state, updated_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) DO UPDATE SET state = EXCLUDED.state, updated_at = EXCLUDED.updated_at;
      `, [user.id, JSON.stringify(body.state), ts]);
      json(res, 200, { ok: true, ts });
    } catch (e) {
      console.error('PUT /api/data error:', e.message);
      json(res, 500, { error: 'Error al guardar estado' });
    }
  },

  'GET /api/push/public-key': async (req, res) => json(res, 200, { key: vapid.publicKey }),

  'POST /api/push/subscribe': async (req, res) => {
    const user = await readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    const body = await readBody(req);
    const sub = body.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return json(res, 400, { error: 'invalid subscription' });
    try {
      await query(`
        INSERT INTO push_subscriptions (endpoint, user_id, keys, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, keys = EXCLUDED.keys;
      `, [sub.endpoint, user.id, JSON.stringify(sub.keys)]);
      json(res, 200, { ok: true });
    } catch (e) {
      console.error('POST /api/push/subscribe error:', e.message);
      json(res, 500, { error: 'Error al registrar suscripción' });
    }
  },

  'POST /api/push/unsubscribe': async (req, res) => {
    const user = await readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    const body = await readBody(req);
    try {
      await query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [user.id, body.endpoint]);
      json(res, 200, { ok: true });
    } catch (e) {
      console.error('POST /api/push/unsubscribe error:', e.message);
      json(res, 500, { error: 'Error al cancelar suscripción' });
    }
  },

  'POST /api/push/test': async (req, res) => {
    const user = await readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    await sendPush(user.id, { title: 'balackGym', body: 'Test notification ✅ — this is what alerts look like.', tag: 'test' });
    json(res, 200, { ok: true });
  },

  'POST /api/push/rest-timer': async (req, res) => {
    const user = await readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    const body = await readBody(req);
    const sec = Math.max(1, Math.min(3600, Math.round(+body.seconds || 0)));
    if (!sec) return json(res, 400, { error: 'seconds required' });
    scheduleRestTimer(user.id, sec);
    json(res, 200, { ok: true });
  },

  'POST /api/push/rest-timer/cancel': async (req, res) => {
    const user = await readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    cancelRestTimer(user.id);
    json(res, 200, { ok: true });
  },

  'POST /api/activity': async (req, res) => {
    const user = await readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    const body = await readBody(req);
    if (body.active) {
      presence.set(user.id, {
        name: String(body.name || '').slice(0, 60),
        exIdx: +body.exIdx || 0, exTotal: +body.exTotal || 0,
        setsDone: +body.setsDone || 0, setsTotal: +body.setsTotal || 0,
        startedAt: +body.startedAt || Date.now(),
        updatedAt: Date.now()
      });
    } else presence.delete(user.id);
    json(res, 200, { ok: true });
  },

  /* ---------- admin dashboard ---------- */
  'GET /api/admin/users': async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
      const resUsers = await query(`
        SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
               ic.code as invited_by,
               us.state,
               EXISTS(SELECT 1 FROM push_subscriptions ps WHERE ps.user_id = u.id) as has_push
        FROM users u
        LEFT JOIN user_states us ON us.user_id = u.id
        LEFT JOIN invite_codes ic ON ic.used_by = u.id
        ORDER BY u.created_at DESC;
      `);

      const users = resUsers.rows.map(u => {
        const S = u.state || {};
        const workouts = S.workouts || [];
        const last = workouts[workouts.length - 1];
        return {
          id: u.id,
          name: u.name,
          created: u.created_at ? new Date(u.created_at).toISOString() : null,
          disabled: !u.is_active,
          admin: isAdmin(u),
          invitedBy: u.invited_by || null,
          workouts: workouts.length,
          lastWorkout: last ? last.d : null,
          lastSync: S._ts || null,
          hasPush: !!u.has_push,
          live: livePresence(u.id)
        };
      });

      json(res, 200, { users, invite_only: INVITE_ONLY, now: Date.now() });
    } catch (e) {
      console.error('GET /api/admin/users error:', e.message);
      json(res, 500, { error: 'Error al obtener usuarios' });
    }
  },

  'GET /api/admin/user': async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const id = new URL(req.url, 'http://x').searchParams.get('id');
    try {
      const resUser = await query(`
        SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
               ic.code as invited_by,
               us.state
        FROM users u
        LEFT JOIN user_states us ON us.user_id = u.id
        LEFT JOIN invite_codes ic ON ic.used_by = u.id
        WHERE u.id = $1;
      `, [id]);
      if (!resUser.rows.length) return json(res, 404, { error: 'no such user' });
      const u = resUser.rows[0];
      const S = u.state || {};
      json(res, 200, {
        user: {
          id: u.id,
          name: u.name,
          created: u.created_at ? new Date(u.created_at).toISOString() : null,
          disabled: !u.is_active,
          admin: isAdmin(u),
          invitedBy: u.invited_by || null
        },
        unit: S.unit || 'kg',
        lastSync: S._ts || null,
        routines: (S.routines || []).map(r => ({ id: r.id, name: r.name, emoji: r.emoji, count: (r.ex || []).length })),
        bodyweight: S.bodyweight || [],
        workouts: (S.workouts || []).slice().reverse()
      });
    } catch (e) {
      console.error('GET /api/admin/user error:', e.message);
      json(res, 500, { error: 'Error al obtener detalle de usuario' });
    }
  },

  'POST /api/admin/user/disable': async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const body = await readBody(req);
    if (ADMIN_UIDS.includes(body.id)) return json(res, 400, { error: 'cannot disable an admin' });
    try {
      const r = await query('UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, is_active', [!body.disabled, body.id]);
      if (!r.rows.length) return json(res, 404, { error: 'no such user' });
      if (body.disabled) presence.delete(body.id);
      json(res, 200, { ok: true, id: body.id, disabled: !!body.disabled });
    } catch (e) {
      console.error('POST /api/admin/user/disable error:', e.message);
      json(res, 500, { error: 'Error al cambiar estado de usuario' });
    }
  },

  'GET /api/admin/invites': async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    try {
      const resInv = await query(`
        SELECT ic.code, ic.note, ic.created_by, ic.used_by, ic.created_at, ic.used_at, u.name as "usedByName"
        FROM invite_codes ic
        LEFT JOIN users u ON u.id = ic.used_by
        ORDER BY ic.created_at DESC;
      `);
      json(res, 200, { invites: resInv.rows, invite_only: INVITE_ONLY });
    } catch (e) {
      console.error('GET /api/admin/invites error:', e.message);
      json(res, 500, { error: 'Error al obtener invitaciones' });
    }
  },

  'POST /api/admin/invites/new': async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const body = await readBody(req);
    const note = String(body.note || '').slice(0, 100);
    const code = crypto.randomBytes(8).toString('hex').toUpperCase();
    try {
      const r = await query(`
        INSERT INTO invite_codes (code, note, created_by, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING code, note, created_by, created_at;
      `, [code, note, admin.id]);
      json(res, 200, { invite: r.rows[0] });
    } catch (e) {
      console.error('POST /api/admin/invites/new error:', e.message);
      json(res, 500, { error: 'Error al crear invitación' });
    }
  },

  'POST /api/admin/invites/revoke': async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const body = await readBody(req);
    const code = String(body.code || '').toUpperCase();
    try {
      const check = await query('SELECT used_by FROM invite_codes WHERE code = $1', [code]);
      if (!check.rows.length) return json(res, 404, { error: 'no such code' });
      if (check.rows[0].used_by) return json(res, 400, { error: 'already used — cannot revoke' });
      await query('DELETE FROM invite_codes WHERE code = $1', [code]);
      json(res, 200, { ok: true });
    } catch (e) {
      console.error('POST /api/admin/invites/revoke error:', e.message);
      json(res, 500, { error: 'Error al revocar invitación' });
    }
  },

  /* ---------- coach / athletes management & prescription (Phase 3) ---------- */
  'GET /api/admin/athletes': async (req, res) => {
    const caller = await requireCoachOrAdmin(req, res);
    if (!caller) return;
    try {
      const resAthletes = await query(`
        SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
               (SELECT COUNT(*)::int FROM daily_assignments da WHERE da.athlete_id = u.id) as total_assignments,
               (SELECT status FROM daily_assignments da WHERE da.athlete_id = u.id AND da.scheduled_date = CURRENT_DATE) as today_status
        FROM users u
        WHERE u.role = 'ATHLETE'
        ORDER BY u.created_at DESC;
      `);
      json(res, 200, { athletes: resAthletes.rows });
    } catch (err) {
      console.error('GET /api/admin/athletes error:', err);
      json(res, 500, { error: 'Error al consultar atletas' });
    }
  },

  'POST /api/admin/athletes': async (req, res) => {
    const caller = await requireCoachOrAdmin(req, res);
    if (!caller) return;
    const body = await readBody(req);
    const name = String(body.name || '').trim().slice(0, 80);
    const email = String(body.email || '').trim().toLowerCase().slice(0, 120);
    if (!name || !email) return json(res, 400, { error: 'Nombre y correo electrónico son requeridos' });

    const athleteId = crypto.randomBytes(12).toString('base64url');
    const enrollmentToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 86400000);

    try {
      const result = await query(`
        INSERT INTO users (id, name, email, role, coach_id, enrollment_token, token_expires_at)
        VALUES ($1, $2, $3, 'ATHLETE', $4, $5, $6)
        RETURNING id, name, email, role, enrollment_token, token_expires_at;
      `, [athleteId, name, email, caller.id, enrollmentToken, expiresAt]);

      const athlete = result.rows[0];
      const enrollmentUrl = `${getOrigin(req)}/?enroll=${enrollmentToken}`;
      json(res, 201, { athlete, enrollmentUrl });
    } catch (err) {
      if (err.code === '23505') return json(res, 409, { error: 'El correo electrónico ya está registrado' });
      console.error('POST /api/admin/athletes error:', err);
      json(res, 500, { error: 'Error al registrar atleta en base de datos' });
    }
  },

  'GET /api/enroll/verify': async (req, res) => {
    const token = new URL(req.url, 'http://x').searchParams.get('token');
    if (!token) return json(res, 400, { error: 'Token no provisto' });
    try {
      const resToken = await query(`
        SELECT id, name, email, token_expires_at
        FROM users
        WHERE enrollment_token = $1 AND token_expires_at > NOW();
      `, [token]);
      if (!resToken.rows.length) return json(res, 404, { valid: false, error: 'Token inválido o expirado' });
      json(res, 200, { valid: true, athlete: resToken.rows[0] });
    } catch (err) {
      console.error('GET /api/enroll/verify error:', err);
      json(res, 500, { error: 'Error al verificar token' });
    }
  },

  'GET /api/coach/templates': async (req, res) => {
    const caller = await requireCoachOrAdmin(req, res);
    if (!caller) return;
    try {
      const resTpl = await query(`
        SELECT id, coach_id, name, description, emoji, progression_policy, exercises, created_at, updated_at
        FROM routine_templates
        ORDER BY updated_at DESC;
      `);
      json(res, 200, { templates: resTpl.rows });
    } catch (err) {
      console.error('GET /api/coach/templates error:', err);
      json(res, 500, { error: 'Error al obtener plantillas' });
    }
  },

  'POST /api/coach/templates': async (req, res) => {
    const caller = await requireCoachOrAdmin(req, res);
    if (!caller) return;
    const body = await readBody(req);
    const name = String(body.name || '').trim().slice(0, 100);
    if (!name) return json(res, 400, { error: 'Nombre de rutina requerido' });
    const templateId = String(body.id || '').trim() || ('tpl_' + crypto.randomBytes(10).toString('base64url'));
    const description = String(body.description || '').slice(0, 500);
    const emoji = String(body.emoji || 'dumbbell').slice(0, 32);
    const progressionPolicy = String(body.progression_policy || 'linear').slice(0, 32);
    const exercises = Array.isArray(body.exercises) ? body.exercises : [];

    try {
      const resTpl = await query(`
        INSERT INTO routine_templates (id, coach_id, name, description, emoji, progression_policy, exercises)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          emoji = EXCLUDED.emoji,
          progression_policy = EXCLUDED.progression_policy,
          exercises = EXCLUDED.exercises
        RETURNING *;
      `, [templateId, caller.id, name, description, emoji, progressionPolicy, JSON.stringify(exercises)]);
      json(res, 200, { template: resTpl.rows[0] });
    } catch (err) {
      console.error('POST /api/coach/templates error:', err);
      json(res, 500, { error: 'Error al guardar plantilla' });
    }
  },

  'POST /api/coach/assign-routine': async (req, res) => {
    const caller = await requireCoachOrAdmin(req, res);
    if (!caller) return;
    const body = await readBody(req);
    const { athleteIds, scheduledDate, routine, routineTemplateId } = body;
    if (!Array.isArray(athleteIds) || !athleteIds.length || !scheduledDate || !routine) {
      return json(res, 400, { error: 'Se requiere lista de atletas, fecha programada y datos de rutina' });
    }

    try {
      const assigned = [];
      for (const athleteId of athleteIds) {
        const asgnId = 'asgn_' + crypto.randomBytes(12).toString('base64url');
        const r = await query(`
          INSERT INTO daily_assignments (id, athlete_id, coach_id, scheduled_date, routine_template_id, routine_payload, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
          ON CONFLICT (athlete_id, scheduled_date)
          DO UPDATE SET
            routine_payload = EXCLUDED.routine_payload,
            status = 'PENDING',
            coach_id = EXCLUDED.coach_id,
            confirmed_at = NULL
          RETURNING *;
        `, [asgnId, athleteId, caller.id, scheduledDate, routineTemplateId || null, JSON.stringify(routine)]);
        assigned.push(r.rows[0]);

        sendPush(athleteId, {
          title: `🏋️ Nueva Rutina: ${routine.name}`,
          body: `Tu entrenador programó tu sesión para el ${scheduledDate}. ¡Confirma tu día!`,
          tag: 'routine-assigned'
        }).catch(() => {});
      }
      json(res, 200, { ok: true, count: assigned.length, assignments: assigned });
    } catch (err) {
      console.error('POST /api/coach/assign-routine error:', err);
      json(res, 500, { error: 'Error al procesar asignación' });
    }
  },

  'GET /api/coach/assignments': async (req, res) => {
    const caller = await requireCoachOrAdmin(req, res);
    if (!caller) return;
    const dateParam = new URL(req.url, 'http://x').searchParams.get('date');
    const targetDate = dateParam || new Date().toISOString().slice(0, 10);
    try {
      const resAsgn = await query(`
        SELECT da.id, da.athlete_id, u.name as athlete_name, u.email as athlete_email,
               da.scheduled_date, da.routine_payload, da.status, da.athlete_notes,
               da.session_rpe, da.confirmed_at, da.completed_at, da.created_at
        FROM daily_assignments da
        JOIN users u ON u.id = da.athlete_id
        WHERE da.scheduled_date = $1
        ORDER BY da.created_at DESC;
      `, [targetDate]);
      json(res, 200, { assignments: resAsgn.rows, date: targetDate });
    } catch (err) {
      console.error('GET /api/coach/assignments error:', err);
      json(res, 500, { error: 'Error al consultar asignaciones' });
    }
  },

  'GET /api/athlete/routine/today': async (req, res) => {
    const user = await readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    const dateParam = new URL(req.url, 'http://x').searchParams.get('date');
    const targetDate = dateParam || new Date().toISOString().slice(0, 10);
    try {
      const resAsgn = await query(`
        SELECT da.id, da.scheduled_date, da.routine_payload, da.status, da.athlete_notes,
               da.session_rpe, da.confirmed_at, da.completed_at, u.name as coach_name
        FROM daily_assignments da
        LEFT JOIN users u ON u.id = da.coach_id
        WHERE da.athlete_id = $1 AND da.scheduled_date = $2;
      `, [user.id, targetDate]);
      json(res, 200, { assignment: resAsgn.rows[0] || null });
    } catch (err) {
      console.error('GET /api/athlete/routine/today error:', err);
      json(res, 500, { error: 'Error al consultar rutina de hoy' });
    }
  },

  'POST /api/athlete/routine/confirm': async (req, res) => {
    const user = await readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    const body = await readBody(req);
    const { date, status, notes } = body;
    const targetDate = date || new Date().toISOString().slice(0, 10);
    if (!['CONFIRMED', 'REJECTED'].includes(status)) {
      return json(res, 400, { error: 'El estado debe ser CONFIRMED o REJECTED' });
    }

    try {
      const resUpd = await query(`
        UPDATE daily_assignments
        SET status = $1, athlete_notes = COALESCE($2, athlete_notes), confirmed_at = NOW()
        WHERE athlete_id = $3 AND scheduled_date = $4
        RETURNING id, athlete_id, coach_id, scheduled_date, status, athlete_notes, confirmed_at;
      `, [status, notes || null, user.id, targetDate]);

      if (!resUpd.rows.length) {
        return json(res, 404, { error: 'No se encontró rutina asignada para la fecha indicada' });
      }

      const asgn = resUpd.rows[0];
      if (asgn.coach_id) {
        sendPush(asgn.coach_id, {
          title: (status === 'CONFIRMED' ? '✅ ' : '⚠️ ') + user.name + (status === 'CONFIRMED' ? ' confirmó rutina' : ' reportó descanso'),
          body: notes ? `Nota: "${notes}"` : `Para la sesión de hoy (${targetDate})`,
          tag: 'athlete-confirm'
        }).catch(() => {});
      }

      json(res, 200, { ok: true, assignment: asgn });
    } catch (err) {
      console.error('POST /api/athlete/routine/confirm error:', err);
      json(res, 500, { error: 'Error al confirmar rutina' });
    }
  }
};

/* ---------- HTTP Request Dispatcher ---------- */
export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, 'http://x');
  const key = req.method + ' ' + url.pathname;
  const routeHandler = routes[key];

  if (!routeHandler) {
    return json(res, 404, { error: 'not found', path: url.pathname });
  }

  try {
    await routeHandler(req, res);
  } catch (e) {
    console.error(`[Handler Error] ${key}:`, e);
    if (!res.headersSent) {
      json(res, 500, { error: 'server error' });
    }
  }
}

if (!process.env.VERCEL) {
  http.createServer(handler).listen(PORT, () => {
    console.log(`gym-api on :${PORT} (rpID=${RP_ID}, origin=${ORIGIN})`);
  });
}
