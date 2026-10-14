/* opengym-api — passkey (WebAuthn) auth + per-user state storage for openGym
   No framework, JSON-file storage, signed session cookies.               */
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  generateRegistrationOptions, verifyRegistrationResponse,
  generateAuthenticationOptions, verifyAuthenticationResponse
} from '@simplewebauthn/server';
import webpush from 'web-push';
import { query, pool } from './db.js';

import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = +(process.env.PORT || 3000);
const DATA = process.env.DATA_DIR || path.resolve(__dirname, '../data');
const RP_ID = process.env.RP_ID || 'localhost';
const ORIGIN = process.env.ORIGIN || 'http://localhost:8080';
const RP_NAME = process.env.RP_NAME || 'openGym';
// Admin dashboard (issue): admins are matched by uid; INVITE_ONLY gates new signups behind a
// code the admin generates. Both default off so a fresh self-hosted instance stays open.
const ADMIN_UIDS = (process.env.ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
const INVITE_ONLY = /^(1|true|yes|on)$/i.test(process.env.INVITE_ONLY || '');
// 90 days keeps someone who trains a few times a week permanently signed in without a stolen
// cookie staying good for a year. Overridable because a family instance and one on the open
// internet don't want the same number. Only affects cookies minted from now on — the expiry is
// baked into each cookie when it's issued, so lowering this never cuts an existing session short.
const SESSION_DAYS = Math.max(1, +(process.env.SESSION_DAYS || 90) || 90);
const MAX_BODY = 5 * 1024 * 1024;
// Secure cookies require HTTPS; over plain http://localhost the flag would drop the cookie
const SECURE = /^https:/i.test(ORIGIN) ? ' Secure;' : '';

fs.mkdirSync(DATA, { recursive: true });

/* ---------- secret + db ---------- */
const secretFile = path.join(DATA, 'secret');
if (!fs.existsSync(secretFile)) fs.writeFileSync(secretFile, crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
const SECRET = fs.readFileSync(secretFile, 'utf8').trim();

const dbFile = path.join(DATA, 'db.json');
let db = { users: [], creds: [], subs: [], invites: [] };
try { db = JSON.parse(fs.readFileSync(dbFile, 'utf8')); } catch {}
db.subs = db.subs || [];
db.invites = db.invites || [];
const isAdmin = user => !!user && (user.admin === true || ADMIN_UIDS.includes(user.id));
function saveDb() { atomicWrite(dbFile, JSON.stringify(db, null, 2)); }
function atomicWrite(file, content) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}
const stateFile = uid => path.join(DATA, 'state-' + uid.replace(/[^a-zA-Z0-9_-]/g, '') + '.json');
function readState(uid) {
  try { return JSON.parse(fs.readFileSync(stateFile(uid), 'utf8')); } catch { return null; }
}

/* ---------- push notifications (Web Push / VAPID) ---------- */
const vapidFile = path.join(DATA, 'vapid.json');
let vapid;
try { vapid = JSON.parse(fs.readFileSync(vapidFile, 'utf8')); }
catch { vapid = webpush.generateVAPIDKeys(); fs.writeFileSync(vapidFile, JSON.stringify(vapid), { mode: 0o600 }); }
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || (SECURE ? ORIGIN : 'mailto:admin@localhost');
webpush.setVapidDetails(VAPID_SUBJECT, vapid.publicKey, vapid.privateKey);

async function sendPush(userId, payload) {
  const subs = db.subs.filter(s => s.userId === userId);
  if (!subs.length) return;
  const body = JSON.stringify(payload);
  let dirty = false;
  await Promise.all(subs.map(async sub => {
    // urgency 'high' is the one lever we have over delivery speed — iOS/Android throttle
    // low-urgency background push more aggressively under battery-saving modes. TTL is left
    // at the library default (long) so a briefly-offline device still gets it once reconnected,
    // rather than risking it being dropped for the sake of shaving off latency that TTL doesn't
    // actually control anyway.
    try { await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, body, { urgency: 'high' }); }
    catch (e) {
      console.error('push send failed', userId, e.statusCode, e.body || e.message);
      if (e.statusCode === 404 || e.statusCode === 410) {
        db.subs = db.subs.filter(s => s.endpoint !== sub.endpoint); dirty = true;
      }
    }
  }));
  if (dirty) saveDb();
}

