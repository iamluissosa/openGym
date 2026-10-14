import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useStore } from "../store/useStore.js";
import { useUI } from "../store/useUI.js";
import { startFlow } from "../sheets.jsx";
import Icon from "./Icon.jsx";
import { Button } from "./ui.jsx";

export default function DailyRoutineCard() {
  const nav = useNavigate();
  const user = useStore((s) => s.user);
  const update = useStore((s) => s.update);
  const toast = useUI((s) => s.toast);

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadTodayAssignment = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await api("/api/athlete/routine/today");
      setAssignment(res.assignment || null);
      if (res.assignment?.athlete_notes) {
        setNotes(res.assignment.athlete_notes);
      }
    } catch (e) {
      // Si falla o está offline, simplemente no mostramos asignación externa
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayAssignment();
  }, [user?.id]);

  if (loading || !assignment) return null;

  const routine = assignment.routine_payload;
  const isConfirmed = assignment.status === "CONFIRMED";
  const isRejected = assignment.status === "REJECTED";

  const handleAction = async (status) => {
    setSubmitting(true);
    try {
      const res = await api("/api/athlete/routine/confirm", {
        method: "POST",
        body: JSON.stringify({
          date: assignment.scheduled_date,
          status,
          notes: notes.trim(),
        }),
      });
      setAssignment(res.assignment);
      toast(
        status === "CONFIRMED"
          ? "¡Rutina confirmada! Tu entrenador fue notificado."
          : "Descanso reportado al entrenador."
      );
    } catch (e) {
      toast(e.message || "Error al confirmar rutina");
    } finally {
      setSubmitting(false);
    }
  };

  // Asegura que la rutina prescrita esté disponible en el store local para ejecutarla
  const startAssignedWorkout = () => {
    if (!routine) return;
    const S = useStore.getState().S;
    let targetRoutineId = routine.id;

    const existing = (S.routines || []).find(
      (r) => r.id === routine.id || r.name === routine.name
    );
    if (!existing) {
      targetRoutineId = routine.id || "cr_" + Date.now().toString(36);
      const fullRoutine = {
        id: targetRoutineId,
        name: routine.name,
        emoji: routine.emoji || "dumbbell",
        prog: routine.prog || "linear",
        ex: routine.ex || [],
      };
      update((s) => {
        s.routines.push(fullRoutine);
      });
    } else {
      targetRoutineId = existing.id;
    }

    startFlow(targetRoutineId);
  };

  return (
    <div
      className="card"
      style={{
        borderColor: isConfirmed
          ? "var(--acc)"
          : isRejected
          ? "var(--red)"
          : "var(--blue)",
        background: isConfirmed
          ? "linear-gradient(135deg, rgba(163, 230, 53, 0.08), transparent)"
          : isRejected
          ? "linear-gradient(135deg, rgba(248, 113, 113, 0.08), transparent)"
          : "linear-gradient(135deg, rgba(56, 189, 248, 0.08), transparent)",
        marginBottom: 12,
      }}
    >
      {/* Cabecera de Estado */}
      <div
        className="row between"
        style={{ marginBottom: 8, alignItems: "center" }}
      >
        <span
          className="badge"
          style={{
            background: isConfirmed
              ? "rgba(163, 230, 53, 0.15)"
              : isRejected
              ? "rgba(248, 113, 113, 0.15)"
              : "rgba(56, 189, 248, 0.15)",
            color: isConfirmed
              ? "var(--acc)"
              : isRejected
              ? "var(--red)"
              : "var(--blue)",
            fontWeight: 600,
          }}
        >
          <Icon name="clipboard" style={{ marginRight: 4 }} />
          {assignment.coach_name
            ? `Asignada por ${assignment.coach_name}`
            : "Rutina Prescrita"}
        </span>

        <span
          className={`tag ${isConfirmed ? "acc" : isRejected ? "danger" : ""}`}
          style={{ fontSize: ".75rem" }}
        >
          {isConfirmed
            ? "✅ Confirmada"
            : isRejected
            ? "⚠️ Descanso"
            : "⏳ Requiere Confirmación"}
        </span>
      </div>

      {/* Detalle de la Rutina */}
      <div
        className="row"
        style={{ gap: 10, margin: "6px 0 10px", alignItems: "center" }}
      >
        <span
          className="lrow-i"
          style={{
            background: isConfirmed ? "var(--acc)" : "var(--surface-3)",
            color: isConfirmed ? "#0b0f17" : "inherit",
            fontSize: 20,
          }}
        >
          🏋️
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="big" style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            {routine.name}
          </div>
          <div className="dim small">
            {(routine.ex || []).length} ejercicios programados para hoy
          </div>
        </div>
      </div>

      {/* Estado: Pendiente de Confirmación */}
      {!isConfirmed && !isRejected && (
        <>
          <p className="dim small" style={{ marginBottom: 12 }}>
            Tu entrenador programó esta sesión para hoy. Confirma tu asistencia
            para calcular tus objetivos o reporta descanso.
          </p>

          {showNotes && (
            <textarea
              className="input"
              rows={2}
              placeholder="¿Alguna molestia física, fatiga o mensaje para el entrenador?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ marginBottom: 10, resize: "none" }}
            />
          )}

          <div className="row" style={{ gap: 8 }}>
            <Button
              variant="primary"
              icon="check"
              disabled={submitting}
              onClick={() => handleAction("CONFIRMED")}
              style={{ flex: 1 }}
            >
              {submitting ? "Confirmando..." : "Confirmar Rutina"}
            </Button>
            <Button
              variant="tinted"
              icon="message"
              title="Añadir nota / feedback"
              onClick={() => setShowNotes(!showNotes)}
            />
            <Button
              variant="danger"
              icon="x"
              disabled={submitting}
              title="No podré entrenar hoy (reportar descanso)"
              onClick={() => handleAction("REJECTED")}
            />
          </div>
        </>
      )}

      {/* Estado: Confirmada */}
      {isConfirmed && (
        <div>
          <div
            className="row between"
            style={{
              marginTop: 6,
              paddingTop: 8,
              borderTop: "1px solid var(--sep)",
              alignItems: "center",
            }}
          >
            <span className="small muted">
              Confirmaste esta sesión a las{" "}
              {assignment.confirmed_at
                ? new Date(assignment.confirmed_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </span>
            <Button
              variant="primary"
              icon="play"
              onClick={startAssignedWorkout}
            >
              Iniciar Entrenamiento
            </Button>
          </div>
          {assignment.athlete_notes && (
            <div
              className="callout tip"
              style={{
                margin: "8px 0 0",
                padding: "6px 10px",
                fontSize: ".8rem",
              }}
            >
              <strong>Tu nota:</strong> {assignment.athlete_notes}
            </div>
          )}
        </div>
      )}

      {/* Estado: Rechazada / Descanso */}
      {isRejected && (
        <div
          style={{
            marginTop: 6,
            paddingTop: 8,
            borderTop: "1px solid var(--sep)",
          }}
        >
          <div className="row between" style={{ alignItems: "center" }}>
            <span className="small dim">
              Le notificaste a tu entrenador que hoy descansarás.
            </span>
            <Button
              size="sm"
              variant="tinted"
              onClick={() => handleAction("CONFIRMED")}
            >
              Cambiar y Confirmar
            </Button>
          </div>
          {assignment.athlete_notes && (
            <div
              className="dim small"
              style={{ marginTop: 6, fontStyle: "italic" }}
            >
              Motivo reportado: "{assignment.athlete_notes}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
