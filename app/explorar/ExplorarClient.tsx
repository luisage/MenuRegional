"use client";

import { useState, useMemo, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { RestauranteExplora, PlatilloExplora } from "./page";
import AvisosCarousel, { type AvisoVista } from "./[slug]/AvisosCarousel";
import {
  loginCliente,
  registrarCliente,
  obtenerColoniasPorMunicipio,
  obtenerPedidosCliente,
  obtenerRestaurantesRecientes,
  obtenerSucursalesConUbicacion,
  cerrarSesionCliente,
  type PedidoVista,
  type RestauranteReciente,
  type SucursalUbicacion,
} from "@/app/lib/actions/clienteAuth";

const CercaMapaView = dynamic(() => import("@/app/explorar/CercaMapaView"), {
  ssr: false,
  loading: () => <div className={styles.mapaLoading}>Cargando mapa…</div>,
});
import styles from "./Explorar.module.css";

const TAG_INTERVALO_MS = 5000;
const DEFAULT_CENTER: [number, number] = [20.0628, -99.2319]; // Atitalaquia, Hgo

const MapPicker = dynamic(() => import("@/app/explorar/[slug]/MapPickerMap"), {
  ssr: false,
  loading: () => <div className={styles.mapaLoading}>Cargando mapa…</div>,
});

// ── Icons ──────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "none" }}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 7h11v9H2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13 10h4l3 3v3h-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.5" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function PlateIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ForkKnifeIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 2v7c0 1.1.9 2 2 2h1v11h2V11h1c1.1 0 2-.9 2-2V2h-2v5H8V2H6v5H5V2H3zM16 2v20h2v-8h3V2h-5z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}

// ── Helpers: pedidos ──────────────────────────────────────────────────
const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  EN_PREPARACION: "En preparación",
  EN_CAMINO: "En camino",
  LISTO: "Listo para recoger",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const ENVIO_LABEL: Record<string, string> = {
  RECOGER_EN_SUCURSAL: "Recoger en sucursal",
  ENVIO_A_DOMICILIO: "Envío a domicilio",
  COMER_EN_LUGAR: "Comer en el lugar",
};

const PAGO_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia bancaria",
  TARJETA: "Tarjeta con terminal",
};

function estadoClase(estado: string, s: Record<string, string>): string {
  switch (estado) {
    case "PENDIENTE":        return s.pedidoEstadoPendiente;
    case "CONFIRMADO":
    case "EN_PREPARACION":
    case "EN_CAMINO":        return s.pedidoEstadoProceso;
    case "LISTO":            return s.pedidoEstadoListo;
    case "ENTREGADO":        return s.pedidoEstadoEntregado;
    case "CANCELADO":        return s.pedidoEstadoCancelado;
    default:                 return "";
  }
}

function formatFecha(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "America/Mexico_City",
  }).format(new Date(iso));
}