// Rest-timer alerts: client schedules on start/extend, cancels on skip or on-screen completion —
// this only fires when the tab was backgrounded/suspended and never got to cancel it itself.
const restTimers = new Map(); // userId -> Timeout
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

// "Workout planned today" reminder — one per user per day, at their chosen time.
// Duplicated (not imported) from frontend/src/lib/history.js effectiveRoutineId — tiny pure helper, not worth sharing across the two runtimes.
function effectiveRoutineId(S, iso) {
  const ov = S.dayPlan?.[iso];
  if (ov === 'rest') return null;
  if (ov && S.routines?.some(r => r.id === ov)) return ov;
  const wd = new Date(iso + 'T12:00:00').getDay();
  return S.week?.[wd] || null;
}
// Computes "now" in an arbitrary IANA zone (e.g. "Europe/Lisbon") instead of the server's own —
// each user's reminder fires by their own clock, wherever they and their phone actually are.
function userNow(tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    }).formatToParts(new Date());
    const g = t => parts.find(p => p.type === t)?.value;
    return { date: `${g('year')}-${g('month')}-${g('day')}`, hhmm: `${g('hour')}:${g('minute')}` };
  } catch { return null; } // unknown/invalid tz string — skip this user rather than guess
}
setInterval(() => {
  for (const user of db.users) {
    if (!db.subs.some(s => s.userId === user.id)) continue;
    const S = readState(user.id);
    if (!S?.reminder?.on) continue;
    const now = userNow(S.reminder.tz || 'UTC');
    if (!now || S.reminder.time !== now.hhmm) continue;
    if (user.lastReminder === now.date) continue;
    if ((S.workouts || []).some(w => w.d === now.date)) continue;
    const rid = effectiveRoutineId(S, now.date);
    if (!rid) continue; // rest day — nothing planned
    const routine = (S.routines || []).find(r => r.id === rid);
    console.log('reminder firing', user.id, rid);
    user.lastReminder = now.date;
    saveDb();
    sendPush(user.id, {
      title: routine ? `${routine.emoji || '🏋️'} ${routine.name} today` : 'Workout planned today',
      body: "It's on your plan — let's go 💪",
      tag: 'day-reminder'
    });
  }
// Checked every 10s (not 60s) — ticks aren't aligned to the top of the minute, so a 60s
// interval could sit on your target minute for up to 59s before noticing. 10s caps that at ~9s.
}, 10000).unref();

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
// Session payload is `<uid>:<expiry>:<version>`, where the version is the user's `sv` counter.
// Bumping `sv` (POST /api/logout/all) makes every cookie ever handed out for that account stop
// verifying, which is the only revocation there was before short of deleting ./data/secret and
// signing out the whole instance. Cookies minted before `sv` existed have no third field and are
// read as version 0, matching a user who has never bumped — they stay valid until they expire.
const sessionVersion = user => user.sv || 0;
function makeSession(user) {
  const exp = Date.now() + SESSION_DAYS * 86400000;
  return sign(user.id + ':' + exp + ':' + sessionVersion(user));
}
function readSession(req) {
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(c => {
    const i = c.indexOf('='); return i < 0 ? ['', ''] : [c.slice(0, i).trim(), c.slice(i + 1).trim()];
  }));
  const tok = cookies.gymsid;
  if (!tok) return null;
  const payload = verifySig(tok);
  if (!payload) return null;
  const [uid, exp, ver] = payload.split(':');
  if (!uid || +exp < Date.now()) return null;
  const user = db.users.find(u => u.id === uid) || null;
  if (!user) return null;
  if (user.disabled) return null;           // disabled accounts are locked out everywhere
  // Missing third field = pre-versioning cookie = version 0. Anything non-numeric is a malformed
  // payload (it still had to pass the HMAC, so this is belt-and-braces) and is refused outright.
  const claimed = ver === undefined ? 0 : Number(ver);
  if (!Number.isInteger(claimed) || claimed !== sessionVersion(user)) return null;
  return user;
}
// Guard for /api/admin/* — resolves the caller and 401/403s if they aren't an admin.
function requireAdmin(req, res) {
  const user = readSession(req);
  if (!user) { json(res, 401, { error: 'not signed in' }); return null; }
  if (!isAdmin(user)) { json(res, 403, { error: 'forbidden' }); return null; }
  return user;
}

