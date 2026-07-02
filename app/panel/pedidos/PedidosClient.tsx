"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import styles from "./Pedidos.module.css";
import {
  obtenerPedidos,
  obtenerDetallePedido,
  cambiarEstadoPedido,
} from "@/app/lib/actions/pedidos";
import type { PedidoResumen, PedidoDetalle } from "@/app/lib/actions/pedidos";
import type { EstadoPedido } from "@/app/generated/prisma/enums";

const MapView = dynamic(() => import("@/app/explorar/[slug]/MapPickerMap"), {
  ssr: false,
  loading: () => <div className={styles.mapaLoading}>Cargando mapa…</div>,
});

// ── Labels ──────────────────────────────────────────────────────────────────

const ESTADO_LABEL: Record<EstadoPedido, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  EN_PREPARACION: "En preparación",
  EN_CAMINO: "En camino",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const TIPO_ENVIO_LABEL: Record<string, string> = {
  RECOGER_EN_SUCURSAL: "Recoger en sucursal",
  ENVIO_A_DOMICILIO: "Envío a domicilio",
  COMER_EN_LUGAR: "Comer en el lugar",
};

const TIPO_PAGO_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
};

const ESTADOS_SIGUIENTES: Record<EstadoPedido, EstadoPedido[]> = {
  PENDIENTE: ["CONFIRMADO", "CANCELADO"],
  CONFIRMADO: ["EN_PREPARACION", "CANCELADO"],
  EN_PREPARACION: ["EN_CAMINO", "LISTO", "CANCELADO"],
  EN_CAMINO: ["ENTREGADO", "CANCELADO"],
  LISTO: ["ENTREGADO", "CANCELADO"],
  ENTREGADO: [],
  CANCELADO: [],
};

const TODOS_ESTADOS: EstadoPedido[] = [
  "PENDIENTE",
  "CONFIRMADO",
  "EN_PREPARACION",
  "EN_CAMINO",
  "LISTO",
  "ENTREGADO",
  "CANCELADO",
];

// ── Icons ───────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function OrdersEmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function formatMonto(val: string) {
  return `$${Number(val).toFixed(2)}`;
}

// ── Estado Badge ─────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  return (
    <span className={`${styles.badge} ${styles[`badge_${estado}`]}`}>
      {ESTADO_LABEL[estado]}
    </span>
  );
}

// ── Modal detalle ─────────────────────────────────────────────────────────────

type ModalDetalleProps = {
  pedido: PedidoDetalle;
  onClose: () => void;
  onEstadoCambiado: (id: string, nuevoEstado: EstadoPedido) => void;
};

