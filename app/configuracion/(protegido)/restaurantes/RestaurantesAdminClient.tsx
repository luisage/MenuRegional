"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleRestauranteActivo, actualizarPlanRestaurante, registrarPago } from "@/app/lib/actions/admin";
import styles from "./Restaurantes.module.css";

export type RestauranteAdminVista = {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean;
  sucursales: number;
  dueno: string;
  contacto: string;
  planId: string | null;
  planNombre: string | null;
};

export type PlanOpcion = {
  id: string;
  nombre: string;
};

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function RestaurantesAdminClient({
  restaurantes,
  planes,
}: {
  restaurantes: RestauranteAdminVista[];
  planes: PlanOpcion[];
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [modalEstatus, setModalEstatus] = useState<RestauranteAdminVista | null>(null);
  const [modalPlan, setModalPlan] = useState<RestauranteAdminVista | null>(null);
  const [planSeleccionado, setPlanSeleccionado] = useState("");
  const [modalPago, setModalPago] = useState<RestauranteAdminVista | null>(null);
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [pagoFeedback, setPagoFeedback] = useState<{ tipo: "ok" | "error"; mensaje: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleMenu(id: string, boton: HTMLButtonElement) {
    if (menuAbiertoId === id) {
      setMenuAbiertoId(null);
      return;
    }
    const rect = boton.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 6, left: rect.right - 160 });
    setMenuAbiertoId(id);
  }

  const restaurantesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return restaurantes;
    return restaurantes.filter((r) => r.nombre.toLowerCase().includes(q));
  }, [restaurantes, busqueda]);

  function abrirModalEstatus(r: RestauranteAdminVista) {
    setMenuAbiertoId(null);
    setModalEstatus(r);
  }

  function abrirModalPlan(r: RestauranteAdminVista) {
    setMenuAbiertoId(null);
    setPlanSeleccionado(r.planId ?? "");
    setModalPlan(r);
  }

  function abrirModalPago(r: RestauranteAdminVista) {
    setMenuAbiertoId(null);
    setMonto("");
    setMetodoPago("");
    setPagoFeedback(null);
    setModalPago(r);
  }

  function cerrarModalPago() {
    setModalPago(null);
    setPagoFeedback(null);
  }

  function handleToggleEstatus() {
    if (!modalEstatus) return;
    startTransition(async () => {
      await toggleRestauranteActivo(modalEstatus.id);
      setModalEstatus(null);
      router.refresh();
    });
  }

  function handleGuardarPlan() {
    if (!modalPlan) return;
    startTransition(async () => {
      await actualizarPlanRestaurante(modalPlan.id, planSeleccionado || null);
      setModalPlan(null);
      router.refresh();
    });
  }

  function handleRegistrarPago() {
    if (!modalPago) return;
    setPagoFeedback(null);

    const fd = new FormData();
    fd.set("monto", monto);
    fd.set("metodoPago", metodoPago);

    startTransition(async () => {
      const result = await registrarPago(modalPago.id, fd);
      if ("ok" in result) {
        cerrarModalPago();
        router.refresh();
      } else {
        setPagoFeedback({ tipo: "error", mensaje: result.error });
      }
    });
  }

  return (
    <div>
      <div className={styles.buscadorWrap}>
        <span className={styles.buscadorIcono} aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          type="text"
          className={styles.buscadorInput}
          placeholder="Busca un restaurante por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar restaurante por nombre"
        />
      </div>

      {restaurantes.length === 0 ? (
        <p className={styles.empty}>Aún no hay restaurantes registrados.</p>
      ) : restaurantesFiltrados.length === 0 ? (
        <p className={styles.empty}>No encontramos restaurantes que coincidan con &ldquo;{busqueda}&rdquo;.</p>
      ) : (
        <div className={styles.tabla}>
          <div className={`${styles.fila} ${styles.encabezado}`}>
            <span>Restaurante</span>
            <span>Dueño</span>
            <span>Contacto</span>
            <span>Sucursales</span>
            <span>Plan</span>
            <span>Estado</span>
            <span />
          </div>

          {restaurantesFiltrados.map((r) => (
            <div key={r.id} className={styles.fila}>
              <span className={styles.nombre}>{r.nombre}</span>
              <span>{r.dueno}</span>
              <span>{r.contacto}</span>
              <span>{r.sucursales}</span>
              <span>{r.planNombre ?? "Sin plan"}</span>
              <span>
                <span className={`${styles.badge} ${r.activo ? styles.badgeActivo : styles.badgeInactivo}`}>
                  {r.activo ? "Activo" : "Inactivo"}
                </span>
              </span>
              <span className={styles.menuWrap}>
                <button
                  type="button"
                  className={styles.menuBtn}
                  aria-label={`Más opciones para ${r.nombre}`}
                  aria-haspopup="menu"
                  aria-expanded={menuAbiertoId === r.id}
                  onClick={(e) => toggleMenu(r.id, e.currentTarget)}
                >
                  <DotsIcon />
                </button>

                {menuAbiertoId === r.id && menuPos && (
                  <>
                    <div className={styles.menuBackdrop} onClick={() => setMenuAbiertoId(null)} />
                    <div
                      className={styles.menuDropdown}
                      role="menu"
                      style={{ top: menuPos.top, left: menuPos.left }}
                    >
                      <button type="button" role="menuitem" className={styles.menuItem} onClick={() => abrirModalPlan(r)}>
                        Plan
                      </button>
                      <button type="button" role="menuitem" className={styles.menuItem} onClick={() => abrirModalEstatus(r)}>
                        Estatus
                      </button>
                      <button type="button" role="menuitem" className={styles.menuItem} onClick={() => abrirModalPago(r)}>
                        Registrar pago
                      </button>
                    </div>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: Estatus ── */}
      {modalEstatus && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={`Estatus de ${modalEstatus.nombre}`}
          onClick={(e) => { if (e.target === e.currentTarget) setModalEstatus(null); }}
        >
          <div className={styles.modalPanel}>
            <h3 className={styles.modalTitle}>Estatus de {modalEstatus.nombre}</h3>
            <p className={styles.modalText}>
              Estado actual:{" "}
              <span className={`${styles.badge} ${modalEstatus.activo ? styles.badgeActivo : styles.badgeInactivo}`}>
                {modalEstatus.activo ? "Activo" : "Inactivo"}
              </span>
            </p>
            <p className={styles.modalHint}>
              {modalEstatus.activo
                ? "Si lo desactivas, dejará de mostrarse a los clientes en Explorar."
                : "Si lo activas, volverá a mostrarse a los clientes en Explorar."}
            </p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setModalEstatus(null)}>
                Cancelar
              </button>
              <button type="button" className={styles.saveBtn} disabled={isPending} onClick={handleToggleEstatus}>
                {isPending ? "Guardando..." : modalEstatus.activo ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Plan ── */}
      {modalPlan && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={`Plan de ${modalPlan.nombre}`}
          onClick={(e) => { if (e.target === e.currentTarget) setModalPlan(null); }}
        >
          <div className={styles.modalPanel}>
            <h3 className={styles.modalTitle}>Plan de {modalPlan.nombre}</h3>

            {planes.length === 0 ? (
              <p className={styles.modalHint}>Todavía no hay planes configurados en la plataforma.</p>
            ) : (
              <div className={styles.modalField}>
                <label className={styles.modalLabel} htmlFor="plan-select">
                  Selecciona un plan
                </label>
                <select
                  id="plan-select"
                  className={styles.modalSelect}
                  value={planSeleccionado}
                  onChange={(e) => setPlanSeleccionado(e.target.value)}
                >
                  <option value="">Sin plan</option>
                  {planes.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setModalPlan(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className={styles.saveBtn}
                disabled={isPending || planes.length === 0}
                onClick={handleGuardarPlan}
              >
                {isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Registrar pago ── */}
      {modalPago && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={`Registrar pago de ${modalPago.nombre}`}
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModalPago(); }}
        >
          <div className={styles.modalPanel}>
            <h3 className={styles.modalTitle}>Registrar pago de {modalPago.nombre}</h3>

            <div className={styles.modalField}>
              <label className={styles.modalLabel} htmlFor="pago-monto">
                Monto
              </label>
              <input
                id="pago-monto"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className={styles.modalInput}
                value={monto}
                onChange={(e) => { setMonto(e.target.value); setPagoFeedback(null); }}
              />
            </div>

            <div className={styles.modalField}>
              <label className={styles.modalLabel} htmlFor="pago-metodo">
                Método de pago (opcional)
              </label>
              <select
                id="pago-metodo"
                className={styles.modalSelect}
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
              >
                <option value="">Sin especificar</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>

            <p className={styles.modalHint}>
              La fecha de vencimiento de este pago se registrará automáticamente un mes después de hoy.
            </p>

            {pagoFeedback && (
              <p className={pagoFeedback.tipo === "ok" ? styles.modalText : styles.modalError}>
                {pagoFeedback.mensaje}
              </p>
            )}

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={cerrarModalPago}>
                Cancelar
              </button>
              <button type="button" className={styles.saveBtn} disabled={isPending} onClick={handleRegistrarPago}>
                {isPending ? "Guardando..." : "Registrar pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