// Guard for coach & admin operations
async function requireCoachOrAdmin(req, res) {
  const user = readSession(req);
  if (!user) { json(res, 401, { error: 'not signed in' }); return null; }
  if (isAdmin(user)) return user;
  try {
    const r = await query('SELECT role FROM users WHERE id = $1', [user.id]);
    if (r.rows.length && (r.rows[0].role === 'ADMIN' || r.rows[0].role === 'COACH')) {
      return { ...user, role: r.rows[0].role };
    }
  } catch (e) {
    console.error('requireCoachOrAdmin error:', e.message);
  }
  json(res, 403, { error: 'forbidden' });
  return null;
}
function sessionCookie(user) {
  return `gymsid=${makeSession(user)}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly;${SECURE} SameSite=Lax`;
}
const clearCookie = `gymsid=; Path=/; Max-Age=0; HttpOnly;${SECURE} SameSite=Lax`;

/* ---------- challenge store (in-memory, 5 min TTL) ---------- */
const challenges = new Map(); // cid -> {challenge, name?, uid?, exp}
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
// Clients heartbeat /api/activity while a workout is on screen; the admin dashboard reads who's
// live. Purely ephemeral — never persisted. Expires shortly after the last ping.
const presence = new Map();               // uid -> { name, exIdx, exTotal, setsDone, setsTotal, startedAt, updatedAt }
const PRESENCE_TTL = 70000;               // ~3.5× the 20s client heartbeat
function livePresence(uid) {
  const p = presence.get(uid);
  if (!p) return null;
  if (Date.now() - p.updatedAt > PRESENCE_TTL) { presence.delete(uid); return null; }
  return p;
}
setInterval(() => { for (const [k, v] of presence) if (Date.now() - v.updatedAt > PRESENCE_TTL) presence.delete(k); }, 30000).unref();

