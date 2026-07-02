"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { CuentaClienteVista, SucursalVista } from "./page";
import styles from "./Carrito.module.css";
import { crearPedido } from "@/app/lib/actions/crearPedido";
import type { ItemPedidoInput } from "@/app/lib/actions/crearPedido";

const MapPickerMap = dynamic(() => import("./MapPickerMap"), {
  ssr: false,
  loading: () => <div className={styles.mapaLoading}>Cargando mapa…</div>,
});

// ── Icons ──────────────────────────────────────────────────────────────
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function PlusControlIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.554 4.106 1.527 5.832L.057 23.929l6.235-1.635A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.881 9.881 0 0 1-5.03-1.371l-.361-.214-3.702.971.988-3.607-.235-.373A9.898 9.898 0 0 1 2.106 12c0-5.455 4.439-9.894 9.894-9.894 5.455 0 9.894 4.439 9.894 9.894 0 5.455-4.439 9.894-9.894 9.894z" />
    </svg>
  );
}

// ── Types (mirror of RestauranteMenuClient) ────────────────────────────
export type ItemCarrito = {
  uid: string; // platilloId + sorted config — unique per distinct combination
  platilloId: string;
  nombre: string;
  costoBase: number;
  costoTotal: number;
  cantidad: number;
  imagenUrl: string | null;
  ingredientesQuitados: string[];
  extrasAgregados: { id: string; nombre: string; costo: number }[];
};

type TipoPago = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA";
type TipoEnvio = "RECOGER_EN_SUCURSAL" | "ENVIO_A_DOMICILIO" | "COMER_EN_LUGAR";

const TIPO_PAGO_LABEL: Record<TipoPago, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia bancaria",
  TARJETA: "Tarjeta con terminal",
};

const TIPO_ENVIO_LABEL: Record<TipoEnvio, string> = {
  RECOGER_EN_SUCURSAL: "Recoger en sucursal",
  ENVIO_A_DOMICILIO: "Envío a domicilio",
  COMER_EN_LUGAR: "Comer en el lugar",
};