function ModalDetalle({ pedido, onClose, onEstadoCambiado }: ModalDetalleProps) {
  const router = useRouter();
  const siguientes = ESTADOS_SIGUIENTES[pedido.estado];
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoPedido | "">("");
  const [cambiando, startCambio] = useTransition();
  const [errorEstado, setErrorEstado] = useState("");
  const [mostrarMapa, setMostrarMapa] = useState(true);

  const tieneUbicacion =
    pedido.tipoEnvio === "ENVIO_A_DOMICILIO" &&
    pedido.latitud !== null &&
    pedido.longitud !== null;

  function handleCambiarEstado() {
    if (!estadoSeleccionado) return;
    setErrorEstado("");
    startCambio(async () => {
      const res = await cambiarEstadoPedido(pedido.id, estadoSeleccionado as EstadoPedido);
      if ("ok" in res) {
        onEstadoCambiado(pedido.id, estadoSeleccionado as EstadoPedido);
        router.refresh();
      } else {
        setErrorEstado(res.error);
      }
    });
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal
      aria-label={`Pedido #${pedido.folio}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal}>
        {/* ── Header ── */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <span className={styles.modalFolio}>Pedido #{pedido.folio}</span>
            <EstadoBadge estado={pedido.estado} />
          </div>
          <p className={styles.modalSubtitle}>
            {formatFecha(pedido.createdAt)} · {formatHora(pedido.createdAt)}
            {pedido.whatsappEnviado && (
              <span className={styles.waBadge}>
                <WhatsAppIcon /> Enviado
              </span>
            )}
          </p>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
            <CloseIcon />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* ── Info cliente y sucursal ── */}
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <p className={styles.infoLabel}>Cliente</p>
              <p className={styles.infoValue}>{pedido.clienteNombre}</p>
              <p className={styles.infoSub}>{pedido.clienteCelular}</p>
            </div>
            <div className={styles.infoCard}>
              <p className={styles.infoLabel}>Sucursal</p>
              <p className={styles.infoValue}>{pedido.sucursalNombre}</p>
              <p className={styles.infoSub}>WA: {pedido.sucursalWhatsApp}</p>
            </div>
            <div className={styles.infoCard}>
              <p className={styles.infoLabel}>Tipo de envío</p>
              <p className={styles.infoValue}>{TIPO_ENVIO_LABEL[pedido.tipoEnvio] ?? pedido.tipoEnvio}</p>
            </div>
            <div className={styles.infoCard}>
              <p className={styles.infoLabel}>Forma de pago</p>
              <p className={styles.infoValue}>{TIPO_PAGO_LABEL[pedido.tipoPago] ?? pedido.tipoPago}</p>
            </div>
          </div>

          {/* ── Dirección (si aplica) ── */}
          {pedido.direccionEntrega && (
            <div className={styles.direccionCard}>
              <p className={styles.infoLabel}>Dirección de entrega</p>
              <p className={styles.direccionText}>{pedido.direccionEntrega}</p>
              {pedido.telefonoContacto && (
                <p className={styles.infoSub}>Tel. contacto: {pedido.telefonoContacto}</p>
              )}
            </div>
          )}

          {/* ── Notas del pedido ── */}
          {pedido.descripcion && (
            <div className={styles.notasCard}>
              <p className={styles.infoLabel}>Notas del pedido</p>
              <p className={styles.notasText}>{pedido.descripcion}</p>
            </div>
          )}

          {/* ── Mapa de entrega ── */}
          {tieneUbicacion && (
            <div className={styles.mapaSection}>
              <div className={styles.mapaTitleRow}>
                <p className={styles.sectionTitle}>Ubicación de entrega</p>
                <button
                  type="button"
                  className={styles.mapaToggle}
                  onClick={() => setMostrarMapa((v) => !v)}
                >
                  {mostrarMapa ? "Ocultar mapa" : "Ver mapa"}
                </button>
              </div>
              {mostrarMapa && (
                <div className={styles.mapaWrap}>
                  <MapView
                    lat={pedido.latitud}
                    lng={pedido.longitud}
                    defaultCenter={[pedido.latitud!, pedido.longitud!]}
                    onSelect={() => {}}
                    disabled
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Platillos ── */}
          <div className={styles.itemsSection}>
            <p className={styles.sectionTitle}>Platillos</p>
            <div className={styles.itemsList}>
              {pedido.detalles.map((d) => (
                <div key={d.id} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemCantidad}>{d.cantidad}×</span>
                    <div>
                      <p className={styles.itemNombre}>{d.nombrePlatillo}</p>
                      {d.extras.length > 0 && (
                        <p className={styles.itemExtras}>
                          + {d.extras.map((e) => e.nombreExtra).join(", ")}
                        </p>
                      )}
                      {d.descripcion && (
                        <p className={styles.itemNota}>{d.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <span className={styles.itemTotal}>{formatMonto(d.costoTotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Totales ── */}
          <div className={styles.totalesSection}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>{formatMonto(pedido.subtotal)}</span>
            </div>
            {Number(pedido.costoEnvio) > 0 && (
              <div className={styles.totalRow}>
                <span>Envío</span>
                <span>{formatMonto(pedido.costoEnvio)}</span>
              </div>
            )}
            {Number(pedido.propina) > 0 && (
              <div className={styles.totalRow}>
                <span>Propina</span>
                <span>{formatMonto(pedido.propina)}</span>
              </div>
            )}
            <div className={`${styles.totalRow} ${styles.totalFinal}`}>
              <span>Total</span>
              <span>{formatMonto(pedido.costoTotal)}</span>
            </div>
          </div>

          {/* ── Cambiar estado ── */}
          {siguientes.length > 0 && (
            <div className={styles.cambiarEstadoSection}>
              <p className={styles.sectionTitle}>Cambiar estado</p>
              <div className={styles.cambiarEstadoRow}>
                <select
                  className={styles.estadoSelect}
                  value={estadoSeleccionado}
                  onChange={(e) => { setEstadoSeleccionado(e.target.value as EstadoPedido); setErrorEstado(""); }}
                  aria-label="Nuevo estado del pedido"
                >
                  <option value="">Seleccionar nuevo estado…</option>
                  {siguientes.map((s) => (
                    <option key={s} value={s}>{ESTADO_LABEL[s]}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.btnGuardar}
                  disabled={!estadoSeleccionado || cambiando}
                  onClick={handleCambiarEstado}
                >
                  {cambiando ? "Guardando…" : "Guardar"}
                </button>
              </div>
              {errorEstado && <p className={styles.errorMsg}>{errorEstado}</p>}
            </div>
          )}

          {siguientes.length === 0 && (
            <div className={styles.estadoFinalNote}>
              Este pedido está en estado final: <strong>{ESTADO_LABEL[pedido.estado]}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

type Props = {
  pedidosIniciales: PedidoResumen[];
  fechaInicial: string;
};

// ── Component principal ──────────────────────────────────────────────────────

export default function PedidosClient({ pedidosIniciales, fechaInicial }: Props) {
  const [pedidos, setPedidos] = useState<PedidoResumen[]>(pedidosIniciales);
  const [fecha, setFecha] = useState(fechaInicial);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoPedido | "TODOS">("TODOS");
  const [buscando, startBusqueda] = useTransition();

  const [pedidoDetalle, setPedidoDetalle] = useState<PedidoDetalle | null>(null);
  const [cargandoDetalle, startDetalle] = useTransition();
  const [errorDetalle, setErrorDetalle] = useState("");

  const pedidosFiltrados = useMemo(() => {
    if (estadoFiltro === "TODOS") return pedidos;
    return pedidos.filter((p) => p.estado === estadoFiltro);
  }, [pedidos, estadoFiltro]);

  // Contadores por estado
  const contadores = useMemo(() => {
    const counts: Partial<Record<EstadoPedido, number>> = {};
    for (const p of pedidos) {
      counts[p.estado] = (counts[p.estado] ?? 0) + 1;
    }
    return counts;
  }, [pedidos]);

  function buscarPedidos() {
    startBusqueda(async () => {
      const res = await obtenerPedidos(fecha);
      if ("ok" in res) setPedidos(res.pedidos);
    });
  }

  function abrirDetalle(pedidoId: string) {
    setErrorDetalle("");
    setPedidoDetalle(null);
    startDetalle(async () => {
      const res = await obtenerDetallePedido(pedidoId);
      if ("ok" in res) {
        setPedidoDetalle(res.pedido);
      } else {
        setErrorDetalle(res.error);
      }
    });
  }

  function handleEstadoCambiado(id: string, nuevoEstado: EstadoPedido) {
    // Actualiza el estado en la lista y en el modal
    setPedidos((prev) => prev.map((p) => p.id === id ? { ...p, estado: nuevoEstado } : p));
    setPedidoDetalle((prev) => prev ? { ...prev, estado: nuevoEstado } : prev);
  }

  return (
    <>
      {/* ── Encabezado de página ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Ver pedidos</h1>
          <p className={styles.pageSubtitle}>Consulta y gestiona los pedidos de tu restaurante</p>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="filtro-fecha">Fecha</label>
          <input
            id="filtro-fecha"
            type="date"
            className={styles.filterInput}
            value={fecha}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setFecha(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") buscarPedidos(); }}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="filtro-estado">Estado</label>
          <select
            id="filtro-estado"
            className={styles.filterSelect}
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value as EstadoPedido | "TODOS")}
          >
            <option value="TODOS">Todos los estados</option>
            {TODOS_ESTADOS.map((e) => (
              <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className={styles.btnBuscar}
          disabled={buscando}
          onClick={buscarPedidos}
        >
          {buscando ? "Buscando…" : "Buscar"}
        </button>
      </div>

      {/* ── Chips de contadores ── */}
      {pedidos.length > 0 && (
        <div className={styles.statsRow}>
          <button
            type="button"
            className={`${styles.statChip} ${estadoFiltro === "TODOS" ? styles.statChipActive : ""}`}
            onClick={() => setEstadoFiltro("TODOS")}
          >
            <span className={styles.statNum}>{pedidos.length}</span>
            <span className={styles.statLbl}>Total</span>
          </button>
          {TODOS_ESTADOS.filter((e) => contadores[e]).map((e) => (
            <button
              key={e}
              type="button"
              className={`${styles.statChip} ${styles[`statChip_${e}`]} ${estadoFiltro === e ? styles.statChipActive : ""}`}
              onClick={() => setEstadoFiltro(e)}
            >
              <span className={styles.statNum}>{contadores[e]}</span>
              <span className={styles.statLbl}>{ESTADO_LABEL[e]}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Tabla ── */}
      {buscando ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} aria-hidden="true" />
          <p>Cargando pedidos…</p>
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}><OrdersEmptyIcon /></span>
          <p className={styles.emptyTitle}>
            {pedidos.length === 0 ? "Sin pedidos para esta fecha" : "Sin pedidos con este filtro"}
          </p>
          <p className={styles.emptyDesc}>
            {pedidos.length === 0
              ? "No se encontraron pedidos para el día seleccionado."
              : "Prueba seleccionando otro estado o mostrando todos."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Folio</th>
                  <th className={styles.th}>Cliente</th>
                  <th className={styles.th}>Hora</th>
                  <th className={styles.th}>Sucursal</th>
                  <th className={styles.th}>Tipo</th>
                  <th className={styles.th}>Estado</th>
                  <th className={styles.th + " " + styles.thRight}>Total</th>
                  <th className={styles.th} aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map((p) => (
                  <tr
                    key={p.id}
                    className={styles.tr}
                    onClick={() => abrirDetalle(p.id)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") abrirDetalle(p.id); }}
                    role="button"
                    aria-label={`Ver pedido #${p.folio}`}
                  >
                    <td className={styles.td}>
                      <span className={styles.folioNum}>#{p.folio}</span>
                    </td>
                    <td className={styles.td}>
                      <p className={styles.clienteNombre}>{p.clienteNombre}</p>
                      <p className={styles.clienteCelular}>{p.clienteCelular}</p>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.hora}>{formatHora(p.createdAt)}</span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.sucursalNombre}>{p.sucursalNombre}</span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.tipoChip}>
                        {p.tipoEnvio === "ENVIO_A_DOMICILIO" ? "Domicilio"
                          : p.tipoEnvio === "RECOGER_EN_SUCURSAL" ? "Recoger"
                          : "En lugar"}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <EstadoBadge estado={p.estado} />
                    </td>
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      <span className={styles.montoTotal}>{formatMonto(p.costoTotal)}</span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.verBtn} aria-hidden="true">
                        <ChevronIcon />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className={styles.cardsList}>
            {pedidosFiltrados.map((p) => (
              <button
                key={p.id}
                type="button"
                className={styles.pedidoCard}
                onClick={() => abrirDetalle(p.id)}
              >
                <div className={styles.cardTop}>
                  <span className={styles.folioNum}>#{p.folio}</span>
                  <EstadoBadge estado={p.estado} />
                </div>
                <div className={styles.cardMid}>
                  <p className={styles.clienteNombre}>{p.clienteNombre}</p>
                  <p className={styles.clienteCelular}>{p.clienteCelular}</p>
                </div>
                <div className={styles.cardBot}>
                  <span className={styles.hora}>{formatHora(p.createdAt)}</span>
                  <span className={styles.tipoChip}>
                    {p.tipoEnvio === "ENVIO_A_DOMICILIO" ? "Domicilio"
                      : p.tipoEnvio === "RECOGER_EN_SUCURSAL" ? "Recoger"
                      : "En lugar"}
                  </span>
                  <span className={styles.montoTotal}>{formatMonto(p.costoTotal)}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Error detalle ── */}
      {errorDetalle && (
        <div className={styles.errorToast} role="alert">
          {errorDetalle}
          <button type="button" onClick={() => setErrorDetalle("")} aria-label="Cerrar">
            <CloseIcon />
          </button>
        </div>
      )}

      {/* ── Loading detalle (overlay ligero) ── */}
      {cargandoDetalle && !pedidoDetalle && (
        <div className={styles.overlay} aria-busy>
          <div className={styles.loadingModal}>
            <div className={styles.spinner} aria-hidden="true" />
            <p>Cargando detalle…</p>
          </div>
        </div>
      )}

      {/* ── Modal detalle ── */}
      {pedidoDetalle && (
        <ModalDetalle
          pedido={pedidoDetalle}
          onClose={() => setPedidoDetalle(null)}
          onEstadoCambiado={handleEstadoCambiado}
        />
      )}
    </>
  );
}
