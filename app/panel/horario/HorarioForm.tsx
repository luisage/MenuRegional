"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./Horario.module.css";
import { guardarHorarios } from "@/app/lib/actions/horario";

const DIAS = [
  { value: "LUNES", label: "Lunes" },
  { value: "MARTES", label: "Martes" },
  { value: "MIERCOLES", label: "Miércoles" },
  { value: "JUEVES", label: "Jueves" },
  { value: "VIERNES", label: "Viernes" },
  { value: "SABADO", label: "Sábado" },
  { value: "DOMINGO", label: "Domingo" },
] as const;

type DiaSemana = (typeof DIAS)[number]["value"];

type HorarioDia = {
  abierto: boolean;
  apertura: string;
  cierre: string;
};

type HorarioExistente = {
  dia: string;
  apertura: string;
  cierre: string;
  abierto: boolean;
};

type SucursalOpcion = {
  id: string;
  nombre: string;
  calle: string;
  numero: string;
};

type Props = {
  sucursales: SucursalOpcion[];
  sucursalSeleccionadaId: string;
  horariosExistentes: HorarioExistente[];
};

const DEFAULT_HORARIO: HorarioDia = { abierto: true, apertura: "09:00", cierre: "22:00" };

function buildEstado(horariosExistentes: HorarioExistente[]) {
  const map = new Map(horariosExistentes.map((h) => [h.dia, h]));
  return Object.fromEntries(
    DIAS.map(({ value }) => {
      const existente = map.get(value);
      return [
        value,
        existente
          ? { abierto: existente.abierto, apertura: existente.apertura, cierre: existente.cierre }
          : { ...DEFAULT_HORARIO },
      ];
    })
  ) as Record<DiaSemana, HorarioDia>;
}

type Feedback = { tipo: "ok" | "error"; mensaje: string };

export default function HorarioForm({ sucursales, sucursalSeleccionadaId, horariosExistentes }: Props) {
  const router = useRouter();
  const [horarios, setHorarios] = useState<Record<DiaSemana, HorarioDia>>(() =>
    buildEstado(horariosExistentes)
  );
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, startTransition] = useTransition();

  function actualizarDia(dia: DiaSemana, campo: keyof HorarioDia, valor: string | boolean) {
    setFeedback(null);
    setHorarios((prev) => ({
      ...prev,
      [dia]: { ...prev[dia], [campo]: valor },
    }));
  }

  function handleSucursalChange(id: string) {
    router.push(`/panel/horario?sucursalId=${id}`);
  }

  function handleGuardar() {
    const sucursalActual = sucursales.find((s) => s.id === sucursalSeleccionadaId)!;
    for (const { value: dia } of DIAS) {
      const h = horarios[dia];
      if (h.abierto && (!h.apertura || !h.cierre)) {
        setFeedback({ tipo: "error", mensaje: `Completa la hora de apertura y cierre para el ${DIAS.find(d => d.value === dia)?.label}.` });
        return;
      }
      if (h.abierto && h.apertura >= h.cierre) {
        setFeedback({ tipo: "error", mensaje: `La hora de cierre debe ser mayor que la de apertura (${DIAS.find(d => d.value === dia)?.label}).` });
        return;
      }
    }

    const payload = DIAS.map(({ value: dia }) => ({ dia, ...horarios[dia] })) as Parameters<typeof guardarHorarios>[1];

    startTransition(async () => {
      const result = await guardarHorarios(sucursalSeleccionadaId, payload);
      if ("ok" in result) {
        setFeedback({ tipo: "ok", mensaje: `Horarios de "${sucursalActual.nombre}" guardados correctamente.` });
      } else {
        setFeedback({ tipo: "error", mensaje: result.error });
      }
    });
  }

  const sucursalActual = sucursales.find((s) => s.id === sucursalSeleccionadaId);

  return (
    <div className={styles.wrapper}>
      {/* Sucursal selector */}
      <div className={styles.sucursalBar}>
        {sucursales.length > 1 ? (
          <div className={styles.sucursalSelect}>
            <label className={styles.sucursalLabel}>Sucursal</label>
            <select
              className={styles.select}
              value={sucursalSeleccionadaId}
              onChange={(e) => handleSucursalChange(e.target.value)}
            >
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} — {s.calle} {s.numero}
                </option>
              ))}
            </select>
          </div>
        ) : sucursalActual ? (
          <div className={styles.sucursalInfo}>
            <p className={styles.sucursalNombre}>{sucursalActual.nombre}</p>
            <p className={styles.sucursalDireccion}>
              {sucursalActual.calle} {sucursalActual.numero}
            </p>
          </div>
        ) : null}
      </div>

      {/* Tabla de horarios */}
      <div className={styles.tabla}>
        {/* Encabezado — solo visible en pantallas medianas+ */}
        <div className={`${styles.fila} ${styles.encabezado}`}>
          <span className={styles.celdaDia}>Día</span>
          <span className={styles.celdaAbierto}>Abierto</span>
          <span className={styles.celdaHora}>Apertura</span>
          <span className={styles.celdaHora}>Cierre</span>
        </div>

        {DIAS.map(({ value: dia, label }) => {
          const h = horarios[dia];
          return (
            <div
              key={dia}
              className={`${styles.fila} ${!h.abierto ? styles.filaCerrada : ""}`}
            >
              <span className={styles.celdaDia}>{label}</span>

              <span className={styles.celdaAbierto}>
                <label className={styles.toggleWrap}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={h.abierto}
                    onChange={(e) => actualizarDia(dia, "abierto", e.target.checked)}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </span>

              <span className={styles.celdaHora}>
                <span className={styles.celdaLabel}>Apertura</span>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={h.apertura}
                  disabled={!h.abierto}
                  onChange={(e) => actualizarDia(dia, "apertura", e.target.value)}
                />
              </span>

              <span className={styles.celdaHora}>
                <span className={styles.celdaLabel}>Cierre</span>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={h.cierre}
                  disabled={!h.abierto}
                  onChange={(e) => actualizarDia(dia, "cierre", e.target.value)}
                />
              </span>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <p className={feedback.tipo === "ok" ? styles.feedbackOk : styles.feedbackError}>
          {feedback.mensaje}
        </p>
      )}

      {/* Guardar */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.saveBtn}
          disabled={isPending}
          onClick={handleGuardar}
        >
          {isPending ? "Guardando..." : "Guardar horarios"}
        </button>
      </div>
    </div>
  );
}
