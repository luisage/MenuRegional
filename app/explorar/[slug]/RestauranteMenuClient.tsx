"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CategoriaVistaPublica, CuentaClienteVista, PlatilloVistaPublica, SucursalVista } from "./page";
import CarritoScreen, { type ItemCarrito } from "./CarritoScreen";
import AvisosCarousel, { type AvisoVista } from "./AvisosCarousel";
import AuthCTASection from "@/app/explorar/AuthCTASection";
import styles from "./RestauranteMenu.module.css";

const RangoEnvioMapView = dynamic(() => import("./RangoEnvioMapView"), {
  ssr: false,
  loading: () => <div className={styles.rangoMapLoading}>Cargando mapa…</div>,
});

// ── Icons ──────────────────────────────────────────────────────────────
function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlateIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 9 9" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function TriangleDownIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
      <path d="M0 2h10L5 8.5z" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────
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
export default function RestauranteMenuClient({
  nombre,
  descripcion,
  logoUrl,
  portadaUrl,
  categorias,
  sucursal,
  sucursales,
  sucursalAbierta,
  avisos,
  platilloDestacadoId,
  cuentaCliente,
  municipios,
}: {
  nombre: string;
  descripcion: string | null;
  logoUrl: string | null;
  portadaUrl: string | null;
  categorias: CategoriaVistaPublica[];
  sucursal: SucursalVista | null;
  sucursales: SucursalVista[];
  sucursalAbierta: boolean;
  avisos: AvisoVista[];
  platilloDestacadoId: string | null;
  cuentaCliente: CuentaClienteVista | null;
  municipios: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState<{ url: string; alt: string } | null>(null);
  const [modalRangoMenu, setModalRangoMenu] = useState(false);

  // Modal state
  const [modalPlatillo, setModalPlatillo] = useState<PlatilloVistaPublica | null>(null);
  const [ingredDesSelec, setIngredDesSelec] = useState<Set<string>>(new Set());
  const [extrasSelec, setExtrasSelec] = useState<Set<string>>(new Set());

  // ── Buscador + categorías ────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState("");
  const [menuDropdownAbierto, setMenuDropdownAbierto] = useState(false);
  const [scrollTick, setScrollTick] = useState(0);
  const scrollTargetIdRef = useRef<string | null>(
    platilloDestacadoId ? `platillo-${platilloDestacadoId}` : null
  );

  const categoriasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return categorias;
    return categorias
      .map((cat) => ({
        ...cat,
        platillos: cat.platillos.filter((p) => p.nombre.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.platillos.length > 0);
  }, [categorias, busqueda]);

  useEffect(() => {
    if (!scrollTargetIdRef.current) return;
    document.getElementById(scrollTargetIdRef.current)?.scrollIntoView({ behavior: "smooth", block: "start" });
    scrollTargetIdRef.current = null;
  }, [scrollTick, categoriasFiltradas]);

  const irACategoria = (categoriaId: string) => {
    setMenuDropdownAbierto(false);
    setBusqueda("");
    scrollTargetIdRef.current = `categoria-${categoriaId}`;
    setScrollTick((t) => t + 1);
  };

  // ── Cambio de sucursal ───────────────────────────────────────────────
  const [sucursalPendienteId, setSucursalPendienteId] = useState<string | null>(null);

  const solicitarCambioSucursal = (nuevaSucursalId: string) => {
    if (!sucursal || nuevaSucursalId === sucursal.id) return;
    if (carrito.length > 0) {
      setSucursalPendienteId(nuevaSucursalId);
    } else {
      router.push(`?sucursalId=${nuevaSucursalId}`);
    }
  };

  const confirmarCambioSucursal = () => {
    if (!sucursalPendienteId) return;
    setCarrito([]);
    router.push(`?sucursalId=${sucursalPendienteId}`);
    setSucursalPendienteId(null);
  };

  const cancelarCambioSucursal = () => setSucursalPendienteId(null);

  // ── Salir al listado de restaurantes ──────────────────────────────────
  const [confirmSalirAbierto, setConfirmSalirAbierto] = useState(false);

  const handleBackClick = (e: React.MouseEvent) => {
    if (carrito.length > 0) {
      e.preventDefault();
      setConfirmSalirAbierto(true);
    }
  };

  const confirmarSalir = () => {
    setConfirmSalirAbierto(false);
    router.push("/explorar");
  };

  const cancelarSalir = () => setConfirmSalirAbierto(false);

  const totalItems = carrito.reduce((sum, i) => sum + i.cantidad, 0);
  const totalCosto = carrito.reduce((sum, i) => sum + i.costoTotal * i.cantidad, 0);

  function handleAuthSuccess() {
    router.refresh();
  }

  // Indicador de rango de envío: null = no mostrar, true = dentro, false = fuera
  const indicadorRango: boolean | null = (() => {
    if (!cuentaCliente || cuentaCliente.latitud === null || cuentaCliente.longitud === null) return null;
    if (!sucursal || !sucursal.envioDomicilio || !sucursal.rangoEnvio) return null;
    if (sucursal.latitud === null || sucursal.longitud === null) return null;
    const rango = parseFloat(sucursal.rangoEnvio);
    if (isNaN(rango) || rango <= 0) return null;
    const dist = haversineKm(cuentaCliente.latitud, cuentaCliente.longitud, sucursal.latitud, sucursal.longitud);
    return dist <= rango;
  })();

  const cantidadEnCarrito = (platilloId: string) =>
    carrito.filter((i) => i.platilloId === platilloId).reduce((sum, i) => sum + i.cantidad, 0);

  // ── Modal helpers ──────────────────────────────────────────────────
  const abrirModal = (plat: PlatilloVistaPublica) => {
    setModalPlatillo(plat);
    setIngredDesSelec(new Set());
    setExtrasSelec(new Set());
  };

  const cerrarModal = () => setModalPlatillo(null);

  const toggleIngrediente = (id: string) => {
    setIngredDesSelec((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleExtra = (id: string) => {
    setExtrasSelec((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const costoModalTotal = modalPlatillo
    ? parseFloat(modalPlatillo.costo) +
      modalPlatillo.extras
        .filter((e) => extrasSelec.has(e.id))
        .reduce((sum, e) => sum + parseFloat(e.costo), 0)
    : 0;

  // ── Cart helpers ───────────────────────────────────────────────────
  const flashJustAdded = (platilloId: string) => {
    setJustAdded((prev) => new Set([...prev, platilloId]));
    setTimeout(() => {
      setJustAdded((prev) => {
        const next = new Set(prev);
        next.delete(platilloId);
        return next;
      });
    }, 750);
  };

  const guardarEnCarrito = () => {
    if (!modalPlatillo) return;
    const costoBase = parseFloat(modalPlatillo.costo);
    const extrasAgregados = modalPlatillo.extras
      .filter((e) => extrasSelec.has(e.id))
      .map((e) => ({ id: e.id, nombre: e.nombre, costo: parseFloat(e.costo) }));
    const costoTotal = costoBase + extrasAgregados.reduce((s, e) => s + e.costo, 0);
    const ingredientesQuitados = modalPlatillo.ingredientes
      .filter((i) => i.opcional && ingredDesSelec.has(i.id))
      .map((i) => i.nombre);

    setCarrito((prev) => {
      const ingsKey = [...ingredientesQuitados].sort().join("|");
      const extrasKey = [...extrasAgregados.map((e) => e.id)].sort().join("|");
      const uid = `${modalPlatillo.id}__${ingsKey}__${extrasKey}`;

      const idx = prev.findIndex((item) => item.uid === uid);

      if (idx >= 0) {
        return prev.map((item, i) =>
          i === idx ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [
        ...prev,
        {
          uid, platilloId: modalPlatillo.id, nombre: modalPlatillo.nombre,
          costoBase, costoTotal, cantidad: 1, imagenUrl: modalPlatillo.imagenUrl,
          ingredientesQuitados, extrasAgregados,
        },
      ];
    });

    flashJustAdded(modalPlatillo.id);
    cerrarModal();
  };

  const agregarDirecto = (plat: PlatilloVistaPublica) => {
    const costoBase = parseFloat(plat.costo);
    const uid = `${plat.id}____`; // no config — always unique per platillo
    setCarrito((prev) => {
      const idx = prev.findIndex((i) => i.uid === uid);
      if (idx >= 0) {
        return prev.map((item, i) =>
          i === idx ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [
        ...prev,
        {
          uid, platilloId: plat.id, nombre: plat.nombre, costoBase, costoTotal: costoBase,
          cantidad: 1, imagenUrl: plat.imagenUrl, ingredientesQuitados: [], extrasAgregados: [],
        },
      ];
    });
    flashJustAdded(plat.id);
  };

  const incrementarItem = (uid: string) => {
    setCarrito((prev) =>
      prev.map((item) => item.uid === uid ? { ...item, cantidad: item.cantidad + 1 } : item)
    );
  };

  const decrementarItem = (uid: string) => {
    setCarrito((prev) =>
      prev
        .map((item) => item.uid === uid ? { ...item, cantidad: item.cantidad - 1 } : item)
        .filter((item) => item.cantidad > 0)
    );
  };

  // Close checkout automatically if cart becomes empty
  useEffect(() => {
    if (carritoAbierto && carrito.length === 0) {
      setCarritoAbierto(false);
    }
  }, [carrito.length, carritoAbierto]);

  const handleAddClick = (plat: PlatilloVistaPublica) => {
    if (plat.ingredientes.length > 0 || plat.extras.length > 0) {
      abrirModal(plat);
    } else {
      agregarDirecto(plat);
    }
  };

  return (
    <>
      <div className={`${styles.page} ${totalItems > 0 ? styles.pageWithCart : ""}`}>
        {/* ── Top navigation ── */}
        <nav className={styles.topNav} aria-label="Navegación">
          <Link href="/explorar" className={styles.navBack} onClick={handleBackClick}>
            <BackIcon />
            <span>Restaurantes</span>
          </Link>

          <div className={styles.menuSearchWrap}>
            <div className={styles.menuDropdownWrap}>
              <button
                type="button"
                className={styles.menuDropdownBtn}
                aria-haspopup="listbox"
                aria-expanded={menuDropdownAbierto}
                onClick={() => categorias.length > 0 && setMenuDropdownAbierto((v) => !v)}
              >
                Menú
                <span className={`${styles.menuTriangle} ${menuDropdownAbierto ? styles.menuTriangleOpen : ""}`}>
                  <TriangleDownIcon />
                </span>
              </button>

              {menuDropdownAbierto && (
                <>
                  <div className={styles.dropdownBackdrop} onClick={() => setMenuDropdownAbierto(false)} />
                  <ul className={styles.categoriaDropdown} role="listbox" aria-label="Categorías del menú">
                    {categorias.map((cat) => (
                      <li key={cat.id}>
                        <button
                          type="button"
                          className={styles.categoriaDropdownItem}
                          onClick={() => irACategoria(cat.id)}
                        >
                          {cat.nombre}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <span className={styles.menuSearchDivider} aria-hidden="true" />

            <div className={styles.menuSearchInputWrap}>
              <input
                type="text"
                className={styles.menuSearchInput}
                placeholder="Busca en el menú..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar platillos en el menú"
              />
              {busqueda && (
                <button
                  type="button"
                  className={styles.menuSearchClear}
                  aria-label="Limpiar búsqueda"
                  onClick={() => setBusqueda("")}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          </div>

          <Link href="/" className={styles.navBrand}>
            Menú <b>Regional</b>
          </Link>
        </nav>

        {/* ── CTA para usuarios sin sesión ── */}
        {!cuentaCliente && (
          <AuthCTASection municipios={municipios} onAuthSuccess={handleAuthSuccess} />
        )}

        {/* ── Restaurant header ── */}
        <header className={styles.restauranteHeader}>
          {portadaUrl ? (
            <>
              <img src={portadaUrl} alt="" className={styles.coverImg} aria-hidden="true" />
              <div className={styles.coverScrim} aria-hidden="true" />
            </>
          ) : (
            <div className={styles.headerGlow} aria-hidden="true" />
          )}
          <div className={styles.headerContent}>
            <div className={styles.logoWrap}>
              {logoUrl ? (
                <img src={logoUrl} alt={`Logo de ${nombre}`} className={styles.logo} />
              ) : (
                <span className={styles.logoPlaceholder} aria-hidden="true">
                  {nombre.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h1 className={styles.restauranteNombre}>{nombre}</h1>
            {descripcion && <p className={styles.restauranteDesc}>{descripcion}</p>}
            {sucursales.length > 1 ? (
              <div className={styles.sucursalSelectWrap}>
                <select
                  className={styles.sucursalSelect}
                  value={sucursal?.id ?? ""}
                  onChange={(e) => solicitarCambioSucursal(e.target.value)}
                  aria-label="Selecciona la sucursal"
                >
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
                <span className={styles.sucursalSelectChevron} aria-hidden="true">
                  <TriangleDownIcon />
                </span>
              </div>
            ) : (
              <span className={styles.menuEyebrow}>Menú</span>
            )}
            {sucursal && (
              <span className={styles.estadoSucursal}>
                <span
                  className={`${styles.estadoDot} ${sucursalAbierta ? styles.estadoDotAbierto : styles.estadoDotCerrado}`}
                  aria-hidden="true"
                />
                {sucursalAbierta ? "Abierto" : "Cerrado"}
              </span>
            )}
          </div>
        </header>

        {/* ── Menu ── */}
        <main className={styles.main}>
          {indicadorRango !== null && (
            <div className={`${styles.rangoIndicador} ${indicadorRango ? styles.rangoIndicadorOk : styles.rangoIndicadorFuera}`}>
              <span className={styles.rangoIndicadorTexto}>
                {indicadorRango
                  ? "Tu domicilio está dentro del rango de envío"
                  : "Tu domicilio está fuera del rango de envío de la sucursal"}
              </span>
              <button
                type="button"
                className={styles.rangoVerBtn}
                onClick={() => setModalRangoMenu(true)}
              >
                Ver rango
              </button>
            </div>
          )}

          {modalRangoMenu && sucursal && sucursal.latitud !== null && sucursal.longitud !== null && sucursal.rangoEnvio && cuentaCliente && cuentaCliente.latitud !== null && cuentaCliente.longitud !== null && (
            <div
              className={styles.rangoMapOverlay}
              role="dialog"
              aria-modal="true"
              aria-label="Rango de envío"
              onClick={(e) => { if (e.target === e.currentTarget) setModalRangoMenu(false); }}
            >
              <div className={styles.rangoMapPanel}>
                <div className={styles.rangoMapHeader}>
                  <span className={styles.rangoMapTitulo}>Rango de envío</span>
                  <button
                    type="button"
                    className={styles.rangoMapCloseBtn}
                    aria-label="Cerrar"
                    onClick={() => setModalRangoMenu(false)}
                  >
                    <CloseIcon />
                  </button>
                </div>
                <div className={styles.rangoMapWrap}>
                  <RangoEnvioMapView
                    sucursalNombre={nombre}
                    sucursalLat={sucursal.latitud}
                    sucursalLng={sucursal.longitud}
                    rangoKm={parseFloat(sucursal.rangoEnvio)}
                    userLat={cuentaCliente.latitud}
                    userLng={cuentaCliente.longitud}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Callout heading ── */}
          <div className={styles.ordenCallout}>
            <p className={styles.ordenCalloutEyebrow}>Menú disponible</p>
            <h2 className={styles.ordenCalloutTitulo}>
              Elige y ordena <em>tu pedido!</em>
            </h2>
          </div>

          <AvisosCarousel avisos={avisos} />

          {categorias.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}><PlateIcon /></span>
              <p className={styles.emptyTitle}>Sin platillos disponibles</p>
              <p className={styles.emptyDesc}>Este restaurante aún no tiene platillos en su menú.</p>
            </div>
          ) : categoriasFiltradas.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}><PlateIcon /></span>
              <p className={styles.emptyTitle}>Sin resultados</p>
              <p className={styles.emptyDesc}>No encontramos platillos que coincidan con &ldquo;{busqueda}&rdquo;.</p>
            </div>
          ) : (
            <div className={styles.menu}>
              {categoriasFiltradas.map((cat) => (
                <section key={cat.id} id={`categoria-${cat.id}`} className={styles.categoriaSection}>
                  <div className={styles.categoriaHeader}>
                    <h2 className={styles.categoriaNombre}>{cat.nombre}</h2>
                    <span className={styles.categoriaLine} aria-hidden="true" />
                  </div>
                  <div className={styles.platillosGrid}>
                    {cat.platillos.map((plat) => {
                      const cantidad = cantidadEnCarrito(plat.id);
                      const fueAgregado = justAdded.has(plat.id);
                      return (
                        <article
                          key={plat.id}
                          id={`platillo-${plat.id}`}
                          className={`${styles.platilloCard} ${plat.id === platilloDestacadoId ? styles.platilloDestacado : ""}`}
                        >
                          <div className={styles.cardImgWrap}>
                            {plat.imagenUrl ? (
                              <button
                                type="button"
                                className={styles.cardImgBtn}
                                aria-label={`Ver imagen de ${plat.nombre} en tamaño completo`}
                                onClick={() => setImagenAmpliada({ url: plat.imagenUrl!, alt: plat.nombre })}
                              >
                                <img src={plat.imagenUrl} alt={plat.nombre} className={styles.cardImg} loading="lazy" />
                              </button>
                            ) : (
                              <span className={styles.cardImgPlaceholder} aria-hidden="true">
                                <PlateIcon />
                              </span>
                            )}
                            {cantidad > 0 && (
                              <span className={styles.cantidadBadge} aria-label={`${cantidad} en tu pedido`}>
                                {cantidad}
                              </span>
                            )}
                          </div>
                          <div className={styles.cardContent}>
                            <span className={styles.cardNombre}>{plat.nombre}</span>
                            {plat.descripcion && (
                              <span className={styles.cardDesc}>{plat.descripcion}</span>
                            )}
                            <span className={styles.cardCosto}>${Number(plat.costo).toFixed(2)}</span>
                          </div>
                          <div className={styles.cardActions}>
                            <button
                              type="button"
                              className={`${styles.addBtn} ${fueAgregado ? styles.addBtnDone : ""}`}
                              aria-label={`Agregar ${plat.nombre} al pedido`}
                              onClick={() => handleAddClick(plat)}
                            >
                              {fueAgregado ? <CheckIcon /> : <PlusIcon />}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>

        {/* ── Pie de página ── */}
        <footer className={styles.pageFooter}>
          <h2 className={styles.pageFooterNombre}>{nombre}</h2>
          {descripcion && <p className={styles.pageFooterDesc}>{descripcion}</p>}

          {sucursales.length > 1 ? (
            <ul className={styles.pageFooterSucursales}>
              {sucursales.map((s) => (
                <li key={s.id} className={styles.pageFooterSucursal}>
                  <span className={styles.pageFooterSucursalNombre}>{s.nombre}</span>
                  <span className={styles.pageFooterDireccion}>{s.direccion}</span>
                </li>
              ))}
            </ul>
          ) : sucursal ? (
            <p className={styles.pageFooterDireccion}>{sucursal.direccion}</p>
          ) : null}
        </footer>

        {/* ── Carrito flotante ── */}
        {totalItems > 0 && (
          <button
            type="button"
            className={styles.carritoFloat}
            onClick={() => setCarritoAbierto(true)}
            aria-label={`Ver pedido: ${totalItems} platillo${totalItems !== 1 ? "s" : ""}, $${totalCosto.toFixed(2)}`}
          >
            <div className={styles.carritoFloatInner}>
              <span className={styles.carritoFloatBadge} aria-hidden="true">{totalItems}</span>
              <span className={styles.carritoFloatIconWrap} aria-hidden="true"><CartIcon /></span>
              <span className={styles.carritoFloatLabel}>
                {totalItems === 1 ? "1 platillo" : `${totalItems} platillos`}
              </span>
              <span className={styles.carritoFloatSep} aria-hidden="true">·</span>
              <span className={styles.carritoFloatCosto}>${totalCosto.toFixed(2)}</span>
            </div>
          </button>
        )}

        {/* ── Modal ingredientes + extras ── */}
        {modalPlatillo && (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-label={`Personalizar ${modalPlatillo.nombre}`}
            onClick={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}
          >
            <div className={styles.modalPanel}>
              <div className={styles.modalHeader}>
                <div className={styles.modalHeaderInfo}>
                  {modalPlatillo.imagenUrl && (
                    <img src={modalPlatillo.imagenUrl} alt={modalPlatillo.nombre} className={styles.modalImgThumb} />
                  )}
                  <div>
                    <p className={styles.modalPlatilloNombre}>{modalPlatillo.nombre}</p>
                    <p className={styles.modalPlatilloCostoBase}>${Number(modalPlatillo.costo).toFixed(2)}</p>
                  </div>
                </div>
                <button type="button" className={styles.modalCloseBtn} aria-label="Cerrar" onClick={cerrarModal}>
                  <CloseIcon />
                </button>
              </div>

              <div className={styles.modalBody}>
                {modalPlatillo.ingredientes.length > 0 && (
                  <div className={styles.modalSeccion}>
                    <p className={styles.modalSeccionTitulo}>Ingredientes</p>
                    <p className={styles.modalSeccionNota}>Desmarca lo que no quieras en tu platillo</p>
                    <ul className={styles.opcionesList} role="list">
                      {modalPlatillo.ingredientes.map((ing) => (
                        <li key={ing.id} className={styles.opcionItem}>
                          {ing.opcional ? (
                            <label className={styles.opcionLabel}>
                              <input
                                type="checkbox"
                                className={styles.checkboxInput}
                                checked={!ingredDesSelec.has(ing.id)}
                                onChange={() => toggleIngrediente(ing.id)}
                              />
                              <span className={styles.checkboxCustom} aria-hidden="true" />
                              <span className={styles.opcionNombre}>{ing.nombre}</span>
                            </label>
                          ) : (
                            <span className={styles.opcionFija}>
                              <span className={styles.lockIcon}><LockIcon /></span>
                              <span className={styles.opcionNombre}>{ing.nombre}</span>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {modalPlatillo.extras.length > 0 && (
                  <div className={styles.modalSeccion}>
                    <p className={styles.modalSeccionTitulo}>Extras</p>
                    <p className={styles.modalSeccionNota}>Agrega lo que quieras a tu platillo</p>
                    <ul className={styles.opcionesList} role="list">
                      {modalPlatillo.extras.map((extra) => (
                        <li key={extra.id} className={styles.opcionItem}>
                          <label className={styles.opcionLabel}>
                            <input
                              type="checkbox"
                              className={styles.checkboxInput}
                              checked={extrasSelec.has(extra.id)}
                              onChange={() => toggleExtra(extra.id)}
                            />
                            <span className={styles.checkboxCustom} aria-hidden="true" />
                            <span className={styles.opcionNombreExtra}>
                              <span className={styles.opcionNombre}>{extra.nombre}</span>
                              {extra.descripcion && (
                                <span className={styles.opcionDescExtra}>{extra.descripcion}</span>
                              )}
                            </span>
                            <span className={styles.extraCosto}>+${Number(extra.costo).toFixed(2)}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <div className={styles.modalTotalRow}>
                  <span className={styles.modalTotalLabel}>Total</span>
                  <span className={styles.modalTotalCosto}>${costoModalTotal.toFixed(2)}</span>
                </div>
                <button type="button" className={styles.guardarBtn} onClick={guardarEnCarrito}>
                  Agregar al pedido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Confirmar cambio de sucursal ── */}
        {sucursalPendienteId && (
          <div
            className={styles.confirmOverlay}
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirmar cambio de sucursal"
            onClick={(e) => { if (e.target === e.currentTarget) cancelarCambioSucursal(); }}
          >
            <div className={styles.confirmPanel}>
              <p className={styles.confirmTitle}>¿Cambiar de sucursal?</p>
              <p className={styles.confirmDesc}>
                En caso de cambiarse de Sucursal se quitarán los platillos elegidos.
              </p>
              <div className={styles.confirmActions}>
                <button type="button" className={styles.confirmCancelBtn} onClick={cancelarCambioSucursal}>
                  Cancelar
                </button>
                <button type="button" className={styles.confirmAcceptBtn} onClick={confirmarCambioSucursal}>
                  Cambiar sucursal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Confirmar salida al listado de restaurantes ── */}
        {confirmSalirAbierto && (
          <div
            className={styles.confirmOverlay}
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirmar salida del menú"
            onClick={(e) => { if (e.target === e.currentTarget) cancelarSalir(); }}
          >
            <div className={styles.confirmPanel}>
              <p className={styles.confirmTitle}>¿Salir del menú?</p>
              <p className={styles.confirmDesc}>
                Si sales del menú se quitarán los platillos seleccionados.
              </p>
              <div className={styles.confirmActions}>
                <button type="button" className={styles.confirmCancelBtn} onClick={cancelarSalir}>
                  Cancelar
                </button>
                <button type="button" className={styles.confirmAcceptBtn} onClick={confirmarSalir}>
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Imagen del platillo en tamaño completo ── */}
        {imagenAmpliada && (
          <div
            className={styles.lightboxOverlay}
            role="dialog"
            aria-modal="true"
            aria-label={`Imagen de ${imagenAmpliada.alt} en tamaño completo`}
            onClick={(e) => { if (e.target === e.currentTarget) setImagenAmpliada(null); }}
          >
            <button
              type="button"
              className={styles.lightboxCloseBtn}
              aria-label="Cerrar"
              onClick={() => setImagenAmpliada(null)}
            >
              <CloseIcon />
            </button>
            <img src={imagenAmpliada.url} alt={imagenAmpliada.alt} className={styles.lightboxImg} />
          </div>
        )}
      </div>

      {/* ── Pantalla de checkout ── */}
      {carritoAbierto && sucursal && (
        <CarritoScreen
          carrito={carrito}
          restauranteNombre={nombre}
          sucursal={sucursal}
          cuentaCliente={cuentaCliente}
          onClose={() => setCarritoAbierto(false)}
          onIncrementar={incrementarItem}
          onDecrementar={decrementarItem}
        />
      )}
    </>
  );
}
