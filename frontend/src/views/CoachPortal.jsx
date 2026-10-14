import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore.js";
import { useUI } from "../store/useUI.js";
import { api } from "../lib/api.js";
import { fmtDate, todayISO } from "../lib/format.js";
import Icon from "../components/Icon.jsx";
import { Button, Segmented } from "../components/ui.jsx";
import { exercisePicker, exConfigSheet, confirmSheet } from "../sheets.jsx";

export default function CoachPortal() {
  const nav = useNavigate();
  const user = useStore((s) => s.user);
  const S = useStore((s) => s.S);
  const toast = useUI((s) => s.toast);

  const [tab, setTab] = useState("athletes"); // 'athletes' | 'assign' | 'monitor' | 'templates'
  const [loading, setLoading] = useState(false);

  // Estados de Atletas
  const [athletes, setAthletes] = useState([]);
  const [newAthleteName, setNewAthleteName] = useState("");
  const [newAthleteEmail, setNewAthleteEmail] = useState("");
  const [enrolledResult, setEnrolledResult] = useState(null);

  // Estados de Asignación
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Estados de Monitoreo
  const [assignments, setAssignments] = useState([]);

  // Estados de Plantillas
  const [templates, setTemplates] = useState([]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateEmoji, setNewTemplateEmoji] = useState("dumbbell");
  const [newTemplateExercises, setNewTemplateExercises] = useState([]);

  const loadAthletes = async () => {
    try {
      const res = await api("/api/admin/athletes");
      setAthletes(res.athletes || []);
    } catch (e) {
      toast(e.message || "Error al cargar atletas");
    }
  };

  const loadAssignments = async (date) => {
    try {
      const res = await api(
        "/api/coach/assignments?date=" +
          encodeURIComponent(date || selectedDate)
      );
      setAssignments(res.assignments || []);
    } catch (e) {
      toast(e.message || "Error al cargar asignaciones");
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await api("/api/coach/templates");
      setTemplates(res.templates || []);
    } catch (e) {
      toast(e.message || "Error al cargar plantillas");
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadAthletes(),
      loadAssignments(selectedDate),
      loadTemplates(),
    ]).finally(() => setLoading(false));
  }, [selectedDate]);

  // 1. Alta de Nuevo Atleta
  const handleCreateAthlete = async (e) => {
    e.preventDefault();
    if (!newAthleteName.trim() || !newAthleteEmail.trim()) {
      toast("Ingresa nombre y correo electrónico");
      return;
    }
    try {
      const res = await api("/api/admin/athletes", {
        method: "POST",
        body: JSON.stringify({
          name: newAthleteName.trim(),
          email: newAthleteEmail.trim(),
        }),
      });
      toast("Atleta creado exitosamente");
      setEnrolledResult(res);
      setNewAthleteName("");
      setNewAthleteEmail("");
      loadAthletes();
    } catch (err) {
      toast(err.message || "Error al crear atleta");
    }
  };

  // 2. Asignación de Rutina
  const handleAssign = async () => {
    if (!selectedAthleteId) {
      toast("Selecciona un atleta");
      return;
    }

    let routinePayload = null;
    const chosenTemplate = templates.find((t) => t.id === selectedTemplateId);
    if (chosenTemplate) {
      routinePayload = {
        name: chosenTemplate.name,
        emoji: chosenTemplate.emoji,
        ex: chosenTemplate.exercises || [],
      };
    } else {
      // Alternativa: buscar entre las rutinas locales del perfil
      const localRoutine = (S.routines || []).find(
        (r) => r.id === selectedTemplateId
      );
      if (localRoutine) {
        routinePayload = {
          name: localRoutine.name,
          emoji: localRoutine.emoji,
          ex: localRoutine.ex || [],
        };
      }
    }

    if (!routinePayload) {
      toast("Selecciona una rutina para asignar");
      return;
    }

    setAssigning(true);
    try {
      await api("/api/coach/assign-routine", {
        method: "POST",
        body: JSON.stringify({
          athleteIds: [selectedAthleteId],
          scheduledDate: selectedDate,
          routine: routinePayload,
          routineTemplateId: chosenTemplate?.id || null,
        }),
      });
      toast("Rutina asignada exitosamente");
      loadAssignments(selectedDate);
      setTab("monitor");
    } catch (e) {
      toast(e.message || "Error al asignar rutina");
    } finally {
      setAssigning(false);
    }
  };

  // 3. Creación de Plantilla
  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast("Ingresa el nombre de la plantilla");
      return;
    }
    if (!newTemplateExercises.length) {
      toast("Añade al menos un ejercicio a la plantilla");
      return;
    }
    try {
      await api("/api/coach/templates", {
        method: "POST",
        body: JSON.stringify({
          name: newTemplateName.trim(),
          emoji: newTemplateEmoji,
          exercises: newTemplateExercises,
        }),
      });
      toast("Plantilla guardada");
      setNewTemplateName("");
      setNewTemplateExercises([]);
      loadTemplates();
    } catch (e) {
      toast(e.message || "Error al guardar plantilla");
    }
  };

  const addExerciseToTemplate = () => {
    exercisePicker((ex) => {
      exConfigSheet(ex, null, (cfg) => {
        setNewTemplateExercises((prev) => [...prev, { id: ex.id, ...cfg }]);
      });
    });
  };

  // Conteo de métricas de monitoreo
  const confirmedCount = assignments.filter(
    (a) => a.status === "CONFIRMED"
  ).length;
  const completedCount = assignments.filter(
    (a) => a.status === "COMPLETED"
  ).length;
  const rejectedCount = assignments.filter(
    (a) => a.status === "REJECTED"
  ).length;
  const pendingCount = assignments.filter((a) => a.status === "PENDING").length;

  return (
    <div className="narrow">
      {/* Header */}
      <div className="hdr">
        <button
          className="iconbtn"
          onClick={() => nav("/admin")}
          aria-label="Volver"
        >
          <Icon name="chevronLeft" />
        </button>
        <div style={{ flex: 1, marginLeft: 8 }}>
          <h1 style={{ margin: 0 }}>Portal de Entrenador</h1>
          <div className="sub">
            Prescripción diaria y supervisión de atletas
          </div>
        </div>
        <button
          className="iconbtn"
          onClick={() => {
            loadAthletes();
            loadAssignments(selectedDate);
            loadTemplates();
          }}
          aria-label="Recargar"
        >
          ↻
        </button>
      </div>

      {/* Selector de Pestañas */}
      <div style={{ marginBottom: 16 }}>
        <Segmented
          options={[
            { value: "athletes", label: "Atletas", icon: "person" },
            { value: "assign", label: "Asignar", icon: "clipboard" },
            { value: "monitor", label: "Monitoreo", icon: "chartLine" },
            { value: "templates", label: "Plantillas", icon: "sparkles" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {/* ==================== TAB 1: ATLETAS ==================== */}
      {tab === "athletes" && (
        <>
          <div className="card">
            <h2 className="row" style={{ gap: 6, margin: "0 0 12px" }}>
              <Icon name="plus" /> Registrar Nuevo Atleta
            </h2>
            <form
              onSubmit={handleCreateAthlete}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <input
                className="input"
                placeholder="Nombre completo del atleta"
                value={newAthleteName}
                onChange={(e) => setNewAthleteName(e.target.value)}
                required
              />
              <input
                className="input"
                type="email"
                placeholder="Correo electrónico"
                value={newAthleteEmail}
                onChange={(e) => setNewAthleteEmail(e.target.value)}
                required
              />
              <Button variant="primary" icon="plus" type="submit">
                Crear Perfil y Generar Enlace
              </Button>
            </form>

            {enrolledResult && (
              <div
                className="card"
                style={{
                  marginTop: 14,
                  background: "rgba(163, 230, 53, 0.08)",
                  borderColor: "var(--acc)",
                }}
              >
                <div className="row between" style={{ marginBottom: 6 }}>
                  <span
                    className="small"
                    style={{ fontWeight: 600, color: "var(--acc)" }}
                  >
                    ✅ Enlace de activación listo para{" "}
                    {enrolledResult.athlete.name}
                  </span>
                  <Button
                    size="sm"
                    variant="tinted"
                    icon="clipboard"
                    onClick={() => {
                      navigator.clipboard
                        ?.writeText(enrolledResult.enrollmentUrl)
                        .catch(() => {});
                      toast("Enlace copiado al portapapeles");
                    }}
                  >
                    Copiar Enlace
                  </Button>
                </div>
                <div
                  className="dim small"
                  style={{ wordBreak: "break-all", fontFamily: "monospace" }}
                >
                  {enrolledResult.enrollmentUrl}
                </div>
              </div>
            )}
          </div>

          <h4 className="sec">Atletas Registrados ({athletes.length})</h4>
          <div className="list">
            {athletes.map((a) => (
              <div key={a.id} className="item">
                <span
                  className="lrow-i"
                  style={{ background: "var(--surface-3)", fontSize: 18 }}
                >
                  🏋️
                </span>
                <div className="grow">
                  <div className="tt">{a.name}</div>
                  <div className="ss">
                    {a.email || "Sin correo registrado"} ·{" "}
                    {a.total_assignments || 0} entrenamientos programados
                  </div>
                </div>
                <span
                  className={`tag ${
                    a.today_status === "CONFIRMED"
                      ? "acc"
                      : a.today_status === "COMPLETED"
                      ? "primary"
                      : a.today_status === "REJECTED"
                      ? "danger"
                      : ""
                  }`}
                >
                  {a.today_status === "CONFIRMED"
                    ? "Confirmado hoy"
                    : a.today_status === "COMPLETED"
                    ? "Completado"
                    : a.today_status === "REJECTED"
                    ? "Descanso"
                    : "Sin confirmación"}
                </span>
              </div>
            ))}
            {!athletes.length && (
              <div className="empty">
                No hay atletas registrados aún. Da de alta al primero arriba.
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== TAB 2: ASIGNAR RUTINA ==================== */}
      {tab === "assign" && (
        <div className="card">
          <h2 style={{ margin: "0 0 12px" }}>Programar Rutina Diaria</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label
                className="lbl2"
                style={{ marginBottom: 4, display: "block" }}
              >
                Fecha de la Sesión
              </label>
              <div className="row" style={{ gap: 8 }}>
                <input
                  type="date"
                  className="input"
                  style={{ flex: 1 }}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <Button
                  size="sm"
                  variant={selectedDate === todayISO() ? "primary" : "tinted"}
                  onClick={() => setSelectedDate(todayISO())}
                >
                  Hoy
                </Button>
              </div>
            </div>

            <div>
              <label
                className="lbl2"
                style={{ marginBottom: 4, display: "block" }}
              >
                Seleccionar Atleta
              </label>
              <select
                className="input"
                value={selectedAthleteId}
                onChange={(e) => setSelectedAthleteId(e.target.value)}
              >
                <option value="">-- Elige un atleta --</option>
                {athletes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.email || "ID: " + a.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="lbl2"
                style={{ marginBottom: 4, display: "block" }}
              >
                Seleccionar Rutina
              </label>
              <select
                className="input"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                <option value="">-- Elige una rutina --</option>
                <optgroup label="Plantillas de Entrenador">
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({(t.exercises || []).length} ej.)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Rutinas de tu perfil">
                  {(S.routines || []).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({(r.ex || []).length} ej.)
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <Button
              variant="primary"
              icon="send"
              disabled={assigning || !selectedAthleteId || !selectedTemplateId}
              onClick={handleAssign}
            >
              {assigning
                ? "Asignando..."
                : "Asignar Rutina y Notificar al Atleta"}
            </Button>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: MONITOREO DIARIO ==================== */}
      {tab === "monitor" && (
        <>
          <div
            className="row between"
            style={{ marginBottom: 12, alignItems: "center" }}
          >
            <h2 style={{ margin: 0 }}>Monitoreo ({selectedDate})</h2>
            <input
              type="date"
              className="input"
              style={{ width: 140, padding: "4px 8px", fontSize: 13 }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="tiles" style={{ marginBottom: 16 }}>
            <div className="tile">
              <div className="l">Asignadas</div>
              <div className="v">{assignments.length}</div>
            </div>
            <div className="tile">
              <div className="l">Confirmadas</div>
              <div className="v" style={{ color: "var(--acc)" }}>
                {confirmedCount}
              </div>
            </div>
            <div className="tile">
              <div className="l">Completadas</div>
              <div className="v" style={{ color: "var(--green)" }}>
                {completedCount}
              </div>
            </div>
            <div className="tile">
              <div className="l">Descanso</div>
              <div className="v" style={{ color: "var(--red)" }}>
                {rejectedCount}
              </div>
            </div>
          </div>

          <div className="list">
            {assignments.map((asgn) => (
              <div
                key={asgn.id}
                className="item"
                style={{
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: 6,
                }}
              >
                <div className="row between">
                  <div>
                    <div className="tt" style={{ fontSize: "1rem" }}>
                      {asgn.athlete_name}
                    </div>
                    <div className="dim small">
                      Rutina: {asgn.routine_payload?.name}
                    </div>
                  </div>
                  <span
                    className={`tag ${
                      asgn.status === "CONFIRMED"
                        ? "acc"
                        : asgn.status === "COMPLETED"
                        ? "primary"
                        : asgn.status === "REJECTED"
                        ? "danger"
                        : ""
                    }`}
                  >
                    {asgn.status === "CONFIRMED"
                      ? "✅ Confirmada"
                      : asgn.status === "COMPLETED"
                      ? "🏆 Finalizada"
                      : asgn.status === "REJECTED"
                      ? "⚠️ Descanso"
                      : "⏳ Pendiente"}
                  </span>
                </div>
                {asgn.athlete_notes && (
                  <div
                    className="callout"
                    style={{
                      margin: "4px 0 0",
                      padding: "6px 10px",
                      fontSize: "0.82rem",
                    }}
                  >
                    <strong>Comentario del atleta:</strong> {asgn.athlete_notes}
                  </div>
                )}
                {asgn.confirmed_at && (
                  <div
                    className="dim"
                    style={{ fontSize: "0.72rem", textAlign: "right" }}
                  >
                    Confirmado el{" "}
                    {new Date(asgn.confirmed_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            ))}
            {!assignments.length && (
              <div className="empty">
                No hay rutinas asignadas para la fecha seleccionada.
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== TAB 4: PLANTILLAS ==================== */}
      {tab === "templates" && (
        <>
          <div className="card">
            <h2 style={{ margin: "0 0 10px" }}>Crear Plantilla Maestra</h2>
            <input
              className="input"
              placeholder="Nombre de la plantilla (ej. Pierna Enfoque Cuádriceps)"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              style={{ marginBottom: 10 }}
            />

            <div className="row between" style={{ margin: "8px 0 12px" }}>
              <span className="small muted">
                Ejercicios incluidos ({newTemplateExercises.length})
              </span>
              <Button
                size="sm"
                variant="tinted"
                icon="plus"
                onClick={addExerciseToTemplate}
              >
                Añadir Ejercicio
              </Button>
            </div>

            {newTemplateExercises.length > 0 ? (
              <div className="list" style={{ marginBottom: 12 }}>
                {newTemplateExercises.map((e, idx) => (
                  <div key={idx} className="item">
                    <span className="lrow-i" style={{ fontSize: 16 }}>
                      💪
                    </span>
                    <div className="grow">
                      <div className="tt capitalize">Ejercicio #{e.id}</div>
                      <div className="ss">
                        {e.sets || 3} series · {e.reps || 10} reps
                      </div>
                    </div>
                    <button
                      className="iconbtn"
                      style={{ color: "var(--red)" }}
                      onClick={() =>
                        setNewTemplateExercises((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dim small" style={{ marginBottom: 12 }}>
                Ningún ejercicio añadido a la plantilla aún.
              </div>
            )}

            <Button
              variant="primary"
              icon="sparkles"
              onClick={handleSaveTemplate}
            >
              Guardar Plantilla en Supabase
            </Button>
          </div>

          <h4 className="sec">Plantillas Disponibles ({templates.length})</h4>
          <div className="list">
            {templates.map((t) => (
              <div key={t.id} className="item">
                <span className="lrow-i" style={{ background: "var(--acc)" }}>
                  📋
                </span>
                <div className="grow">
                  <div className="tt">{t.name}</div>
                  <div className="ss">
                    {(t.exercises || []).length} ejercicios programados ·
                    Política {t.progression_policy || "linear"}
                  </div>
                </div>
              </div>
            ))}
            {!templates.length && (
              <div className="empty">No hay plantillas guardadas aún.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
