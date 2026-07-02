"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import {
  loginCliente,
  registrarCliente,
  obtenerColoniasPorMunicipio,
} from "@/app/lib/actions/clienteAuth";
import styles from "./Explorar.module.css";

const MapPicker = dynamic(() => import("@/app/explorar/[slug]/MapPickerMap"), {
  ssr: false,
  loading: () => <div className={styles.mapaLoading}>Cargando mapa…</div>,
});

const BENEFICIOS = [
  { emoji: "✅", titulo: "Pide más rápido", desc: "con tus datos guardados, hacer un pedido será muy fácil" },
  { emoji: "📍", titulo: "Da seguimiento a tu orden", desc: "sabrás en todo momento en qué paso va tu orden" },
  { emoji: "📋", titulo: "Historial de pedidos", desc: "revisa todo lo que has pedido antes, cuando quieras" },
  { emoji: "🍽️", titulo: "Restaurantes cerca de ti", desc: "descubre qué restaurantes están cerca de tu domicilio" },
  { emoji: "🚚", titulo: "Verifica tu zona de envío", desc: "sabrás al instante si tu domicilio está dentro del rango de entrega del restaurante" },
  { emoji: "⭐", titulo: "Tus favoritos siempre a la mano", desc: "guarda los restaurantes que más te gustan" },
  { emoji: "🎁", titulo: "Sé un cliente frecuente", desc: "el restaurante te identificará y podrá darte un trato especial" },
];

const DEFAULT_CENTER: [number, number] = [20.0628, -99.2319];

type MunicipioOpt = { id: string; nombre: string };
type ColoniaOpt = { id: string; nombre: string };

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

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
              <label className={styles.formLabel} htmlFor="auth-cta-usuario">Usuario</label>
              <input
                id="auth-cta-usuario"
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
              <label className={styles.formLabel} htmlFor="auth-cta-password">Contraseña</label>
              <input
                id="auth-cta-password"
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

            <div className={styles.formSection}>
              <p className={styles.formSectionTitle}>Tus datos</p>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="auth-reg-nombre">Nombre completo *</label>
                  <input
                    id="auth-reg-nombre"
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
                  <label className={styles.formLabel} htmlFor="auth-reg-celular">Celular *</label>
                  <input
                    id="auth-reg-celular"
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

            <div className={styles.formSection}>
              <p className={styles.formSectionTitle}>Crea tu cuenta</p>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="auth-reg-usuario">Usuario *</label>
                  <input
                    id="auth-reg-usuario"
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
                  <label className={styles.formLabel} htmlFor="auth-reg-password">
                    Contraseña * <span className={styles.formLabelOpt}>(mín. 6)</span>
                  </label>
                  <input
                    id="auth-reg-password"
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
                <label className={styles.formLabel} htmlFor="auth-reg-confirmar">Confirmar contraseña *</label>
                <input
                  id="auth-reg-confirmar"
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

            <div className={styles.formSection}>
              <p className={styles.formSectionTitle}>Ingresa tu dirección</p>

              <div className={styles.formRowCalleNum}>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="auth-reg-calle">Calle *</label>
                  <input
                    id="auth-reg-calle"
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
                  <label className={styles.formLabel} htmlFor="auth-reg-numero">Número *</label>
                  <input
                    id="auth-reg-numero"
                    name="numero"
                    type="text"
                    className={styles.formInput}
                    placeholder="Ej. 12 B"
                    required
                    disabled={pending}
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="auth-reg-municipio">Municipio *</label>
                <select
                  id="auth-reg-municipio"
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

              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="auth-reg-colonia">Colonia *</label>
                <select
                  id="auth-reg-colonia"
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
                    <label className={styles.coordLabel} htmlFor="auth-reg-lat">Latitud</label>
                    <input
                      id="auth-reg-lat"
                      type="text"
                      className={`${styles.formInput} ${styles.coordInput}`}
                      value={lat !== null ? lat.toFixed(7) : ""}
                      readOnly
                      placeholder="—"
                    />
                  </div>
                  <div className={styles.coordField}>
                    <label className={styles.coordLabel} htmlFor="auth-reg-lng">Longitud</label>
                    <input
                      id="auth-reg-lng"
                      type="text"
                      className={`${styles.formInput} ${styles.coordInput}`}
                      value={lng !== null ? lng.toFixed(7) : ""}
                      readOnly
                      placeholder="—"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="auth-reg-referencias">
                  Referencias <span className={styles.formLabelOpt}>(opcional)</span>
                </label>
                <textarea
                  id="auth-reg-referencias"
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

export default function AuthCTASection({
  municipios,
  onAuthSuccess,
}: {
  municipios: { id: string; nombre: string }[];
  onAuthSuccess: () => void;
}) {
  const [modalBeneficios, setModalBeneficios] = useState(false);
  const [modalLogin, setModalLogin] = useState(false);
  const [modalRegistro, setModalRegistro] = useState(false);

  function handleSuccess() {
    setModalLogin(false);
    setModalRegistro(false);
    onAuthSuccess();
  }

  return (
    <>
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

      {modalBeneficios && <ModalBeneficios onClose={() => setModalBeneficios(false)} />}
      {modalLogin && <ModalLogin onClose={() => setModalLogin(false)} onSuccess={handleSuccess} />}
      {modalRegistro && (
        <ModalRegistro
          onClose={() => setModalRegistro(false)}
          onSuccess={handleSuccess}
          municipios={municipios}
        />
      )}
    </>
  );
}
