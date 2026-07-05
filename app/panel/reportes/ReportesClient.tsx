"use client";

import { useState, useTransition } from "react";

// ── Upsell constants (same content as SuscribeteModal) ───────────────────────

const NUMERO_CONTACTO = "7731339934";

const PLANES = [
  {
    nombre: "Plan Gratis",
    precio: null,
    descripcion:
      "Empieza sin compromiso. Crea tu menú interactivo con hasta 10 platillos, genera tu código QR y compártelo con tus clientes. Recibe pedidos directo por WhatsApp, sin complicaciones.",
  },
  {
    nombre: "Plan 1 Sucursal",
    precio: "$200/mes",
    descripcion:
      "Lleva tu restaurante al siguiente nivel. Agrega todos los platillos que quieras, crea promociones y avisos para tus clientes, y mantente al día con reportes de tus ventas e ingresos.",
  },
  {
    nombre: "Plan Multi Sucursal",
    precio: "$300/mes",
    descripcion:
      "Para restaurantes en expansión. Administra todas tus sucursales desde un solo lugar, con menú ilimitado, promociones, avisos y reportes de ventas e ingresos por cada sucursal.",
  },
];

// ── Upsell component ─────────────────────────────────────────────────────────
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import styles from "./Reportes.module.css";
import {
  obtenerReportePedidos,
  obtenerReporteVentas,
  obtenerReportePlatillos,
  obtenerReporteQR,
} from "@/app/lib/actions/reportes";
import type { DatoPedidos, DatoVentas, DatoPlatillo } from "@/app/lib/actions/reportes";

// ── Types ────────────────────────────────────────────────────────────────────

type TipoReporte = "pedidos" | "ventas" | "platillos" | "qr";
type Periodo = 7 | 30;

const REPORTE_LABEL: Record<TipoReporte, string> = {
  pedidos: "Pedidos por día",
  ventas: "Ventas por día",
  platillos: "Platillos más vendidos",
  qr: "Lectura de QR",
};

// ── Chart constants ──────────────────────────────────────────────────────────

const GOLD = "#F2B84B";
const AMBER = "#E8981D";
const SAND = "#B5A98A";
const CREAM = "#F5EFE4";
const GRID = "rgba(245,239,228,0.07)";
const FONT = "var(--font-sans)";

// ── Custom tooltips ──────────────────────────────────────────────────────────

function TooltipPedidos({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipFecha}>{label}</p>
      <p className={styles.tooltipValor}>{payload[0].value} pedidos</p>
    </div>
  );
}

function TooltipVentas({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipFecha}>{label}</p>
      <p className={styles.tooltipValor}>${Number(payload[0].value).toFixed(2)}</p>
    </div>
  );
}

function TooltipPlatillos({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipFecha}>{label}</p>
      <p className={styles.tooltipValor}>{payload[0].value} vendidos</p>
    </div>
  );
}

// Tick personalizado para truncar nombres largos en gráfica de platillos
function PlatilloTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const name = payload?.value ?? "";
  const display = name.length > 20 ? name.slice(0, 20) + "…" : name;
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill={CREAM}
      fontSize={12}
      fontFamily={FONT}
    >
      {display}
    </text>
  );
}

function UpsellReportes() {
  const [contactando, setContactando] = useState(false);
  const [comentario, setComentario] = useState("");

  function handleContactar() {
    if (!contactando) {
      setContactando(true);
      return;
    }
    if (!comentario.trim()) return;
    const phone = `52${NUMERO_CONTACTO.replace(/\D/g, "")}`;
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(comentario.trim())}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div className={styles.upsellCard}>
      <p className={styles.upsellMensaje}>
        Para ver los reportes de tus ventas, pedidos y más, suscríbete
      </p>
      <p className={styles.upsellSub}>Elige el plan ideal para tu restaurante</p>

      <div className={styles.upsellPlanes}>
        {PLANES.map((plan) => (
          <div key={plan.nombre} className={styles.upsellPlan}>
            <p className={styles.upsellPlanNombre}>
              {plan.nombre}
              {plan.precio && (
                <span className={styles.upsellPlanPrecio}> — {plan.precio}</span>
              )}
            </p>
            <p className={styles.upsellPlanDesc}>{plan.descripcion}</p>
          </div>
        ))}
      </div>

      {contactando && (
        <textarea
          className={styles.upsellTextarea}
          placeholder="Escribe tu comentario..."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          autoFocus
          rows={3}
        />
      )}

      <div className={styles.upsellFooter}>
        <button
          type="button"
          className={styles.upsellBtn}
          onClick={handleContactar}
          disabled={contactando && !comentario.trim()}
        >
          {contactando ? "Enviar" : "Contáctanos"}
        </button>
      </div>
    </div>
  );
}

