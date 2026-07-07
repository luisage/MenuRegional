"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import styles from "./RegistroUsuario.module.css";
import {
  loginCliente,
  registrarCliente,
  obtenerColoniasPorMunicipio,
} from "@/app/lib/actions/clienteAuth";

// ── Types ────────────────────────────────────────────────────────────────────

type Beneficio = {
  titulo: string;
  descripcion: string;
  icon: React.ReactNode;
};

type MunicipioOpt = { id: string; nombre: string };
type ColoniaOpt = { id: string; nombre: string };
type Step1Data = {
  nombre: string;
  usuario: string;
  password: string;
  confirmarPassword: string;
};

const DEFAULT_CENTER: [number, number] = [20.0628, -99.2319];

// ── Dynamic map import ───────────────────────────────────────────────────────

const MapPicker = dynamic(
  () => import("@/app/explorar/[slug]/MapPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className={styles.mapaLoading}>Cargando mapa…</div>
    ),
  }
);

// ── Static data ──────────────────────────────────────────────────────────────

const beneficios: Beneficio[] = [
  {
    titulo: "Tus datos siempre listos",
    descripcion:
      "Guarda tu información para que cada pedido sea más rápido.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
          stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        />
        <path
          d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6"
          stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    titulo: "Repite tus favoritos",
    descripcion: "Vuelve a pedir tus platillos preferidos en un par de clics.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 4v4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    titulo: "Sigue tus pedidos",
    descripcion: "Consulta el estado de tus órdenes desde tu cuenta.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 6h18M3 12h18M3 18h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 16l3 3 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

// ── Icon helpers ─────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M2.5 12S5.5 5 12 5s9.5 7 9.5 7-3 7-9.5 7S2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.58 5.08A9.93 9.93 0 0 1 12 5c6.5 0 9.5 7 9.5 7a16.3 16.3 0 0 1-2.07 3.04M6.5 6.61C4.06 8.24 2.5 12 2.5 12s3 7 9.5 7a9.9 9.9 0 0 0 4.16-.92" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Modal de registro completo ────────────────────────────────────────────────

function ModalRegistro({
  onClose,
  onSuccess,
  municipios,
  step1,
}: {
  onClose: () => void;
  onSuccess: () => void;
  municipios: MunicipioOpt[];
  step1: Step1Data;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [municipioId, setMunicipioId] = useState("");
  const [colonias, setColonias] = useState<ColoniaOpt[]>([]);
  const [cargandoColonias, setCargandoColonias] = useState(false);
  const [coloniaSelId, setColoniaSelId] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [error]);

  function handleSelect(la: number, ln: number) {
    setLat(la); setLng(ln); setMapCenter([la, ln]);
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
        setLat(latitude); setLng(longitude);
        setMapCenter([latitude, longitude]);
        setLocLoading(false);
      },
      (err) => {
        setLocLoading(false);
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Permiso de ubicación denegado."
            : "No se pudo obtener tu ubicación. Intenta de nuevo."
        );
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
      // map stays at current center
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
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`${styles.modalPanel} ${styles.modalPanelLg}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Crear cuenta"
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Crear cuenta</h2>
          <button
            className={styles.modalCerrarBtn}
            onClick={onClose}
            aria-label="Cerrar"
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={`${styles.modalBody} ${styles.modalBodyRegistro}`}>

            {/* ── Encabezado ── */}
            <div className={styles.modalIntro}>
              <p className={styles.modalIntroStep}>Un último paso</p>
              <p className={styles.modalIntroDesc}>
                Completa estos datos para crear tu cuenta.
              </p>
            </div>

            {/* ── Tus datos ── */}
            <div className={styles.formSection}>
              <p className={styles.formSectionTitle}>Tus datos</p>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="reg-nombre">
                    Nombre completo *
                  </label>
                  <input
                    id="reg-nombre"
                    name="nombre"
                    type="text"
                    className={styles.formInput}
                    placeholder="Tu nombre"
                    defaultValue={step1.nombre}
                    autoComplete="name"
                    required
                    disabled={pending}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="reg-celular">
                    Celular *
                  </label>
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

            {/* ── Crea tu cuenta ── */}
            <div className={styles.formSection}>
              <p className={styles.formSectionTitle}>Crea tu cuenta</p>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="reg-usuario">
                    Usuario *
                  </label>
                  <input
                    id="reg-usuario"
                    name="usuario"
                    type="text"
                    className={styles.formInput}
                    placeholder="Nombre de usuario"
                    defaultValue={step1.usuario}
                    autoComplete="username"
                    required
                    disabled={pending}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="reg-password">
                    Contraseña *{" "}
                    <span className={styles.formLabelOpt}>(mín. 6)</span>
                  </label>
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    className={styles.formInput}
                    placeholder="Contraseña"
                    defaultValue={step1.password}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={pending}
                  />
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="reg-confirmar">
                  Confirmar contraseña *
                </label>
                <input
                  id="reg-confirmar"
                  name="confirmarPassword"
                  type="password"
                  className={styles.formInput}
                  placeholder="Repite tu contraseña"
                  defaultValue={step1.confirmarPassword}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  disabled={pending}
                />
              </div>
            </div>

            {/* ── Dirección ── */}
            <div className={styles.formSection}>
              <p className={styles.formSectionTitle}>Ingresa tu dirección</p>

              <div className={styles.formRowCalleNum}>
                <div className={styles.formField}>
                  <label className={styles.formLabel} htmlFor="reg-calle">
                    Calle *
                  </label>
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
                  <label className={styles.formLabel} htmlFor="reg-numero">
                    Número *
                  </label>
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

              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="reg-municipio">
                  Municipio *
                </label>
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
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="reg-colonia">
                  Colonia *
                </label>
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
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formField}>
                <p className={styles.formLabel}>Ubicación en el mapa *</p>
                <p className={styles.formHint}>
                  Toca el mapa para marcar tu domicilio
                </p>
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
                    {locLoading
                      ? "Obteniendo ubicación…"
                      : "Encontrar mi ubicación"}
                  </button>
                  {locError && (
                    <span className={styles.locError}>{locError}</span>
                  )}
                </div>
                <div className={styles.coordsRow}>
                  <div className={styles.coordField}>
                    <label className={styles.coordLabel} htmlFor="reg-lat">
                      Latitud
                    </label>
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
                    <label className={styles.coordLabel} htmlFor="reg-lng">
                      Longitud
                    </label>
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

              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="reg-referencias">
                  Referencias{" "}
                  <span className={styles.formLabelOpt}>(opcional)</span>
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

            {error && (
              <p ref={errorRef} className={styles.formError} role="alert">
                {error}
              </p>
            )}
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

// ── Componente principal ──────────────────────────────────────────────────────

export default function RegistroUsuario({
  municipios,
}: {
  municipios: MunicipioOpt[];
}) {
  const router = useRouter();
  const [inView, setInView] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Step-1 card form error
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Step-2 registration modal
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [showRegModal, setShowRegModal] = useState(false);

  // Login modal
  const [modalLogin, setModalLogin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPending, startLoginTransition] = useTransition();

  // ── Card form submit: validate and open modal ──
  function handleCardSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStep1Error(null);
    const fd = new FormData(e.currentTarget);
    const nombre = String(fd.get("nombre") || "").trim();
    const usuario = String(fd.get("usuario") || "").trim();
    const password = String(fd.get("password") || "");
    const confirmarPassword = String(fd.get("confirmarPassword") || "");

    if (!nombre) { setStep1Error("El nombre es requerido."); return; }
    if (!usuario) { setStep1Error("El usuario es requerido."); return; }
    if (!password || password.length < 6) {
      setStep1Error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmarPassword) {
      setStep1Error("Las contraseñas no coinciden.");
      return;
    }

    setStep1Data({ nombre, usuario, password, confirmarPassword });
    setShowRegModal(true);
  }

  function handleRegSuccess() {
    setShowRegModal(false);
    router.push("/explorar");
  }

  // ── Login modal handlers ──
  function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError(null);
    const fd = new FormData(e.currentTarget);
    startLoginTransition(async () => {
      const result = await loginCliente(fd);
      if ("error" in result) {
        setLoginError(result.error);
      } else {
        router.push("/explorar");
      }
    });
  }

  function cerrarModalLogin() {
    setModalLogin(false);
    setLoginError(null);
  }

  // ── Intersection observer for entrance animation ──
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section id="registro" ref={sectionRef} className={styles.section}>
        <div className={styles.glow} aria-hidden="true" />

        <div className={styles.shell}>
          <div className={`${styles.info} ${inView ? styles.inView : ""}`}>
            <span className={styles.eyebrow}>Crea tu cuenta</span>
            <h2 className={styles.title}>
              Pide más rápido <em>la próxima vez</em>
            </h2>
            <p className={styles.subtitle}>
              Da de alta tu cuenta, así tus datos estarán guardados y te será
              más fácil realizar tus pedidos.
            </p>

            <ul className={styles.benefits}>
              {beneficios.map((beneficio) => (
                <li className={styles.benefit} key={beneficio.titulo}>
                  <span className={styles.benefitIcon}>{beneficio.icon}</span>
                  <div>
                    <p className={styles.benefitTitle}>{beneficio.titulo}</p>
                    <p className={styles.benefitText}>{beneficio.descripcion}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={`${styles.formCard} ${inView ? styles.inView : ""}`}
          >
            <h3 className={styles.formTitle}>Crear cuenta</h3>

            <form className={styles.form} onSubmit={handleCardSubmit}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="registro-nombre">
                  Nombre
                </label>
                <input
                  id="registro-nombre"
                  name="nombre"
                  type="text"
                  autoComplete="name"
                  placeholder="Tu nombre completo"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="registro-usuario">
                  Usuario
                </label>
                <input
                  id="registro-usuario"
                  name="usuario"
                  type="text"
                  autoComplete="username"
                  placeholder="Elige un nombre de usuario"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="registro-password">
                  Contraseña
                </label>
                <div className={styles.passwordWrap}>
                  <input
                    id="registro-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Crea una contraseña"
                    className={styles.input}
                  />
                  <button
                    type="button"
                    className={styles.toggle}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="registro-confirmar">
                  Confirmar contraseña
                </label>
                <div className={styles.passwordWrap}>
                  <input
                    id="registro-confirmar"
                    name="confirmarPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repite tu contraseña"
                    className={styles.input}
                  />
                  <button
                    type="button"
                    className={styles.toggle}
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={
                      showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    <EyeIcon visible={showConfirm} />
                  </button>
                </div>
              </div>

              {step1Error && (
                <p className={styles.cardError} role="alert">
                  {step1Error}
                </p>
              )}

              <button type="submit" className={styles.submit}>
                Crear cuenta
              </button>

              <p className={styles.formFooter}>
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  className={styles.loginLink}
                  onClick={() => setModalLogin(true)}
                >
                  Inicia sesión
                </button>
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* ── Modal de registro completo ── */}
      {showRegModal && step1Data && (
        <ModalRegistro
          onClose={() => setShowRegModal(false)}
          onSuccess={handleRegSuccess}
          municipios={municipios}
          step1={step1Data}
        />
      )}

      {/* ── Modal de inicio de sesión ── */}
      {modalLogin && (
        <div
          className={styles.loginOverlay}
          role="presentation"
          onClick={cerrarModalLogin}
        >
          <div
            className={styles.loginPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Iniciar sesión"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.loginHeader}>
              <h2 className={styles.loginTitle}>Iniciar sesión</h2>
              <button
                type="button"
                className={styles.loginCloseBtn}
                aria-label="Cerrar"
                onClick={cerrarModalLogin}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M18 6 6 18M6 6l12 12"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleLoginSubmit}>
              <div className={styles.loginBody}>
                <div className={styles.loginField}>
                  <label className={styles.loginLabel} htmlFor="rl-usuario">
                    Usuario
                  </label>
                  <input
                    id="rl-usuario"
                    name="usuario"
                    type="text"
                    className={styles.loginInput}
                    placeholder="Tu nombre de usuario"
                    autoComplete="username"
                    required
                    disabled={loginPending}
                  />
                </div>
                <div className={styles.loginField}>
                  <label className={styles.loginLabel} htmlFor="rl-password">
                    Contraseña
                  </label>
                  <input
                    id="rl-password"
                    name="password"
                    type="password"
                    className={styles.loginInput}
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    required
                    disabled={loginPending}
                  />
                </div>
                {loginError && (
                  <p className={styles.loginError} role="alert">
                    {loginError}
                  </p>
                )}
              </div>
              <div className={styles.loginFooter}>
                <button
                  type="submit"
                  className={styles.loginSubmitBtn}
                  disabled={loginPending}
                >
                  {loginPending ? "Iniciando sesión…" : "Iniciar sesión"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