/* ---------- routes ---------- */
const routes = {
  'GET /api/health': async (req, res) => json(res, 200, { ok: true, users: db.users.length }),

  // Public config the login screen needs before anyone is signed in.
  'GET /api/config': async (req, res) => json(res, 200, { invite_only: INVITE_ONLY }),

  'GET /api/me': async (req, res) => {
    const user = readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    json(res, 200, { user: { id: user.id, name: user.name, admin: isAdmin(user) } });
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
    if (INVITE_ONLY && !enrollmentToken && !db.invites.some(i => i.code === code && !i.usedBy && !i.revoked))
      return json(res, 403, { error: 'a valid invite code is required' });
    if (!uid) uid = crypto.randomBytes(12).toString('base64url');
    const options = await generateRegistrationOptions({
      rpName: RP_NAME, rpID: RP_ID,
      userID: Buffer.from(uid), userName: name, userDisplayName: name,
      attestationType: 'none',
      authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
      excludeCredentials: []
    });
    const cid = putChallenge({ challenge: options.challenge, name, uid, code, enrollmentToken });
    json(res, 200, { cid, options });
  },

  'POST /api/register/verify': async (req, res) => {
    const body = await readBody(req);
    const c = takeChallenge(body.cid);
    if (!c || !c.uid) return json(res, 400, { error: 'challenge expired — try again' });
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body.credential,
        expectedChallenge: c.challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: false
      });
    } catch (e) { return json(res, 400, { error: 'verification failed: ' + e.message }); }
    if (!verification.verified) return json(res, 400, { error: 'not verified' });
    const { credential } = verification.registrationInfo;
    if (db.creds.find(x => x.id === credential.id)) return json(res, 409, { error: 'credential already registered' });
    // Re-check the invite at the last moment (it may have been used/revoked since options), then burn it.
    let invite = null;
    if (INVITE_ONLY && !c.enrollmentToken) {
      invite = db.invites.find(i => i.code === c.code && !i.usedBy && !i.revoked);
      if (!invite) return json(res, 403, { error: 'invite code is no longer valid — ask for a new one' });
    }
    const user = { id: c.uid, name: c.name, created: new Date().toISOString() };
    if (invite) { user.invitedBy = invite.code; invite.usedBy = user.id; invite.usedAt = user.created; }
    db.users.push(user);
    db.creds.push({
      id: credential.id, userId: user.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter || 0,
      transports: body.credential?.response?.transports || []
    });
    saveDb();

    // Sincronizar usuario y credencial en Supabase
    if (c.enrollmentToken) {
      try {
        await query('UPDATE users SET enrollment_token = NULL, token_expires_at = NULL WHERE id = $1', [user.id]);
      } catch (e) { console.error('Error clearing enrollment_token:', e.message); }
    } else {
      try {
        await query(`
          INSERT INTO users (id, name, role, is_active, created_at)
          VALUES ($1, $2, 'ATHLETE', true, NOW())
          ON CONFLICT (id) DO NOTHING;
        `, [user.id, user.name]);
      } catch (e) { console.error('Error saving user in Supabase:', e.message); }
    }
    try {
      await query(`
        INSERT INTO passkey_credentials (id, user_id, public_key, counter, transports)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET counter = EXCLUDED.counter;
      `, [credential.id, user.id, Buffer.from(credential.publicKey).toString('base64url'), credential.counter || 0, body.credential?.response?.transports || []]);
    } catch (e) { console.error('Error saving credential in Supabase:', e.message); }

    json(res, 200, { user: { id: user.id, name: user.name, admin: isAdmin(user) } }, { 'Set-Cookie': sessionCookie(user) });
  },

  'POST /api/login/options': async (req, res) => {
    const options = await generateAuthenticationOptions({
      rpID: RP_ID, userVerification: 'preferred', allowCredentials: []
    });
    const cid = putChallenge({ challenge: options.challenge });
    json(res, 200, { cid, options });
  },

  'POST /api/login/verify': async (req, res) => {
    const body = await readBody(req);
    const c = takeChallenge(body.cid);
    if (!c) return json(res, 400, { error: 'challenge expired — try again' });
    const cred = db.creds.find(x => x.id === body.credential?.id);
    if (!cred) return json(res, 404, { error: 'unknown passkey — create a profile first' });
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body.credential,
        expectedChallenge: c.challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: false,
        credential: {
          id: cred.id,
          publicKey: b64uToBuf(cred.publicKey),
          counter: cred.counter,
          transports: cred.transports
        }
      });
    } catch (e) { return json(res, 400, { error: 'verification failed: ' + e.message }); }
    if (!verification.verified) return json(res, 400, { error: 'not verified' });
    cred.counter = verification.authenticationInfo.newCounter;
    saveDb();
    const user = db.users.find(u => u.id === cred.userId);
    if (!user) return json(res, 500, { error: 'user missing' });
    if (user.disabled) return json(res, 403, { error: 'this account has been disabled' });
    json(res, 200, { user: { id: user.id, name: user.name, admin: isAdmin(user) } }, { 'Set-Cookie': sessionCookie(user) });
  },

  'POST /api/logout': async (req, res) => json(res, 200, { ok: true }, { 'Set-Cookie': clearCookie }),

  // "Sign out everywhere" — bumps this user's session version, which invalidates every cookie
  // ever issued for the account, on every device, including a copy someone else walked off with.
  // The caller's own cookie is cleared here too, so the browser doing it doesn't sit on a token
  // it no longer accepts. Passkeys are untouched: signing back in works immediately.
  'POST /api/logout/all': async (req, res) => {
    const user = readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    user.sv = sessionVersion(user) + 1;
    saveDb();
    json(res, 200, { ok: true }, { 'Set-Cookie': clearCookie });
  },

  'GET /api/data': async (req, res) => {
    const user = readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    try {
      const state = JSON.parse(fs.readFileSync(stateFile(user.id), 'utf8'));
      json(res, 200, { state });
    } catch { json(res, 200, { state: null }); }
  },

  'PUT /api/data': async (req, res) => {
    const user = readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    const body = await readBody(req);
    if (!body.state || typeof body.state !== 'object') return json(res, 400, { error: 'state required' });
    delete body.state.active;              // in-progress workouts stay device-local
    atomicWrite(stateFile(user.id), JSON.stringify(body.state));
    try {
      await query(`
        INSERT INTO user_states (user_id, state, updated_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) DO UPDATE SET state = EXCLUDED.state, updated_at = EXCLUDED.updated_at;
      `, [user.id, JSON.stringify(body.state), body.state._ts || Date.now()]);
    } catch (e) { console.warn('Supabase user_states sync error:', e.message); }
    json(res, 200, { ok: true, ts: body.state._ts || null });
  },

  'GET /api/push/public-key': async (req, res) => json(res, 200, { key: vapid.publicKey }),

  'POST /api/push/subscribe': async (req, res) => {
    const user = readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    const body = await readBody(req);
    const sub = body.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return json(res, 400, { error: 'invalid subscription' });
    db.subs = db.subs.filter(s => s.endpoint !== sub.endpoint);
    db.subs.push({ userId: user.id, endpoint: sub.endpoint, keys: sub.keys, created: new Date().toISOString() });
    saveDb();
    json(res, 200, { ok: true });
  },

  'POST /api/push/unsubscribe': async (req, res) => {
    const user = readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    const body = await readBody(req);
    db.subs = db.subs.filter(s => !(s.userId === user.id && s.endpoint === body.endpoint));
    saveDb();
    json(res, 200, { ok: true });
  },

  'POST /api/push/test': async (req, res) => {
    const user = readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    await sendPush(user.id, { title: 'openGym', body: 'Test notification ✅ — this is what alerts look like.', tag: 'test' });
    json(res, 200, { ok: true });
  },

  'POST /api/push/rest-timer': async (req, res) => {
    const user = readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    const body = await readBody(req);
    const sec = Math.max(1, Math.min(3600, Math.round(+body.seconds || 0)));
    if (!sec) return json(res, 400, { error: 'seconds required' });
    scheduleRestTimer(user.id, sec);
    json(res, 200, { ok: true });
  },

  'POST /api/push/rest-timer/cancel': async (req, res) => {
    const user = readSession(req);
    if (!user) return json(res, 401, { error: 'not signed in' });
    cancelRestTimer(user.id);
    json(res, 200, { ok: true });
  },

  // Live-workout heartbeat: client pings while a workout is on screen; { active:false } drops it.
  'POST /api/activity': async (req, res) => {
    const user = readSession(req);
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
  // One row per user, cheap enough for a personal instance (reads each state file once).
  'GET /api/admin/users': async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const users = db.users.map(u => {
      const S = readState(u.id) || {};
      const workouts = S.workouts || [];
      const last = workouts[workouts.length - 1];
      return {
        id: u.id, name: u.name, created: u.created || null,
        disabled: !!u.disabled, admin: isAdmin(u), invitedBy: u.invitedBy || null,
        workouts: workouts.length,
        lastWorkout: last ? last.d : null,
        lastSync: S._ts || null,
        hasPush: db.subs.some(s => s.userId === u.id),
        live: livePresence(u.id)
      };
    });
    json(res, 200, { users, invite_only: INVITE_ONLY, now: Date.now() });
  },

  // Drill-down: full workout history + body-weight log for one user.
  'GET /api/admin/user': async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const id = new URL(req.url, 'http://x').searchParams.get('id');
    const u = db.users.find(x => x.id === id);
    if (!u) return json(res, 404, { error: 'no such user' });
    const S = readState(u.id) || {};
    json(res, 200, {
      user: { id: u.id, name: u.name, created: u.created || null, disabled: !!u.disabled, admin: isAdmin(u), invitedBy: u.invitedBy || null },
      unit: S.unit || 'kg',
      lastSync: S._ts || null,
      routines: (S.routines || []).map(r => ({ id: r.id, name: r.name, emoji: r.emoji, count: (r.ex || []).length })),
      bodyweight: S.bodyweight || [],
      workouts: (S.workouts || []).slice().reverse()   // newest first for display
    });
  },

  'POST /api/admin/user/disable': async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const body = await readBody(req);
    const u = db.users.find(x => x.id === body.id);
    if (!u) return json(res, 404, { error: 'no such user' });
    if (isAdmin(u)) return json(res, 400, { error: 'cannot disable an admin' });
    u.disabled = !!body.disabled;
    if (u.disabled) presence.delete(u.id);   // drop them off "training now" at once
    saveDb();
    json(res, 200, { ok: true, id: u.id, disabled: u.disabled });
  },

  'GET /api/admin/invites': async (req, res) => {
    if (!requireAdmin(req, res)) return;
    // resolve usedBy uid → name for display
    const invites = db.invites.map(i => ({
      ...i, usedByName: i.usedBy ? (db.users.find(u => u.id === i.usedBy) || {}).name || null : null
    }));
    json(res, 200, { invites, invite_only: INVITE_ONLY });
  },

  'POST /api/admin/invites/new': async (req, res) => {
    const admin = requireAdmin(req, res); if (!admin) return;
    const body = await readBody(req);
    let code;
    // 16 hex chars = 64 bits, up from 8 chars / 32 bits. The app has no rate limiting by design
    // (that's the reverse proxy's job) and /api/register/options tells a caller whether a code is
    // good, so the code itself has to be the thing that isn't worth guessing. Codes already in
    // db.json keep working — validation is an exact string compare, never a length or format check.
    do { code = crypto.randomBytes(8).toString('hex').toUpperCase(); } while (db.invites.some(i => i.code === code));
    const invite = { code, note: String(body.note || '').slice(0, 60), createdBy: admin.id, created: new Date().toISOString() };
    db.invites.push(invite);
    saveDb();
    json(res, 200, { invite });
  },

  'POST /api/admin/invites/revoke': async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const body = await readBody(req);
    const inv = db.invites.find(i => i.code === String(body.code || '').toUpperCase());
    if (!inv) return json(res, 404, { error: 'no such code' });
    if (inv.usedBy) return json(res, 400, { error: 'already used — cannot revoke' });
    db.invites = db.invites.filter(i => i.code !== inv.code);
    saveDb();
    json(res, 200, { ok: true });
  },

  /* ---------- coach / athletes management & prescription ---------- */
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
    const expiresAt = new Date(Date.now() + 7 * 86400000); // 7 días

    try {
      const result = await query(`
        INSERT INTO users (id, name, email, role, coach_id, enrollment_token, token_expires_at)
        VALUES ($1, $2, $3, 'ATHLETE', $4, $5, $6)
        RETURNING id, name, email, role, enrollment_token, token_expires_at;
      `, [athleteId, name, email, caller.id, enrollmentToken, expiresAt]);

      // Mantener en db.users para sincronización local si es necesario
      if (!db.users.some(u => u.id === athleteId)) {
        db.users.push({ id: athleteId, name, email, created: new Date().toISOString() });
        saveDb();
      }

      const athlete = result.rows[0];
      const enrollmentUrl = `${ORIGIN}/?enroll=${enrollmentToken}`;
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

        // Enviar notificación Push al atleta
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
    const user = readSession(req);
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
    const user = readSession(req);
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

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const key = req.method + ' ' + url.pathname;
  const handler = routes[key];
  if (!handler) return json(res, 404, { error: 'not found' });
  try { await handler(req, res); }
  catch (e) {
    console.error(key, e);
    if (!res.headersSent) json(res, 500, { error: 'server error' });
  }
}).listen(PORT, () => console.log(`gym-api on :${PORT} (rpID=${RP_ID}, origin=${ORIGIN})`));