// ── Modal: Pedidos ─────────────────────────────────────────────────────
function ModalPedidos({ onClose }: { onClose: () => void }) {
  const [pedidos, setPedidos] = useState<PedidoVista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<PedidoVista | null>(null);

  useEffect(() => {
    let cancelled = false;
    obtenerPedidosCliente().then((res) => {
      if (cancelled) return;
      if ("error" in res) setError(res.error);
      else setPedidos(res.pedidos);
      setCargando(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div
        className={`${styles.modalPanel} ${styles.modalPanelLg}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Mis pedidos"
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          {sel ? (
            <button
              type="button"
              className={styles.pedidoBackBtn}
              onClick={() => setSel(null)}
            >
              <ArrowLeftIcon />
              <span>Mis pedidos</span>
            </button>
          ) : (
            <h2 className={styles.modalTitle}>Mis pedidos</h2>
          )}
          <button className={styles.modalCerrarBtn} onClick={onClose} aria-label="Cerrar" type="button">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBodyPedidos}>

            {cargando && (
              <p className={styles.pedidoEstadoMsg}>Cargando tus pedidos…</p>
            )}

            {!cargando && error && (
              <p className={styles.pedidoEstadoMsg}>{error}</p>
            )}

            {!cargando && !error && !sel && (
              <>
                {pedidos.length === 0 ? (
                  <div className={styles.pedidoVacioWrap}>
                    <p className={styles.pedidoVacioTitle}>Sin pedidos aún</p>
                    <p className={styles.pedidoVacioDesc}>
                      Cuando realices tu primer pedido aparecerá aquí.
                    </p>
                  </div>
                ) : (
                  <ul className={styles.pedidosList}>
                    {pedidos.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={styles.pedidoCard}
                          onClick={() => setSel(p)}
                        >
                          <div className={styles.pedidoCardTop}>
                            <span className={styles.pedidoRestaurante}>{p.restauranteNombre}</span>
                            <span className={styles.pedidoFolio}>#{p.folio}</span>
                          </div>
                          <div className={styles.pedidoCardMid}>
                            <span className={`${styles.pedidoEstadoBadge} ${estadoClase(p.estado, styles)}`}>
                              {ESTADO_LABEL[p.estado] ?? p.estado}
                            </span>
                            <span className={styles.pedidoFecha}>{formatFecha(p.createdAt)}</span>
                          </div>
                          <div className={styles.pedidoCardBot}>
                            <span className={styles.pedidoItemsCount}>
                              {p.detalles.reduce((s, d) => s + d.cantidad, 0)} platillo{p.detalles.reduce((s, d) => s + d.cantidad, 0) !== 1 ? "s" : ""}
                            </span>
                            <span className={styles.pedidoTotal}>${parseFloat(p.costoTotal).toFixed(2)}</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {!cargando && !error && sel && (
              <div className={styles.pedidoDetalle}>

                {/* Encabezado del pedido */}
                <div className={styles.pedidoDetalleHeader}>
                  <div>
                    <p className={styles.pedidoDetalleRestaurante}>{sel.restauranteNombre}</p>
                    <p className={styles.pedidoDetalleSucursal}>{sel.sucursalNombre}</p>
                  </div>
                  <span className={`${styles.pedidoEstadoBadge} ${estadoClase(sel.estado, styles)}`}>
                    {ESTADO_LABEL[sel.estado] ?? sel.estado}
                  </span>
                </div>
                <p className={styles.pedidoDetalleFecha}>{formatFecha(sel.createdAt)}</p>

                {/* Platillos */}
                <p className={styles.pedidoDetalleSeccion}>Platillos</p>
                <ul className={styles.pedidoDetalleItems}>
                  {sel.detalles.map((d) => (
                    <li key={d.id} className={styles.pedidoDetalleItem}>
                      <div className={styles.pedidoDetalleItemTop}>
                        <span className={styles.pedidoDetalleItemNombre}>
                          {d.cantidad}× {d.nombrePlatillo}
                        </span>
                        <span className={styles.pedidoDetalleItemCosto}>
                          ${parseFloat(d.costoTotal).toFixed(2)}
                        </span>
                      </div>
                      {d.descripcion && (
                        <p className={styles.pedidoDetalleItemNota}>{d.descripcion}</p>
                      )}
                      {d.extras.map((e, i) => (
                        <div key={i} className={styles.pedidoDetalleExtra}>
                          <span>+ {e.nombre}</span>
                          <span>+${parseFloat(e.costo).toFixed(2)}</span>
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>

                {/* Envío y pago */}
                <p className={styles.pedidoDetalleSeccion}>Información</p>
                <div className={styles.pedidoDetalleInfo}>
                  <div className={styles.pedidoDetalleInfoRow}>
                    <span>Tipo de envío</span>
                    <span>{ENVIO_LABEL[sel.tipoEnvio] ?? sel.tipoEnvio}</span>
                  </div>
                  <div className={styles.pedidoDetalleInfoRow}>
                    <span>Método de pago</span>
                    <span>{PAGO_LABEL[sel.tipoPago] ?? sel.tipoPago}</span>
                  </div>
                  {sel.descripcion && (
                    <div className={styles.pedidoDetalleInfoRow}>
                      <span>Observaciones</span>
                      <span>{sel.descripcion}</span>
                    </div>
                  )}
                </div>

                {/* Resumen de costos */}
                <p className={styles.pedidoDetalleSeccion}>Resumen</p>
                <div className={styles.pedidoDetalleResumen}>
                  <div className={styles.pedidoResumenRow}>
                    <span>Subtotal</span>
                    <span>${parseFloat(sel.subtotal).toFixed(2)}</span>
                  </div>
                  {parseFloat(sel.costoEnvio) > 0 && (
                    <div className={styles.pedidoResumenRow}>
                      <span>Costo de envío</span>
                      <span>${parseFloat(sel.costoEnvio).toFixed(2)}</span>
                    </div>
                  )}
                  {parseFloat(sel.propina) > 0 && (
                    <div className={styles.pedidoResumenRow}>
                      <span>Propina</span>
                      <span>${parseFloat(sel.propina).toFixed(2)}</span>
                    </div>
                  )}
                  <div className={`${styles.pedidoResumenRow} ${styles.pedidoResumenTotal}`}>
                    <span>Total</span>
                    <span>${parseFloat(sel.costoTotal).toFixed(2)}</span>
                  </div>
                </div>

              </div>
            )}

        </div>
      </div>
    </div>
  );
}

// ── Utilidad: distancia Haversine en km ───────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function formatDistancia(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// ── Modal: Cerca de ti ────────────────────────────────────────────────
function ModalCercaDeTi({ onClose }: { onClose: () => void }) {
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [sucursales, setSucursales] = useState<SucursalUbicacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const geoPromise = new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Tu navegador no soporta geolocalización."));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        maximumAge: 60000,
      });
    });

    Promise.all([geoPromise, obtenerSucursalesConUbicacion()])
      .then(([pos, data]) => {
        if (cancelled) return;
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setSucursales(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof GeolocationPositionError) {
          if (err.code === err.PERMISSION_DENIED)
            setGeoError("Permiso de ubicación denegado. Actívalo en la configuración de tu navegador.");
          else
            setGeoError("No fue posible obtener tu ubicación. Intenta de nuevo.");
        } else {
          setGeoError("Error al cargar los datos. Intenta de nuevo.");
        }
      })
      .finally(() => { if (!cancelled) setCargando(false); });

    return () => { cancelled = true; };
  }, []);

  const cercanas = userLat !== null && userLng !== null
    ? sucursales
        .map((s) => ({ ...s, distancia: haversineKm(userLat, userLng, s.lat, s.lng) }))
        .filter((s) => s.distancia <= 1.2)
        .sort((a, b) => a.distancia - b.distancia)
    : [];

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div
        className={`${styles.modalPanel} ${styles.modalPanelCerca}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Restaurantes cerca de ti"
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Cerca de ti</h2>
          <button className={styles.modalCerrarBtn} onClick={onClose} aria-label="Cerrar" type="button">
            <CloseIcon />
          </button>
        </div>

        <div className={styles.modalBodyCerca}>

          {cargando && (
            <div className={styles.cercaCargando}>
              <p className={styles.pedidoEstadoMsg}>Obteniendo tu ubicación…</p>
            </div>
          )}

          {!cargando && geoError && (
            <div className={styles.pedidoVacioWrap}>
              <p className={styles.pedidoVacioTitle}>Ubicación no disponible</p>
              <p className={styles.pedidoVacioDesc}>{geoError}</p>
            </div>
          )}

          {!cargando && !geoError && userLat !== null && userLng !== null && (
            <>
              {/* Mapa */}
              <div className={styles.cercaMapaWrap}>
                <CercaMapaView
                  userLat={userLat}
                  userLng={userLng}
                  sucursales={cercanas}
                />
              </div>

              {/* Lista */}
              <div className={styles.cercaListaWrap}>
                {cercanas.length === 0 ? (
                  <div className={styles.pedidoVacioWrap} style={{ padding: "24px 0" }}>
                    <p className={styles.pedidoVacioTitle}>Sin restaurantes cerca</p>
                    <p className={styles.pedidoVacioDesc}>
                      No encontramos restaurantes en un radio de 1.2 km de tu ubicación.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className={styles.cercaListaTitulo}>
                      {cercanas.length} restaurante{cercanas.length !== 1 ? "s" : ""} en 1.2 km
                    </p>
                    <ul className={styles.cercaLista}>
                      {cercanas.map((s, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            className={styles.cercaItem}
                            onClick={() => { onClose(); router.push(`/explorar/${s.restauranteSlug}`); }}
                          >
                            <div className={styles.cercaItemInfo}>
                              <span className={styles.cercaItemNombre}>{s.restauranteNombre}</span>
                              {s.sucursalNombre !== s.restauranteNombre && (
                                <span className={styles.cercaItemSucursal}>{s.sucursalNombre}</span>
                              )}
                            </div>
                            <span className={styles.cercaItemDist}>{formatDistancia(s.distancia)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Modal: Favoritos (últimos restaurantes pedidos) ────────────────────
function FavCard({ r, onClose }: { r: RestauranteReciente; onClose: () => void }) {
  const inicial = r.nombre.charAt(0).toUpperCase();
  const [tagIndex, setTagIndex] = useState(0);

  useEffect(() => {
    if (r.tiposComida.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setTagIndex((i) => (i + 1) % r.tiposComida.length), TAG_INTERVALO_MS);
    return () => clearInterval(id);
  }, [r.tiposComida.length]);

  return (
    <Link href={`/explorar/${r.slug}`} className={styles.restCardLink} onClick={onClose}>
      <article className={styles.restCard}>
        <div className={styles.restLogoWrap}>
          {r.logoUrl ? (
            <img src={r.logoUrl} alt={r.nombre} className={styles.restLogo} />
          ) : (
            <span className={styles.restLogoFallback} aria-hidden="true">{inicial}</span>
          )}
        </div>
        <h3 className={styles.restName}>{r.nombre}</h3>

        {r.tiposComida.length > 0 && (
          <div className={styles.restTagsCarousel}>
            <span key={tagIndex} className={styles.restTagRotating}>
              {r.tiposComida[tagIndex]}
            </span>
          </div>
        )}

        <p className={styles.restMetaItem}>
          <TruckIcon />
          {r.envioDomicilio ? "Envío a domicilio" : "Sin envío a domicilio"}
        </p>

        <p className={styles.restMetaItem}>
          <span
            className={`${styles.estadoDot} ${r.abierto ? styles.estadoDotAbierto : styles.estadoDotCerrado}`}
            aria-hidden="true"
          />
          {r.abierto ? "Abierto" : "Cerrado"}
        </p>

        {r.colonia && (
          <p className={styles.restColonia}>
            <LocationIcon />
            {r.colonia}
          </p>
        )}
      </article>
    </Link>
  );
}

function ModalFavoritos({ onClose }: { onClose: () => void }) {
  const [restaurantes, setRestaurantes] = useState<RestauranteReciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    obtenerRestaurantesRecientes().then((res) => {
      if (cancelled) return;
      if ("error" in res) setError(res.error);
      else setRestaurantes(res.restaurantes);
      setCargando(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div
        className={`${styles.modalPanel} ${styles.modalPanelLg}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Tus restaurantes recientes"
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Tus favoritos</h2>
          <button className={styles.modalCerrarBtn} onClick={onClose} aria-label="Cerrar" type="button">
            <CloseIcon />
          </button>
        </div>

        <div className={styles.modalBodyPedidos}>
          <p className={styles.favSubtitulo}>
            Últimos restaurantes en los que has realizado pedidos
          </p>

          {cargando && (
            <p className={styles.pedidoEstadoMsg}>Cargando restaurantes…</p>
          )}

          {!cargando && error && (
            <p className={styles.pedidoEstadoMsg}>{error}</p>
          )}

          {!cargando && !error && restaurantes.length === 0 && (
            <div className={styles.pedidoVacioWrap}>
              <p className={styles.pedidoVacioTitle}>Aún no has pedido</p>
              <p className={styles.pedidoVacioDesc}>
                Aquí aparecerán los últimos restaurantes en los que hayas realizado un pedido.
              </p>
            </div>
          )}

          {!cargando && !error && restaurantes.length > 0 && (
            <div className={styles.favGrid}>
              {restaurantes.map((r) => (
                <FavCard key={r.id} r={r} onClose={onClose} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal: Beneficios ──────────────────────────────────────────────────
const BENEFICIOS = [
  { emoji: "✅", titulo: "Pide más rápido", desc: "con tus datos guardados, hacer un pedido será muy fácil" },
  { emoji: "📍", titulo: "Da seguimiento a tu orden", desc: "sabrás en todo momento en qué paso va tu orden" },
  { emoji: "📋", titulo: "Historial de pedidos", desc: "revisa todo lo que has pedido antes, cuando quieras" },
  { emoji: "🍽️", titulo: "Restaurantes cerca de ti", desc: "descubre qué restaurantes están cerca de tu domicilio" },
  { emoji: "🚚", titulo: "Verifica tu zona de envío", desc: "sabrás al instante si tu domicilio está dentro del rango de entrega del restaurante" },
  { emoji: "⭐", titulo: "Tus favoritos siempre a la mano", desc: "guarda los restaurantes que más te gustan" },
  { emoji: "🎁", titulo: "Sé un cliente frecuente", desc: "el restaurante te identificará y podrá darte un trato especial" },
];

function ModalBeneficios({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div
        className={`${styles.modalPanel} ${styles.modalPanelMd}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Beneficios de crear una cuenta"
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Crea tu cuenta y disfruta de estos beneficios</h2>
          <button className={styles.modalCerrarBtn} onClick={onClose} aria-label="Cerrar" type="button">
            <CloseIcon />
          </button>
        </div>
        <div className={styles.modalBody}>
          <ul className={styles.beneficiosList}>
            {BENEFICIOS.map((b, i) => (
              <li key={i} className={styles.beneficioItem}>
                <span className={styles.beneficioEmoji} aria-hidden="true">{b.emoji}</span>
                <span className={styles.beneficioTexto}>
                  <strong className={styles.beneficioTitulo}>{b.titulo}</strong>
                  {" — "}{b.desc}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Login ───────────────────────────────────────────────────────
function ModalLogin({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginCliente(fd);
      if ("error" in result) {
        setError(result.error);
      } else {
        onSuccess();
      }
    });
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div
        className={`${styles.modalPanel} ${styles.modalPanelSm}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Iniciar sesión"
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Iniciar sesión</h2>
          <button className={styles.modalCerrarBtn} onClick={onClose} aria-label="Cerrar" type="button">
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="login-usuario">Usuario</label>
              <input
                id="login-usuario"
                name="usuario"
                type="text"
                className={styles.formInput}
                placeholder="Tu nombre de usuario"
                autoComplete="username"
                required
                disabled={pending}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
                name="password"
                type="password"
                className={styles.formInput}
                placeholder="Tu contraseña"
                autoComplete="current-password"
                required
                disabled={pending}
              />
            </div>
            {error && <p className={styles.formError}>{error}</p>}
          </div>
          <div className={styles.modalFooter}>
            <button
              type="submit"
              className={styles.modalAplicarBtn}
              disabled={pending}
            >
              {pending ? "Iniciando sesión…" : "Iniciar sesión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type MunicipioOpt = { id: string; nombre: string };
type ColoniaOpt  = { id: string; nombre: string };

// ── Modal: Registro ────────────────────────────────────────────────────
function ModalRegistro({
  onClose,
  onSuccess,
  municipios,
}: {
  onClose: () => void;
  onSuccess: () => void;
  municipios: MunicipioOpt[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [municipioId, setMunicipioId] = useState("");
  const [colonias, setColonias] = useState<ColoniaOpt[]>([]);
  const [cargandoColonias, setCargandoColonias] = useState(false);
  const [coloniaSelId, setColoniaSelId] = useState("");

  function handleSelect(la: number, ln: number) {
    setLat(la);
    setLng(ln);
    setMapCenter([la, ln]);
  }

  function buscarUbicacion() {
    if (!navigator.geolocation) {
      setLocError("Tu navegador no soporta geolocalización.");
      return;
    }
    setLocLoading(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        setMapCenter([latitude, longitude]);
        setLocLoading(false);
      },
      (err) => {
        setLocLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocError("Permiso de ubicación denegado.");
        } else {
          setLocError("No se pudo obtener tu ubicación. Intenta de nuevo.");
        }
      }
    );
  }

  function handleMunicipioChange(id: string) {
    setMunicipioId(id);
    setColonias([]);
    setColoniaSelId("");
    if (!id) return;
    setCargandoColonias(true);
    obtenerColoniasPorMunicipio(id).then((data) => {
      setColonias(data);
      setCargandoColonias(false);
    });
  }

  async function handleColoniaChange(id: string) {
    setColoniaSelId(id);
    if (!id || lat !== null) return;
    const colonia = colonias.find((c) => c.id === id);
    const municipio = municipios.find((m) => m.id === municipioId);
    if (!colonia || !municipio) return;
    try {
      const q = `${colonia.nombre}, ${municipio.nombre}, Mexico`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { "Accept-Language": "es" } }
      );
      const data: { lat: string; lon: string }[] = await res.json();
      if (data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    } catch {
      // silently fail — map stays at current center
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const password = fd.get("password") as string;
    const confirmar = fd.get("confirmarPassword") as string;
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (lat === null || lng === null) {
      setError("Debes marcar tu ubicación en el mapa.");
      return;
    }
    fd.set("latitud", String(lat));
    fd.set("longitud", String(lng));
    startTransition(async () => {
      const result = await registrarCliente(fd);
      if ("error" in result) {
        setError(result.error);
      } else {
        onSuccess();
      }
    });
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div
        className={`${styles.modalPanel} ${styles.modalPanelLg}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Crear cuenta"
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Crear cuenta</h2>
          <button className={styles.modalCerrarBtn} onClick={onClose} aria-label="Cerrar" type="button">
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={`${styles.modalBody} ${styles.modalBodyRegistro}`}>

            {/* ── 1. Tus datos ── */}
            <div className={styles.formSection}>
              <p className={styles.formSectionTitle}>Tus datos</p>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="reg-nombre">Nombre completo *</label>
                  <input
                    id="reg-nombre"
                    name="nombre"
                    type="text"
                    className={styles.formInput}
                    placeholder="Tu nombre"
                    autoComplete="name"
                    required
                    disabled={pending}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="reg-celular">Celular *</label>
                  <input
                    id="reg-celular"
                    name="celular"
                    type="tel"
                    className={styles.formInput}
                    placeholder="10 dígitos"
                    autoComplete="tel"
                    required
                    disabled={pending}
                  />
                </div>
              </div>
            </div>

            {/* ── 2. Crea tu cuenta ── */}
            <div className={styles.formSection}>
              <p className={styles.formSectionTitle}>Crea tu cuenta</p>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="reg-usuario">Usuario *</label>
                  <input
                    id="reg-usuario"
                    name="usuario"
                    type="text"
                    className={styles.formInput}
                    placeholder="Nombre de usuario"
                    autoComplete="username"
                    required
                    disabled={pending}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="reg-password">
                    Contraseña * <span className={styles.formLabelOpt}>(mín. 6)</span>
                  </label>
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    className={styles.formInput}
                    placeholder="Contraseña"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={pending}
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="reg-confirmar">Confirmar contraseña *</label>
                <input
                  id="reg-confirmar"
                  name="confirmarPassword"
                  type="password"
                  className={styles.formInput}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  disabled={pending}
                />
              </div>
            </div>

            {/* ── 3. Ingresa tu dirección ── */}
            <div className={styles.formSection}>
              <p className={styles.formSectionTitle}>Ingresa tu dirección</p>

              {/* Calle / Número */}
              <div className={styles.formRowCalleNum}>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="reg-calle">Calle *</label>
                  <input
                    id="reg-calle"
                    name="calle"
                    type="text"
                    className={styles.formInput}
                    placeholder="Nombre de la calle"
                    autoComplete="address-line1"
                    required
                    disabled={pending}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="reg-numero">Número *</label>
                  <input
                    id="reg-numero"
                    name="numero"
                    type="text"
                    className={styles.formInput}
                    placeholder="Ej. 12 B"
                    required
                    disabled={pending}
                  />
                </div>
              </div>

              {/* Municipio */}
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="reg-municipio">Municipio *</label>
                <select
                  id="reg-municipio"
                  className={styles.formSelect}
                  value={municipioId}
                  onChange={(e) => handleMunicipioChange(e.target.value)}
                  required
                  disabled={pending}
                >
                  <option value="">Selecciona un municipio</option>
                  {municipios.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Colonia */}
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="reg-colonia">Colonia *</label>
                <select
                  id="reg-colonia"
                  name="coloniaId"
                  className={styles.formSelect}
                  value={coloniaSelId}
                  onChange={(e) => handleColoniaChange(e.target.value)}
                  required
                  disabled={pending || !municipioId || cargandoColonias}
                >
                  <option value="">
                    {!municipioId
                      ? "Primero elige un municipio"
                      : cargandoColonias
                      ? "Cargando colonias…"
                      : "Selecciona una colonia"}
                  </option>
                  {colonias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Mapa */}
              <div className={styles.formField}>
                <p className={styles.formLabel}>Ubicación en el mapa *</p>
                <p className={styles.formHint}>Toca el mapa para marcar tu domicilio</p>
                <div className={styles.mapaRegistroWrap}>
                  <MapPicker
                    lat={lat}
                    lng={lng}
                    defaultCenter={mapCenter}
                    onSelect={handleSelect}
                  />
                </div>
                <div className={styles.mapaActions}>
                  <button
                    type="button"
                    className={styles.geoBtn}
                    onClick={buscarUbicacion}
                    disabled={locLoading || pending}
                  >
                    {locLoading ? "Obteniendo ubicación…" : "Encontrar mi ubicación"}
                  </button>
                  {locError && <span className={styles.locError}>{locError}</span>}
                </div>
                <div className={styles.coordsRow}>
                  <div className={styles.coordField}>
                    <label className={styles.coordLabel} htmlFor="reg-lat">Latitud</label>
                    <input
                      id="reg-lat"
                      type="text"
                      className={`${styles.formInput} ${styles.coordInput}`}
                      value={lat !== null ? lat.toFixed(7) : ""}
                      readOnly
                      placeholder="—"
                    />
                  </div>
                  <div className={styles.coordField}>
                    <label className={styles.coordLabel} htmlFor="reg-lng">Longitud</label>
                    <input
                      id="reg-lng"
                      type="text"
                      className={`${styles.formInput} ${styles.coordInput}`}
                      value={lng !== null ? lng.toFixed(7) : ""}
                      readOnly
                      placeholder="—"
                    />
                  </div>
                </div>
              </div>

              {/* Referencias */}
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="reg-referencias">
                  Referencias <span className={styles.formLabelOpt}>(opcional)</span>
                </label>
                <textarea
                  id="reg-referencias"
                  name="referencias"
                  className={styles.formTextarea}
                  placeholder="Ej. Casa azul con portón negro, frente a la farmacia"
                  rows={2}
                  disabled={pending}
                />
              </div>
            </div>

            {error && <p className={styles.formError}>{error}</p>}
          </div>
          <div className={styles.modalFooter}>
            <button
              type="submit"
              className={styles.modalAplicarBtn}
              disabled={pending}
            >
              {pending ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Restaurant card ────────────────────────────────────────────────────
function RestCard({ r }: { r: RestauranteExplora }) {
  const inicial = r.nombre.charAt(0).toUpperCase();
  const [tagIndex, setTagIndex] = useState(0);

  useEffect(() => {
    if (r.tiposComida.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      setTagIndex((i) => (i + 1) % r.tiposComida.length);
    }, TAG_INTERVALO_MS);
    return () => clearInterval(id);
  }, [r.tiposComida.length]);

  return (
    <Link href={`/explorar/${r.slug}`} className={styles.restCardLink}>
      <article className={styles.restCard}>
        <div className={styles.restLogoWrap}>
          {r.logoUrl ? (
            <img src={r.logoUrl} alt={r.nombre} className={styles.restLogo} />
          ) : (
            <span className={styles.restLogoFallback} aria-hidden="true">
              {inicial}
            </span>
          )}
        </div>
        <h3 className={styles.restName}>{r.nombre}</h3>

        {r.tiposComida.length > 0 && (
          <div className={styles.restTagsCarousel}>
            <span key={tagIndex} className={styles.restTagRotating}>
              {r.tiposComida[tagIndex]}
            </span>
          </div>
        )}

        <p className={styles.restMetaItem}>
          <TruckIcon />
          {r.envioDomicilio ? "Envío a domicilio" : "Sin envío a domicilio"}
        </p>

        <p className={styles.restMetaItem}>
          <span
            className={`${styles.estadoDot} ${r.abierto ? styles.estadoDotAbierto : styles.estadoDotCerrado}`}
            aria-hidden="true"
          />
          {r.abierto ? "Abierto" : "Cerrado"}
        </p>

        {r.colonia && (
          <p className={styles.restColonia}>
            <LocationIcon />
            {r.colonia}
          </p>
        )}
      </article>
    </Link>
  );
}

// ── Platillo card ──────────────────────────────────────────────────────
function PlatCard({ p }: { p: PlatilloExplora }) {
  const costo = parseFloat(p.costo);
  const costoStr = `$${costo % 1 === 0 ? costo.toFixed(0) : costo.toFixed(2)}`;
  return (
    <Link href={`/explorar/${p.restauranteSlug}?platilloId=${p.id}`} className={styles.platCardLink}>
      <article className={styles.platCard}>
        <div className={styles.platImgWrap}>
          {p.imagenUrl ? (
            <img src={p.imagenUrl} alt={p.nombre} className={styles.platImg} />
          ) : (
            <div className={styles.platImgFallback}>
              <PlateIcon />
            </div>
          )}
          <div className={styles.platImgGradient} aria-hidden="true" />
        </div>
        <div className={styles.platBody}>
          <h3 className={styles.platName}>{p.nombre}</h3>
          {p.descripcion && <p className={styles.platDesc}>{p.descripcion}</p>}
          <p className={styles.platPrice}>{costoStr}</p>
          <p className={styles.platRest}>{p.restauranteNombre}</p>
        </div>
      </article>
    </Link>
  );
}

// ── Main ───────────────────────────────────────────────────────────────
export default function ExplorarClient({
  restaurantes,
  platillos,
  promociones,
  clienteLogueado,
  primerNombre,
  municipios,
}: {
  restaurantes: RestauranteExplora[];
  platillos: PlatilloExplora[];
  promociones: AvisoVista[];
  clienteLogueado: boolean;
  primerNombre: string | null;
  municipios: MunicipioOpt[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Applied filters
  const [coloniaFiltro, setColoniaFiltro] = useState<string | null>(null);
  const [envioDomicilioFiltro, setEnvioDomicilioFiltro] = useState(false);

  // Draft filters (while modal is open)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [coloniaTemp, setColoniaTemp] = useState<string | null>(null);
  const [envioDomicilioTemp, setEnvioDomicilioTemp] = useState(false);

  // Auth/info modals
  const [modalBeneficios, setModalBeneficios] = useState(false);
  const [modalLogin, setModalLogin] = useState(false);
  const [modalRegistro, setModalRegistro] = useState(false);

  // Nav dropdown (logged-in user)
  const [menuOpciones, setMenuOpciones] = useState(false);
  const [modalPedidos, setModalPedidos] = useState(false);
  const [modalFavoritos, setModalFavoritos] = useState(false);
  const [modalCercaDeTi, setModalCercaDeTi] = useState(false);
  const menuOpcionesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpciones) return;
    function onClickOutside(e: MouseEvent) {
      if (menuOpcionesRef.current && !menuOpcionesRef.current.contains(e.target as Node)) {
        setMenuOpciones(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpciones]);

  const q = query.toLowerCase().trim();
  const hayFiltrosActivos = coloniaFiltro !== null || envioDomicilioFiltro;

  const todasColonias = useMemo(() => {
    const set = new Set<string>();
    restaurantes.forEach((r) => r.colonias.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [restaurantes]);

  const restMostrar = useMemo(() => {
    let result = q
      ? restaurantes.filter(
          (r) =>
            r.nombre.toLowerCase().includes(q) ||
            r.tiposComida.some((t) => t.toLowerCase().includes(q)) ||
            r.categoriasMenu.some((c) => c.toLowerCase().includes(q)) ||
            r.colonias.some((col) => col.toLowerCase().includes(q))
        )
      : restaurantes;

    if (coloniaFiltro) {
      result = result.filter((r) => r.colonias.includes(coloniaFiltro));
    }
    if (envioDomicilioFiltro) {
      result = result.filter((r) => r.envioDomicilio);
    }
    return result;
  }, [restaurantes, q, coloniaFiltro, envioDomicilioFiltro]);

  const platFiltrados = useMemo(
    () =>
      q
        ? platillos.filter(
            (p) =>
              p.nombre.toLowerCase().includes(q) ||
              (p.descripcion?.toLowerCase().includes(q) ?? false) ||
              p.restauranteNombre.toLowerCase().includes(q)
          )
        : platillos,
    [platillos, q]
  );

  const buscando = q.length > 0;
  const hayResultados = restMostrar.length > 0 || platFiltrados.length > 0;

  // Filter modal handlers
  const abrirModal = () => {
    setColoniaTemp(coloniaFiltro);
    setEnvioDomicilioTemp(envioDomicilioFiltro);
    setModalAbierto(true);
  };

  const cerrarModal = () => setModalAbierto(false);
  const limpiarFiltrosTemp = () => { setColoniaTemp(null); setEnvioDomicilioTemp(false); };
  const aplicarFiltros = () => {
    setColoniaFiltro(coloniaTemp);
    setEnvioDomicilioFiltro(envioDomicilioTemp);
    setModalAbierto(false);
  };

  function handleAuthSuccess() {
    setModalLogin(false);
    setModalRegistro(false);
    router.refresh();
  }

  const RestaurantesHeader = (
    <div className={styles.sectionTitleRow}>
      <div className={styles.sectionTitleGroup}>
        <p className={styles.sectionEyebrow}>
          {buscando ? "Restaurantes" : "Explora"}
        </p>
        <h2 className={styles.sectionTitle}>
          {buscando
            ? `${restMostrar.length} ${restMostrar.length === 1 ? "restaurante encontrado" : "restaurantes encontrados"}`
            : "Restaurantes"}
        </h2>
      </div>
      <button
        className={`${styles.filtroBtn} ${hayFiltrosActivos ? styles.filtroBtnActivo : ""}`}
        onClick={abrirModal}
        type="button"
        aria-label="Abrir filtros"
      >
        {hayFiltrosActivos && <span className={styles.filtroIndicador} aria-hidden="true" />}
        <FilterIcon />
        Filtro por ubicación y más
      </button>
    </div>
  );

  return (
    <div className={styles.page}>
      {/* Top nav */}
      <nav className={styles.topNav} aria-label="Navegación principal">
        <Link href="/" className={styles.navBrand}>
          Menú <b>Regional</b>
        </Link>
        {clienteLogueado ? (
          <div className={styles.navMenuWrap} ref={menuOpcionesRef}>
            <button
              type="button"
              className={styles.navOpcionesBtn}
              onClick={() => setMenuOpciones((v) => !v)}
              aria-expanded={menuOpciones}
              aria-haspopup="menu"
            >
              Opciones
              <ChevronDownIcon open={menuOpciones} />
            </button>
            {menuOpciones && (
              <div className={styles.navDropdown} role="menu">
                <button
                  type="button"
                  className={styles.navDropdownItem}
                  role="menuitem"
                  onClick={() => { setMenuOpciones(false); setModalPedidos(true); }}
                >
                  Ver pedidos
                </button>
                <button
                  type="button"
                  className={styles.navDropdownItem}
                  role="menuitem"
                  onClick={() => { setMenuOpciones(false); setModalFavoritos(true); }}
                >
                  Tus favoritos
                </button>
                <button
                  type="button"
                  className={styles.navDropdownItem}
                  role="menuitem"
                  onClick={() => { setMenuOpciones(false); setModalCercaDeTi(true); }}
                >
                  Cerca de ti
                </button>
                <button
                  type="button"
                  className={`${styles.navDropdownItem} ${styles.navDropdownItemPeligro}`}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpciones(false);
                    cerrarSesionCliente().then(() => router.push("/"));
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/panel" className={styles.navRestBtn}>
            Soy restaurante
          </Link>
        )}
      </nav>

      {/* CTA Banner — solo si no hay sesión */}
      {!clienteLogueado && (
        <div className={styles.ctaBanner}>
          <div className={styles.ctaBannerContent}>
            <p className={styles.ctaBannerText}>
              Crea tu cuenta y obtén los siguientes{" "}
              <button
                type="button"
                className={styles.ctaBeneficiosLink}
                onClick={() => setModalBeneficios(true)}
              >
                Beneficios
              </button>
              {" "}
              <button
                type="button"
                className={styles.ctaCrearBtn}
                onClick={() => setModalRegistro(true)}
              >
                Crear cuenta
              </button>
            </p>
            <p className={styles.ctaLoginText}>
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                className={styles.ctaLoginLink}
                onClick={() => setModalLogin(true)}
              >
                Inicia sesión
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Search hero */}
      <section className={styles.searchHero}>
        <div className={styles.searchHeroGlow} aria-hidden="true" />
        <div className={styles.searchHeroContent}>
          {primerNombre && (
            <p className={styles.bienvenido}>Bienvenido {primerNombre}</p>
          )}
          <h1 className={styles.searchTitle}>¿Qué se te antoja hoy?</h1>
          <p className={styles.searchSub}>
            Explora restaurantes y platillos de tu región
          </p>
          <div
            className={styles.searchWrap}
            role="search"
            aria-label="Buscar restaurantes o platillos"
          >
            <span className={styles.searchIconWrap} aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Busca restaurantes o comida… ej. Hamburguesa"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {query && (
              <button
                className={styles.searchClear}
                onClick={() => setQuery("")}
                aria-label="Limpiar búsqueda"
                type="button"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <main className={styles.main}>
        {buscando ? (
          hayResultados ? (
            <>
              <section className={styles.section}>
                {RestaurantesHeader}
                {restMostrar.length > 0 ? (
                  <div className={styles.resultsGrid}>
                    {restMostrar.map((r) => (
                      <RestCard key={r.id} r={r} />
                    ))}
                  </div>
                ) : (
                  <p className={styles.sectionEmpty}>
                    Ningún restaurante coincide con los filtros aplicados.
                  </p>
                )}
              </section>

              {platFiltrados.length > 0 && (
                <section className={styles.section}>
                  <p className={styles.sectionEyebrow}>Platillos</p>
                  <h2 className={styles.sectionTitle}>
                    {platFiltrados.length}{" "}
                    {platFiltrados.length === 1 ? "platillo encontrado" : "platillos encontrados"}
                  </h2>
                  <div className={`${styles.resultsGrid} ${styles.platGrid}`}>
                    {platFiltrados.map((p) => (
                      <PlatCard key={p.id} p={p} />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <section className={styles.emptyState}>
              <div className={styles.emptyIconWrap} aria-hidden="true">
                <ForkKnifeIcon />
              </div>
              <h2 className={styles.emptyTitle}>Sin resultados</h2>
              <p className={styles.emptySub}>
                No encontramos nada para &ldquo;{query}&rdquo;. Intenta con otra búsqueda.
              </p>
              <button className={styles.emptyBtn} onClick={() => setQuery("")} type="button">
                Ver todos
              </button>
            </section>
          )
        ) : (
          <>
            {restaurantes.length > 0 && (
              <section className={styles.section}>
                {RestaurantesHeader}
                {restMostrar.length > 0 ? (
                  <div className={styles.carousel}>
                    {restMostrar.map((r) => (
                      <RestCard key={r.id} r={r} />
                    ))}
                  </div>
                ) : (
                  <p className={styles.sectionEmpty}>
                    Ningún restaurante coincide con los filtros aplicados.{" "}
                    <button
                      className={styles.sectionEmptyLink}
                      onClick={() => { setColoniaFiltro(null); setEnvioDomicilioFiltro(false); }}
                      type="button"
                    >
                      Limpiar filtros
                    </button>
                  </p>
                )}
              </section>
            )}

            {platillos.length > 0 && (
              <section className={styles.section}>
                <p className={styles.sectionEyebrow}>Disponibles hoy</p>
                <h2 className={styles.sectionTitle}>Platillos del día</h2>
                <div className={`${styles.carousel} ${styles.platCarousel}`}>
                  {platillos.map((p) => (
                    <PlatCard key={p.id} p={p} />
                  ))}
                </div>
              </section>
            )}

            {promociones.length > 0 && (
              <div className={styles.promoWrap}>
                <AvisosCarousel avisos={promociones} titulo="Promociones" ariaLabel="Promociones de restaurantes abiertos" />
              </div>
            )}

            {restaurantes.length === 0 && platillos.length === 0 && (
              <section className={styles.emptyState}>
                <div className={styles.emptyIconWrap} aria-hidden="true">
                  <ForkKnifeIcon />
                </div>
                <h2 className={styles.emptyTitle}>Próximamente</h2>
                <p className={styles.emptySub}>
                  Pronto habrá restaurantes disponibles en tu región.
                </p>
              </section>
            )}
          </>
        )}
      </main>

      {/* ── Modals ── */}
      {modalPedidos && <ModalPedidos onClose={() => setModalPedidos(false)} />}
      {modalFavoritos && <ModalFavoritos onClose={() => setModalFavoritos(false)} />}
      {modalCercaDeTi && <ModalCercaDeTi onClose={() => setModalCercaDeTi(false)} />}
      {modalBeneficios && <ModalBeneficios onClose={() => setModalBeneficios(false)} />}
      {modalLogin && <ModalLogin onClose={() => setModalLogin(false)} onSuccess={handleAuthSuccess} />}
      {modalRegistro && <ModalRegistro onClose={() => setModalRegistro(false)} onSuccess={handleAuthSuccess} municipios={municipios} />}

      {/* Filter modal */}
      {modalAbierto && (
        <div className={styles.modalOverlay} onClick={cerrarModal} role="presentation">
          <div
            className={styles.modalPanel}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Filtros de búsqueda"
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Filtros</h2>
              <div className={styles.modalHeaderActions}>
                {(coloniaTemp !== null || envioDomicilioTemp) && (
                  <button className={styles.modalLimpiarBtn} onClick={limpiarFiltrosTemp} type="button">
                    Limpiar
                  </button>
                )}
                <button className={styles.modalCerrarBtn} onClick={cerrarModal} aria-label="Cerrar filtros" type="button">
                  <CloseIcon />
                </button>
              </div>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.filtroGrupo}>
                <label className={styles.filtroLabel} htmlFor="coloniaSelect">Colonia</label>
                <select
                  id="coloniaSelect"
                  className={styles.filtroSelect}
                  value={coloniaTemp ?? ""}
                  onChange={(e) => setColoniaTemp(e.target.value || null)}
                >
                  <option value="">Todas las colonias</option>
                  {todasColonias.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filtroGrupo}>
                <p className={styles.filtroLabel}>Envío a domicilio</p>
                <div className={styles.radioGroup}>
                  <button
                    type="button"
                    className={`${styles.radioChip} ${!envioDomicilioTemp ? styles.radioChipActivo : ""}`}
                    onClick={() => setEnvioDomicilioTemp(false)}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    className={`${styles.radioChip} ${envioDomicilioTemp ? styles.radioChipActivo : ""}`}
                    onClick={() => setEnvioDomicilioTemp(true)}
                  >
                    Con envío a domicilio
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.modalAplicarBtn} onClick={aplicarFiltros} type="button">
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