// ── Empty state icon ─────────────────────────────────────────────────────────

function QrStatIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h2v2h-2zM18 14h3M14 18h2M18 18h3v3M14 21h3" />
      <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M18.5 8l-5 5-4-4-3 3" />
    </svg>
  );
}

// ── Período toggle ────────────────────────────────────────────────────────────

function PeriodoToggle({ periodo, onChange, disabled }: {
  periodo: Periodo;
  onChange: (p: Periodo) => void;
  disabled: boolean;
}) {
  return (
    <div className={styles.periodoGroup} role="group" aria-label="Período">
      <button
        type="button"
        className={`${styles.periodoBtn} ${periodo === 7 ? styles.periodoBtnActive : ""}`}
        onClick={() => onChange(7)}
        disabled={disabled}
        aria-pressed={periodo === 7}
      >
        Semana
      </button>
      <button
        type="button"
        className={`${styles.periodoBtn} ${periodo === 30 ? styles.periodoBtnActive : ""}`}
        onClick={() => onChange(30)}
        disabled={disabled}
        aria-pressed={periodo === 30}
      >
        Mes
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReportesClient({ esGratis }: { esGratis: boolean }) {
  const [tipo, setTipo] = useState<TipoReporte | "">("");
  const [periodo, setPeriodo] = useState<Periodo>(7);

  const [datosPedidos, setDatosPedidos] = useState<DatoPedidos[] | null>(null);
  const [datosVentas, setDatosVentas] = useState<DatoVentas[] | null>(null);
  const [datosPlatillos, setDatosPlatillos] = useState<DatoPlatillo[] | null>(null);
  const [escaneos, setEscaneos] = useState<number | null>(null);

  const [cargando, startCarga] = useTransition();
  const [error, setError] = useState("");

  function fetchDatos(t: TipoReporte, p: Periodo) {
    if (t === "qr") return;
    setError("");
    startCarga(async () => {
      if (t === "pedidos") {
        const res = await obtenerReportePedidos(p);
        if ("ok" in res) setDatosPedidos(res.datos);
        else setError(res.error);
      } else if (t === "ventas") {
        const res = await obtenerReporteVentas(p);
        if ("ok" in res) setDatosVentas(res.datos);
        else setError(res.error);
      } else {
        const res = await obtenerReportePlatillos(p);
        if ("ok" in res) setDatosPlatillos(res.datos);
        else setError(res.error);
      }
    });
  }

  function handleTipo(t: TipoReporte | "") {
    setTipo(t);
    setDatosPedidos(null);
    setDatosVentas(null);
    setDatosPlatillos(null);
    setEscaneos(null);
    setError("");
    if (!t) return;
    if (t === "qr") {
      startCarga(async () => {
        const res = await obtenerReporteQR();
        if ("ok" in res) setEscaneos(res.escaneos);
        else setError(res.error);
      });
      return;
    }
    fetchDatos(t, periodo);
  }

  function handlePeriodo(p: Periodo) {
    setPeriodo(p);
    if (tipo && tipo !== "qr") fetchDatos(tipo, p);
  }

  // datos actuales según tipo seleccionado
  const datosActuales =
    tipo === "pedidos" ? datosPedidos
    : tipo === "ventas" ? datosVentas
    : tipo === "platillos" ? datosPlatillos
    : null;

  const xInterval = periodo === 30 ? 4 : 0;

  if (esGratis) {
    return (
      <>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Reportes</h1>
          <p className={styles.pageSubtitle}>Analiza el desempeño de tu restaurante</p>
        </div>
        <UpsellReportes />
      </>
    );
  }

  return (
    <>
      {/* ── Encabezado ── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Reportes</h1>
        <p className={styles.pageSubtitle}>Analiza el desempeño de tu restaurante</p>
      </div>

      {/* ── Selector de reporte ── */}
      <div className={styles.selectorWrap}>
        <label className={styles.selectorLabel} htmlFor="tipo-reporte">
          Tipo de reporte
        </label>
        <select
          id="tipo-reporte"
          className={styles.selectorSelect}
          value={tipo}
          onChange={(e) => handleTipo(e.target.value as TipoReporte | "")}
        >
          <option value="">Selecciona un reporte…</option>
          <option value="pedidos">Pedidos</option>
          <option value="ventas">Ventas</option>
          <option value="platillos">Platillos más vendidos</option>
          <option value="qr">Lectura de QR</option>
        </select>
      </div>

      {/* ── Estado vacío ── */}
      {!tipo && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}><EmptyIcon /></span>
          <p className={styles.emptyTitle}>Selecciona un reporte</p>
          <p className={styles.emptyDesc}>
            Elige el tipo de reporte en el selector de arriba para visualizar los datos.
          </p>
        </div>
      )}

      {/* ── Sección QR ── */}
      {tipo === "qr" && (
        <div className={styles.chartSection}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Lectura de QR</h2>
          </div>

          {cargando && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} aria-hidden />
              <p>Cargando datos…</p>
            </div>
          )}

          {!cargando && error && (
            <p className={styles.errorState}>{error}</p>
          )}

          {!cargando && !error && escaneos !== null && (
            <div className={styles.qrStat}>
              <div className={styles.qrStatIcon} aria-hidden="true">
                <QrStatIcon />
              </div>
              <p className={styles.qrStatLabel}>
                El número de veces que ha sido escaneado el QR de tu restaurante es el siguiente:
              </p>
              <p className={styles.qrStatNum}>
                {escaneos.toLocaleString("es-MX")}
              </p>
              <p className={styles.qrStatUnit}>
                {escaneos === 1 ? "escaneo total" : "escaneos totales"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Sección de gráfica ── */}
      {tipo && tipo !== "qr" && (
        <div className={styles.chartSection}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>{REPORTE_LABEL[tipo]}</h2>
            <PeriodoToggle periodo={periodo} onChange={handlePeriodo} disabled={cargando} />
          </div>

          {/* Loading */}
          {cargando && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} aria-hidden />
              <p>Cargando datos…</p>
            </div>
          )}

          {/* Error */}
          {!cargando && error && (
            <p className={styles.errorState}>{error}</p>
          )}

          {/* Sin datos */}
          {!cargando && !error && datosActuales !== null && datosActuales.length === 0 && (
            <div className={styles.sinDatosState}>
              <p>Sin datos para el período seleccionado.</p>
            </div>
          )}

          {/* Gráficas */}
          {!cargando && !error && datosActuales !== null && datosActuales.length > 0 && (
            <div className={styles.chartWrap}>

              {/* Pedidos — BarChart */}
              {tipo === "pedidos" && datosPedidos && (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={datosPedidos} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis
                      dataKey="fecha"
                      tick={{ fill: SAND, fontSize: 11, fontFamily: FONT }}
                      axisLine={false}
                      tickLine={false}
                      interval={xInterval}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: SAND, fontSize: 11, fontFamily: FONT }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<TooltipPedidos />} cursor={{ fill: "rgba(242,184,75,0.06)" }} />
                    <Bar dataKey="pedidos" fill={GOLD} radius={[5, 5, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* Ventas — AreaChart */}
              {tipo === "ventas" && datosVentas && (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={datosVentas} margin={{ top: 8, right: 8, left: 16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={GOLD} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis
                      dataKey="fecha"
                      tick={{ fill: SAND, fontSize: 11, fontFamily: FONT }}
                      axisLine={false}
                      tickLine={false}
                      interval={xInterval}
                    />
                    <YAxis
                      tick={{ fill: SAND, fontSize: 11, fontFamily: FONT }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip content={<TooltipVentas />} cursor={{ stroke: "rgba(242,184,75,0.25)", strokeWidth: 1 }} />
                    <Area
                      type="monotone"
                      dataKey="monto"
                      stroke={GOLD}
                      strokeWidth={2}
                      fill="url(#gradVentas)"
                      dot={{ fill: GOLD, r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: GOLD, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {/* Platillos — Horizontal BarChart */}
              {tipo === "platillos" && datosPlatillos && (
                <div className={styles.platillosScroll}>
                  <div className={styles.platillosInner}>
                    <ResponsiveContainer
                      width="100%"
                      height={Math.max(260, datosPlatillos.length * 52 + 40)}
                    >
                      <BarChart
                        data={datosPlatillos}
                        layout="vertical"
                        margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{ fill: SAND, fontSize: 11, fontFamily: FONT }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="nombre"
                          width={150}
                          tick={<PlatilloTick />}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={<TooltipPlatillos />}
                          cursor={{ fill: "rgba(242,184,75,0.06)" }}
                        />
                        <Bar
                          dataKey="cantidad"
                          fill={AMBER}
                          radius={[0, 5, 5, 0]}
                          maxBarSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </>
  );
}
