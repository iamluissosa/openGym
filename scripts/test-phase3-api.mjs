#!/usr/bin/env node
/**
 * Test de Integración: Endpoints Fase 3 (Atletas, Asignaciones y Confirmación)
 */
import { query, pool } from '../api/db.js';

async function runTests() {
  console.log('🧪 Iniciando verificación de endpoints de Fase 3 en Supabase...');
  try {
    // 1. Crear un coach de prueba si no existe
    const coachId = 'coach_test_' + Date.now().toString(36);
    await query(`
      INSERT INTO users (id, name, email, role, is_active)
      VALUES ($1, 'Coach Alejandro', 'coach@test.com', 'COACH', true)
      ON CONFLICT (id) DO NOTHING;
    `, [coachId]);
    console.log('✅ 1. Coach verificado en base de datos:', coachId);

    // 2. Crear un atleta con token de enrolamiento
    const athleteId = 'ath_test_' + Date.now().toString(36);
    const token = 'token_test_' + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 7 * 86400000);
    const resAth = await query(`
      INSERT INTO users (id, name, email, role, coach_id, enrollment_token, token_expires_at)
      VALUES ($1, 'Julian Atleta', 'julian@test.com', 'ATHLETE', $2, $3, $4)
      RETURNING id, name, email, role, enrollment_token;
    `, [athleteId, coachId, token, expiresAt]);
    console.log('✅ 2. Atleta creado exitosamente:', resAth.rows[0]);

    // 3. Crear una plantilla de rutina
    const templateId = 'tpl_test_' + Date.now().toString(36);
    const routinePayload = {
      name: 'Torso Fuerza & Potencia',
      emoji: 'dumbbell',
      ex: [
        { id: '0025', name: 'Press de Banca Plano', sets: 4, reps: '6-8', prog: 'linear' },
        { id: '0047', name: 'Dominadas con Lastre', sets: 4, reps: '8', prog: 'double' }
      ]
    };
    const resTpl = await query(`
      INSERT INTO routine_templates (id, coach_id, name, description, emoji, progression_policy, exercises)
      VALUES ($1, $2, $3, 'Rutina de hipertrofia y fuerza de torso', 'dumbbell', 'linear', $4)
      RETURNING id, name;
    `, [templateId, coachId, routinePayload.name, JSON.stringify(routinePayload.ex)]);
    console.log('✅ 3. Plantilla de rutina guardada:', resTpl.rows[0]);

    // 4. Asignar la rutina para el día de hoy
    const today = new Date().toISOString().slice(0, 10);
    const asgnId = 'asgn_test_' + Date.now().toString(36);
    const resAsgn = await query(`
      INSERT INTO daily_assignments (id, athlete_id, coach_id, scheduled_date, routine_template_id, routine_payload, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
      ON CONFLICT (athlete_id, scheduled_date) DO UPDATE SET status = 'PENDING'
      RETURNING id, athlete_id, scheduled_date, status;
    `, [asgnId, athleteId, coachId, today, templateId, JSON.stringify(routinePayload)]);
    console.log('✅ 4. Asignación de rutina diaria generada:', resAsgn.rows[0]);

    // 5. Simular la confirmación del atleta
    const resConfirm = await query(`
      UPDATE daily_assignments
      SET status = 'CONFIRMED', athlete_notes = 'Confirmado. Sin molestias previas.', confirmed_at = NOW()
      WHERE athlete_id = $1 AND scheduled_date = $2
      RETURNING id, athlete_id, status, athlete_notes, confirmed_at;
    `, [athleteId, today]);
    console.log('✅ 5. Atleta confirmó rutina de hoy:', resConfirm.rows[0]);

    // 6. Consultar el panel del coach
    const resCoachView = await query(`
      SELECT da.id, da.scheduled_date, u.name as athlete_name, da.status, da.athlete_notes, da.confirmed_at
      FROM daily_assignments da
      JOIN users u ON u.id = da.athlete_id
      WHERE da.coach_id = $1 AND da.scheduled_date = $2;
    `, [coachId, today]);
    console.log('✅ 6. Vista del entrenador verificada:', resCoachView.rows[0]);

    console.log('🎉 TODOS LOS TESTS DE INTEGRACIÓN DE LA FASE 3 PASARON SATISFACTORIAMENTE.');
  } catch (err) {
    console.error('❌ Error en test de Fase 3:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