// Atitalaquia, Hidalgo, México
const ATITALAQUIA: [number, number] = [20.0731, -99.2147];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Component ──────────────────────────────────────────────────────────
export default function CarritoScreen({
  carrito,
  restauranteNombre,
  sucursal,
  cuentaCliente,
  onClose,
  onIncrementar,
  onDecrementar,
}: {
  carrito: ItemCarrito[];
  restauranteNombre: string;
  sucursal: SucursalVista;
  cuentaCliente: CuentaClienteVista | null;
  onClose: () => void;
  onIncrementar: (uid: string) => void;
  onDecrementar: (uid: string) => void;
}) {
  const [tipoPago, setTipoPago] = useState<TipoPago>("EFECTIVO");
  const [tipoEnvio, setTipoEnvio] = useState<TipoEnvio | "">("");

  // Location state — pre-filled with account coords if available
  const [lat, setLat] = useState<number | null>(cuentaCliente?.latitud ?? null);
  const [lng, setLng] = useState<number | null>(cuentaCliente?.longitud ?? null);

  // Pre-filled from account when logged in
  const [nombrePedido, setNombrePedido] = useState(cuentaCliente?.nombre ?? "");
  const [celularPedido, setCelularPedido] = useState(cuentaCliente?.celular ?? "");

  const [observaciones, setObservaciones] = useState("");
  const [propina, setPropina] = useState<number>(0);
  const [propinaStr, setPropinaStr] = useState("0");

  const [enviado, setEnviado] = useState(false);
  const [conteoEnvios, setConteoEnvios] = useState(0);
  const [errorUbicacion, setErrorUbicacion] = useState(false);
  const [errorNombre, setErrorNombre] = useState(false);
  const [errorCelular, setErrorCelular] = useState(false);
  const [errorTipoEnvio, setErrorTipoEnvio] = useState(false);

  const nombreRef = useRef<HTMLInputElement>(null);
  const celularRef = useRef<HTMLInputElement>(null);
  const tipoEnvioRef = useRef<HTMLSelectElement>(null);
  const exitoRef = useRef<HTMLDivElement>(null);

  const [guardando, startGuardar] = useTransition();
  const [errorGuardando, setErrorGuardando] = useState("");

  useEffect(() => {
    if (enviado) {
      exitoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [enviado]);

  // ── Computed ─────────────────────────────────────────────────────────
  const subtotal = carrito.reduce((sum, item) => sum + item.costoTotal * item.cantidad, 0);
  const costoEnvioAplicado =
    tipoEnvio === "ENVIO_A_DOMICILIO" && sucursal.envioDomicilio && sucursal.costoEnvio
      ? parseFloat(sucursal.costoEnvio)
      : 0;
  const total = subtotal + costoEnvioAplicado + propina;

  const mapDefaultCenter: [number, number] =
    cuentaCliente?.latitud != null && cuentaCliente?.longitud != null
      ? [cuentaCliente.latitud, cuentaCliente.longitud]
      : ATITALAQUIA;

  const fueraDeRango: boolean = (() => {
    if (tipoEnvio !== "ENVIO_A_DOMICILIO") return false;
    if (lat === null || lng === null) return false;
    if (!sucursal.rangoEnvio || sucursal.latitud === null || sucursal.longitud === null) return false;
    const rango = parseFloat(sucursal.rangoEnvio);
    if (isNaN(rango) || rango <= 0) return false;
    return haversineKm(lat, lng, sucursal.latitud, sucursal.longitud) > rango;
  })();

  // ── WhatsApp message builder ──────────────────────────────────────────
  const construirMensaje = () => {
    let msg = `\u{1F37D}️ *Nuevo pedido — Menú Regional*\n\n`;
    msg += `*Restaurante:* ${restauranteNombre}\n`;
    if (nombrePedido.trim()) msg += `*Cliente:* ${nombrePedido.trim()}\n`;
    if (celularPedido.trim()) msg += `*Celular:* ${celularPedido.trim()}\n`;
    msg += `\n`;
    msg += `\u{1F6D2} *Platillos:*\n`;

    for (const item of carrito) {
      msg += `• ${item.cantidad}x ${item.nombre} — $${(item.costoTotal * item.cantidad).toFixed(2)}\n`;
      if (item.ingredientesQuitados.length > 0) {
        msg += `  Sin: ${item.ingredientesQuitados.join(", ")}\n`;
      }
      if (item.extrasAgregados.length > 0) {
        const extrasTexto = item.extrasAgregados
          .map((e) => `${e.nombre} (+$${e.costo.toFixed(2)})`)
          .join(", ");
        msg += `  + ${extrasTexto}\n`;
      }
    }

    msg += `\n\u{1F4B3} *Método de pago:* ${TIPO_PAGO_LABEL[tipoPago]}\n`;
    msg += `\u{1F697} *Tipo de envío:* ${tipoEnvio ? TIPO_ENVIO_LABEL[tipoEnvio as TipoEnvio] : "—"}\n`;

    if (tipoEnvio === "ENVIO_A_DOMICILIO" && lat !== null && lng !== null) {
      msg += `\u{1F4CD} *Ubicación:* https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}\n`;
    }

    if (observaciones.trim()) {
      msg += `\n*Observaciones:* ${observaciones.trim()}\n`;
    }

    msg += `\n*Subtotal:* $${subtotal.toFixed(2)}\n`;
    if (costoEnvioAplicado > 0) {
      msg += `*Costo de envío:* $${costoEnvioAplicado.toFixed(2)}\n`;
    }
    if (propina > 0) {
      msg += `*Propina:* $${propina.toFixed(2)}\n`;
    }
    msg += `*Total a pagar:* $${total.toFixed(2)}`;

    return msg;
  };

  // ── Build pedido input for server action ─────────────────────────────
  const buildPedidoInput = () => {
    const items: ItemPedidoInput[] = carrito.map((item) => ({
      platilloId: item.platilloId,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precioUnitario: item.costoBase,
      costoTotal: item.costoTotal * item.cantidad,
      descripcion: item.ingredientesQuitados.length > 0
        ? `Sin: ${item.ingredientesQuitados.join(", ")}`
        : null,
      extras: item.extrasAgregados.map((e) => ({
        extraId: e.id,
        nombre: e.nombre,
        costo: e.costo,
      })),
    }));

    return {
      sucursalId: sucursal.id,
      tipoPago,
      tipoEnvio: tipoEnvio as TipoEnvio,
      subtotal,
      costoEnvio: costoEnvioAplicado,
      propina,
      costoTotal: total,
      descripcion: observaciones.trim() || null,
      latitud: lat,
      longitud: lng,
      telefonoContacto: celularPedido.trim() || null,
      nombreCliente: nombrePedido.trim() || null,
      items,
    };
  };

  // ── Send to WhatsApp ──────────────────────────────────────────────────
  const enviarPorWhatsApp = () => {
    const esPrimerEnvio = conteoEnvios === 0;

    // Validar solo en el primer envío
    if (esPrimerEnvio) {
      let primerErrorEl: HTMLElement | null = null;
      let hayError = false;

      const marcarError = (setter: (v: boolean) => void, el: HTMLElement | null) => {
        setter(true);
        if (!primerErrorEl) primerErrorEl = el;
        hayError = true;
      };

      if (!nombrePedido.trim()) {
        marcarError(setErrorNombre, nombreRef.current);
      } else {
        setErrorNombre(false);
      }

      if (!celularPedido.trim()) {
        marcarError(setErrorCelular, celularRef.current);
      } else {
        setErrorCelular(false);
      }

      if (!tipoEnvio) {
        marcarError(setErrorTipoEnvio, tipoEnvioRef.current);
      } else {
        setErrorTipoEnvio(false);
      }

      if (tipoEnvio === "ENVIO_A_DOMICILIO" && (lat === null || lng === null)) {
        setErrorUbicacion(true);
        hayError = true;
      } else {
        setErrorUbicacion(false);
      }

      if (hayError) {
        (primerErrorEl as HTMLElement | null)?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }

    // Abrir WhatsApp de forma síncrona (evita bloqueo de popups)
    const rawPhone = sucursal.telefonoWhatsApp.replace(/\D/g, "");
    const phone = rawPhone.startsWith("52") ? rawPhone : `52${rawPhone}`;
    const mensaje = construirMensaje();
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank", "noopener,noreferrer");

    setConteoEnvios((prev) => prev + 1);

    // Guardar en BD solo en el primer envío
    if (esPrimerEnvio) {
      setEnviado(true);
      setErrorGuardando("");
      const input = buildPedidoInput();
      startGuardar(async () => {
        const result = await crearPedido(input);
        if ("error" in result) setErrorGuardando(result.error);
      });
    }
  };

  const handlePropina = (val: string) => {
    setPropinaStr(val);
    const n = parseFloat(val);
    setPropina(isNaN(n) || n < 0 ? 0 : n);
  };

  const handleMapSelect = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    if (errorUbicacion) setErrorUbicacion(false);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Tu pedido">
      {/* ── Header ── */}
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={onClose} aria-label="Volver al menú">
          <BackIcon />
          <span>Menú</span>
        </button>
        <h2 className={styles.headerTitle}>Tu pedido</h2>
        <div className={styles.headerRight} />
      </div>

      {/* ── Scrollable body ── */}
      <div className={styles.body}>

        {/* Platillos */}
        <div className={styles.seccion}>
          <p className={styles.seccionTitulo}>Lo que pediste</p>
          <div className={styles.platillosList}>
            {carrito.map((item) => (
              <div key={item.uid} className={styles.platilloItem}>
                {/* Imagen */}
                <div className={styles.platilloImgWrap}>
                  {item.imagenUrl ? (
                    <img src={item.imagenUrl} alt={item.nombre} className={styles.platilloImg} />
                  ) : (
                    <span className={styles.platilloNoImg} aria-hidden="true">🍽</span>
                  )}
                </div>

                {/* Nombre, personalización, costo */}
                <div className={styles.platilloInfo}>
                  <p className={styles.platilloNombre}>{item.nombre}</p>
                  {(item.ingredientesQuitados.length > 0 || item.extrasAgregados.length > 0) && (
                    <p className={styles.platilloPersonaliz}>
                      {item.ingredientesQuitados.length > 0 && (
                        <span>Sin: {item.ingredientesQuitados.join(", ")}</span>
                      )}
                      {item.extrasAgregados.map((e) => (
                        <span key={e.id}>+ {e.nombre} (+${e.costo.toFixed(2)})</span>
                      ))}
                    </p>
                  )}
                  <span className={styles.platilloCosto}>
                    ${(item.costoTotal * item.cantidad).toFixed(2)}
                  </span>
                </div>

                {/* Controles cantidad — píldora horizontal */}
                <div className={styles.platilloControles}>
                  <button
                    type="button"
                    className={`${styles.controlBtn} ${item.cantidad === 1 ? styles.controlBtnTrash : ""}`}
                    onClick={() => onDecrementar(item.uid)}
                    aria-label={item.cantidad === 1 ? `Eliminar ${item.nombre}` : `Quitar un ${item.nombre}`}
                    disabled={enviado}
                  >
                    {item.cantidad === 1 ? <TrashIcon /> : <MinusIcon />}
                  </button>
                  <span className={styles.controlCantidad}>{item.cantidad}</span>
                  <button
                    type="button"
                    className={styles.controlBtn}
                    onClick={() => onIncrementar(item.uid)}
                    aria-label={`Agregar otro ${item.nombre}`}
                    disabled={enviado}
                  >
                    <PlusControlIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.separator} />

        {/* Datos del pedido — siempre visible; pre-llenado si hay sesión */}
        <div className={styles.seccion}>
          <p className={styles.seccionTitulo}>Datos del pedido</p>
          <label className={styles.campoLabel} htmlFor="nombrePedido">
            Tu nombre
          </label>
          <input
            ref={nombreRef}
            id="nombrePedido"
            type="text"
            className={`${styles.inputTextField} ${errorNombre ? styles.inputError : ""}`}
            placeholder="¿Con quién anotamos el pedido?"
            value={nombrePedido}
            onChange={(e) => { setNombrePedido(e.target.value); if (errorNombre) setErrorNombre(false); }}
            disabled={enviado}
            autoComplete="name"
            aria-required="true"
            aria-invalid={errorNombre}
          />
          {errorNombre && (
            <p className={styles.campoErrorMsg} role="alert">Ingresa tu nombre para continuar.</p>
          )}
          <label className={styles.campoLabel} htmlFor="celularPedido" style={{ marginTop: 16 }}>
            Número de celular
          </label>
          <input
            ref={celularRef}
            id="celularPedido"
            type="tel"
            className={`${styles.inputTextField} ${errorCelular ? styles.inputError : ""}`}
            placeholder="Tu número de celular"
            value={celularPedido}
            onChange={(e) => { setCelularPedido(e.target.value); if (errorCelular) setErrorCelular(false); }}
            disabled={enviado}
            autoComplete="tel"
            aria-required="true"
            aria-invalid={errorCelular}
          />
          {errorCelular && (
            <p className={styles.campoErrorMsg} role="alert">Ingresa tu número de celular para continuar.</p>
          )}
        </div>
        <div className={styles.separator} />

        {/* Método de pago */}
        <div className={styles.seccion}>
          <p className={styles.seccionTitulo}>Método de pago</p>
          <label className={styles.campoLabel} htmlFor="tipoPago">Selecciona cómo pagarás</label>
          <select
            id="tipoPago"
            className={styles.selectField}
            value={tipoPago}
            onChange={(e) => setTipoPago(e.target.value as TipoPago)}
            disabled={enviado}
          >
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia bancaria</option>
            <option value="TARJETA">Tarjeta con terminal</option>
          </select>
        </div>

        <div className={styles.separator} />

        {/* Tipo de envío */}
        <div className={styles.seccion}>
          <p className={styles.seccionTitulo}>Tipo de envío</p>
          <label className={styles.campoLabel} htmlFor="tipoEnvio">¿Cómo recibirás tu pedido?</label>
          <select
            ref={tipoEnvioRef}
            id="tipoEnvio"
            className={`${styles.selectField} ${errorTipoEnvio ? styles.inputError : ""}`}
            value={tipoEnvio}
            onChange={(e) => { setTipoEnvio(e.target.value as TipoEnvio | ""); if (errorTipoEnvio) setErrorTipoEnvio(false); }}
            disabled={enviado}
            aria-required="true"
            aria-invalid={errorTipoEnvio}
          >
            <option value="" disabled>Elige cómo recibirás tu pedido</option>
            <option value="RECOGER_EN_SUCURSAL">Recoger en sucursal</option>
            <option value="ENVIO_A_DOMICILIO" disabled={!sucursal.envioDomicilio}>
              {`Envío a domicilio${!sucursal.envioDomicilio ? " (no disponible)" : ""}`}
            </option>
            <option value="COMER_EN_LUGAR">Comer en el lugar</option>
          </select>
          {errorTipoEnvio && (
            <p className={styles.campoErrorMsg} role="alert">Elige cómo recibirás tu pedido.</p>
          )}
        </div>

        {/* Ubicación (solo para envío a domicilio) */}
        {tipoEnvio === "ENVIO_A_DOMICILIO" && (
          <>
            <div className={styles.separator} />
            <div className={styles.seccion}>
              <p className={styles.seccionTitulo}>Ubicación de entrega</p>
              <p className={styles.ubicacionTexto}>
                {cuentaCliente
                  ? "Tu ubicación guardada está marcada en el mapa. Mueve el pin si necesitas cambiarlo."
                  : "Toca el mapa para marcar el punto de entrega."}
              </p>
              {!enviado && (
                <>
                  <div className={styles.mapaWrap}>
                    <MapPickerMap
                      lat={lat}
                      lng={lng}
                      defaultCenter={mapDefaultCenter}
                      onSelect={handleMapSelect}
                    />
                  </div>
                  <p className={styles.mapaHint}>Toca el mapa para ajustar la ubicación de entrega</p>
                </>
              )}
              <div className={styles.coordRow} style={{ marginTop: 12 }}>
                <div className={styles.coordWrap}>
                  <span className={styles.coordLabel}>Latitud</span>
                  <span className={`${styles.coordValue} ${lat === null ? styles.coordEmpty : ""}`}>
                    {lat !== null ? lat.toFixed(6) : "—"}
                  </span>
                </div>
                <div className={styles.coordWrap}>
                  <span className={styles.coordLabel}>Longitud</span>
                  <span className={`${styles.coordValue} ${lng === null ? styles.coordEmpty : ""}`}>
                    {lng !== null ? lng.toFixed(6) : "—"}
                  </span>
                </div>
              </div>
              {errorUbicacion && (
                <p className={styles.errorUbicacion} role="alert">
                  Selecciona una ubicación en el mapa antes de enviar tu pedido.
                </p>
              )}
              {fueraDeRango && (
                <p className={styles.fueraDeRangoMsg} role="alert">
                  La ubicación de entrega está fuera del rango de envío de la sucursal.
                </p>
              )}
            </div>
          </>
        )}

        <div className={styles.separator} />

        {/* Observaciones */}
        <div className={styles.seccion}>
          <p className={styles.seccionTitulo}>Observaciones</p>
          <label className={styles.campoLabel} htmlFor="observaciones">
            Notas para el restaurante (opcional)
          </label>
          <textarea
            id="observaciones"
            className={styles.textareaField}
            placeholder="Ej: Sin picante, tocar el timbre dos veces..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            disabled={enviado}
          />
        </div>

        <div className={styles.separator} />

        {/* Propina */}
        <div className={styles.seccion}>
          <p className={styles.seccionTitulo}>Propina</p>
          <label className={styles.campoLabel} htmlFor="propina">Monto de propina (opcional)</label>
          <input
            id="propina"
            type="number"
            min="0"
            step="5"
            inputMode="decimal"
            className={styles.inputNumField}
            value={propinaStr}
            onChange={(e) => handlePropina(e.target.value)}
            disabled={enviado}
          />
        </div>

        <div className={styles.separator} />

        {/* Resumen de costos */}
        <div className={styles.seccion}>
          <p className={styles.seccionTitulo}>Resumen</p>
          <div className={styles.resumenCard}>
            <div className={styles.resumenRow}>
              <span className={styles.resumenLabel}>Subtotal</span>
              <span className={styles.resumenValor}>${subtotal.toFixed(2)}</span>
            </div>
            {tipoEnvio === "ENVIO_A_DOMICILIO" && (
              <div className={styles.resumenRow}>
                <span className={styles.resumenLabel}>Costo de envío</span>
                <span className={styles.resumenValor}>
                  {costoEnvioAplicado > 0 ? `$${costoEnvioAplicado.toFixed(2)}` : "—"}
                </span>
              </div>
            )}
            <div className={styles.resumenRow}>
              <span className={styles.resumenLabel}>Propina</span>
              <span className={styles.resumenValor}>
                {propina > 0 ? `$${propina.toFixed(2)}` : "—"}
              </span>
            </div>
            <div className={styles.resumenRowTotal}>
              <span className={styles.resumenTotalLabel}>Total</span>
              <span className={styles.resumenTotalValor}>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Success message */}
        {enviado && (
          <div ref={exitoRef} className={styles.exitoWrap}>
            <span className={styles.exitoIcono} aria-hidden="true">✅</span>
            <p className={styles.exitoTitulo}>¡Pedido enviado por WhatsApp!</p>
            <p className={styles.exitoDesc}>
              El restaurante revisará tu pedido y te confirmará en breve.
            </p>
            {guardando && (
              <p className={styles.exitoGuardando}>Guardando pedido…</p>
            )}
            {errorGuardando && (
              <p className={styles.exitoErrorGuardando} role="alert">{errorGuardando}</p>
            )}
          </div>
        )}

        {/* Spacer for footer */}
        <div style={{ height: 16 }} />
      </div>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        {!enviado ? (
          <button
            type="button"
            className={styles.enviarBtn}
            onClick={enviarPorWhatsApp}
            disabled={tipoEnvio === "ENVIO_A_DOMICILIO" && lat === null}
          >
            <WhatsAppIcon />
            Enviar pedido
          </button>
        ) : (
          <div className={styles.botonesPostEnvio}>
            <button
              type="button"
              className={styles.reenviarBtn}
              onClick={enviarPorWhatsApp}
              disabled={conteoEnvios >= 3}
              aria-label={
                conteoEnvios >= 3
                  ? "Límite de reenvíos alcanzado"
                  : `Enviar nuevamente (${3 - conteoEnvios} restante${3 - conteoEnvios !== 1 ? "s" : ""})`
              }
            >
              {conteoEnvios >= 3 ? "Límite alcanzado" : `Reenviar (${3 - conteoEnvios})`}
            </button>
            <Link href="/explorar" className={styles.inicioBtn}>
              Regresar al inicio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
