"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import styles from "./RegistroRestaurante.module.css";
import { registrarRestaurante } from "@/app/lib/actions/restaurante";
import { obtenerColoniasPorMunicipio } from "@/app/lib/actions/ubicacion";
import { subirImagenDirecto } from "@/app/lib/uploadCloudinary";

type Beneficio = {
  texto: string;
  icon: React.ReactNode;
};

const beneficios: Beneficio[] = [
  {
    texto: "Da a conocer tu restaurante y comida",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 11v2a2 2 0 0 0 2 2h1l3 5 1-5h2l8 4V5L12 9H6a2 2 0 0 0-2 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    texto: "Obtén tu menú interactivo con código QR",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <path
          d="M14 14h3v3h-3v-3ZM21 14v3M14 21h3M21 21v-1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    texto: "Tu menú a la mano de todos",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="6" y="2" width="12" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
        <path
          d="M10 18h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2.5 12S5.5 5 12 5s9.5 7 9.5 7-3 7-9.5 7S2.5 12 2.5 12Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.58 5.08A9.93 9.93 0 0 1 12 5c6.5 0 9.5 7 9.5 7a16.3 16.3 0 0 1-2.07 3.04M6.5 6.61C4.06 8.24 2.5 12 2.5 12s3 7 9.5 7a9.9 9.9 0 0 0 4.16-.92"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.88 9.88a3 3 0 0 0 4.24 4.24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="14" r="3.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 5l14 14M19 5L5 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Opcion = { id: string; nombre: string };

type DatosCuenta = {
  nombreRestaurante: string;
  tipoComida: string;
  password: string;
  confirmarPassword: string;
};

type Props = {
  municipios: Opcion[];
  colonias: Opcion[];
  municipioPorDefectoId: string | null;
};

export default function RegistroRestaurante({ municipios, colonias: coloniasPorDefecto, municipioPorDefectoId }: Props) {
  const [inView, setInView] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const [datos, setDatos] = useState<DatosCuenta>({
    nombreRestaurante: "",
    tipoComida: "",
    password: "",
    confirmarPassword: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [nombreDueno, setNombreDueno] = useState("");
  const [celular, setCelular] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);

  // Dirección de la sucursal
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [municipioId, setMunicipioId] = useState(municipioPorDefectoId ?? "");
  const [colonias, setColonias] = useState<Opcion[]>(coloniasPorDefecto);
  const [coloniaId, setColoniaId] = useState(coloniasPorDefecto[0]?.id ?? "");
  const [loadingColonias, setLoadingColonias] = useState(false);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!modalOpen) return;

    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cerrarModal();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  useEffect(() => {
    return () => {
      if (imagenPreview) URL.revokeObjectURL(imagenPreview);
    };
  }, [imagenPreview]);

  function cerrarModal() {
    setModalOpen(false);
    setModalError(null);
    setNombreDueno("");
    setCelular("");
    setImagen(null);
    if (imagenPreview) {
      URL.revokeObjectURL(imagenPreview);
      setImagenPreview(null);
    }
    setCalle("");
    setNumero("");
    setMunicipioId(municipioPorDefectoId ?? "");
    setColonias(coloniasPorDefecto);
    setColoniaId(coloniasPorDefecto[0]?.id ?? "");
  }

  function handleDatosChange(campo: keyof DatosCuenta, valor: string) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  function handleContinuar(event: React.FormEvent) {
    event.preventDefault();

    if (
      !datos.nombreRestaurante.trim() ||
      !datos.tipoComida.trim() ||
      !datos.password ||
      !datos.confirmarPassword
    ) {
      setFormError("Completa todos los campos.");
      return;
    }
    if (datos.password.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (datos.password !== datos.confirmarPassword) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }

    setFormError(null);
    setModalError(null);
    setModalOpen(true);
  }

  function handleImagenChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (imagenPreview) URL.revokeObjectURL(imagenPreview);
    setImagen(file);
    setImagenPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleMunicipioChange(id: string) {
    setMunicipioId(id);
    setColoniaId("");
    setLoadingColonias(true);
    try {
      const nuevasColonias = await obtenerColoniasPorMunicipio(id);
      setColonias(nuevasColonias);
      setColoniaId(nuevasColonias[0]?.id ?? "");
    } finally {
      setLoadingColonias(false);
    }
  }

  function handleRegistrar(event: React.FormEvent) {
    event.preventDefault();

    if (!nombreDueno.trim() || !celular.trim()) {
      setModalError("Completa el nombre del dueño y tu teléfono celular.");
      return;
    }
    if (!calle.trim() || !numero.trim()) {
      setModalError("Ingresa la calle y número de la sucursal.");
      return;
    }
    if (!coloniaId) {
      setModalError("Selecciona una colonia.");
      return;
    }

    setModalError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("nombreRestaurante", datos.nombreRestaurante);
      formData.set("tipoComida", datos.tipoComida);
      formData.set("password", datos.password);
      formData.set("confirmarPassword", datos.confirmarPassword);
      formData.set("nombreDueno", nombreDueno);
      formData.set("celular", celular);
      formData.set("calle", calle);
      formData.set("numero", numero);
      formData.set("coloniaId", coloniaId);

      if (imagen) {
        try {
          const { url, publicId } = await subirImagenDirecto(imagen, "menu_regional/restaurantes");
          formData.set("logoUrl", url);
          formData.set("logoPublicId", publicId);
        } catch {
          setModalError("No se pudo subir la imagen. Inténtalo de nuevo.");
          return;
        }
      }

      const result = await registrarRestaurante(formData);
      if (result?.error) setModalError(result.error);
    });
  }

  return (
    <section id="registro-restaurante" ref={sectionRef} className={styles.section}>
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.shell}>
        <div className={`${styles.formCard} ${inView ? styles.inView : ""}`}>
          <h3 className={styles.formTitle}>Registrar restaurante</h3>

          <form className={styles.form} onSubmit={handleContinuar}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="restaurante-nombre">
                Nombre del restaurante
              </label>
              <input
                id="restaurante-nombre"
                name="nombreRestaurante"
                type="text"
                autoComplete="organization"
                placeholder="Nombre de tu restaurante"
                className={styles.input}
                value={datos.nombreRestaurante}
                onChange={(e) => handleDatosChange("nombreRestaurante", e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="restaurante-tipo">
                Tipo de comida
              </label>
              <input
                id="restaurante-tipo"
                name="tipoComida"
                type="text"
                placeholder="Tipo de comida"
                className={styles.input}
                value={datos.tipoComida}
                onChange={(e) => handleDatosChange("tipoComida", e.target.value)}
              />
              <p className={styles.hint}>
                Ejemplo: Antojitos, Postres, Bebidas, comida casera.
              </p>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="restaurante-password">
                Contraseña
              </label>
              <div className={styles.passwordWrap}>
                <input
                  id="restaurante-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Crea una contraseña"
                  className={styles.input}
                  value={datos.password}
                  onChange={(e) => handleDatosChange("password", e.target.value)}
                />
                <button
                  type="button"
                  className={styles.toggle}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="restaurante-confirmar">
                Confirmar contraseña
              </label>
              <div className={styles.passwordWrap}>
                <input
                  id="restaurante-confirmar"
                  name="confirmarPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repite tu contraseña"
                  className={styles.input}
                  value={datos.confirmarPassword}
                  onChange={(e) => handleDatosChange("confirmarPassword", e.target.value)}
                />
                <button
                  type="button"
                  className={styles.toggle}
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <EyeIcon visible={showConfirm} />
                </button>
              </div>
            </div>

            {formError && <p className={styles.error}>{formError}</p>}

            <button type="submit" className={styles.submit}>
              Registrar restaurante
            </button>
          </form>
        </div>

        <div className={`${styles.info} ${inView ? styles.inView : ""}`}>
          <span className={styles.eyebrow}>Registra tu restaurante</span>
          <h2 className={styles.title}>¿Eres dueño de un restaurante?</h2>
          <p className={styles.subtitle}>
            Registra tu restaurante de manera gratis y obtén los siguientes
            beneficios:
          </p>

          <ul className={styles.benefits}>
            {beneficios.map((beneficio) => (
              <li className={styles.benefit} key={beneficio.texto}>
                <span className={styles.benefitIcon}>{beneficio.icon}</span>
                <p className={styles.benefitText}>{beneficio.texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {modalOpen && (
        <div
          className={styles.overlay}
          role="presentation"
          onClick={cerrarModal}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-registro-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalClose}
              onClick={cerrarModal}
              aria-label="Cerrar"
            >
              <CloseIcon />
            </button>

            <h3 id="modal-registro-titulo" className={styles.formTitle}>
              Un último paso
            </h3>
            <p className={styles.modalSubtitle}>
              Completa estos datos para crear tu cuenta de restaurante.
            </p>

            <form className={styles.form} onSubmit={handleRegistrar}>
              {/* Imagen */}
              <div className={styles.field}>
                <span className={styles.label}>Imagen del restaurante</span>
                <label className={styles.imageUpload}>
                  {imagenPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagenPreview}
                      alt="Vista previa de la imagen del restaurante"
                      className={styles.imagePreview}
                    />
                  ) : (
                    <span className={styles.imagePlaceholder}>
                      <CameraIcon />
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={handleImagenChange}
                  />
                  <span className={styles.imageUploadText}>
                    {imagenPreview ? "Cambiar imagen" : "Subir imagen (opcional)"}
                  </span>
                </label>
              </div>

              {/* Nombre del dueño */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="modal-nombre-dueno">
                  Nombre del dueño
                </label>
                <input
                  id="modal-nombre-dueno"
                  type="text"
                  autoComplete="name"
                  placeholder="Tu nombre completo"
                  className={styles.input}
                  value={nombreDueno}
                  onChange={(e) => setNombreDueno(e.target.value)}
                />
              </div>

              {/* Celular */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="modal-celular">
                  Teléfono celular
                </label>
                <input
                  id="modal-celular"
                  type="tel"
                  autoComplete="tel"
                  placeholder="10 dígitos"
                  className={styles.input}
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                />
              </div>

              {/* Calle y Número en fila */}
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="modal-calle">
                    Calle
                  </label>
                  <input
                    id="modal-calle"
                    type="text"
                    placeholder="Nombre de la calle"
                    className={styles.input}
                    value={calle}
                    onChange={(e) => setCalle(e.target.value)}
                  />
                </div>
                <div className={styles.fieldNumero}>
                  <label className={styles.label} htmlFor="modal-numero">
                    Número
                  </label>
                  <input
                    id="modal-numero"
                    type="text"
                    placeholder="123"
                    className={styles.input}
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                  />
                </div>
              </div>

              {/* Municipio */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="modal-municipio">
                  Municipio
                </label>
                <select
                  id="modal-municipio"
                  className={styles.select}
                  value={municipioId}
                  onChange={(e) => handleMunicipioChange(e.target.value)}
                  disabled={loadingColonias}
                >
                  {municipios.length === 0 && (
                    <option value="">Sin municipios disponibles</option>
                  )}
                  {municipios.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Colonia */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="modal-colonia">
                  Colonia
                </label>
                <select
                  id="modal-colonia"
                  className={styles.select}
                  value={coloniaId}
                  onChange={(e) => setColoniaId(e.target.value)}
                  disabled={loadingColonias || colonias.length === 0}
                >
                  {loadingColonias && <option value="">Cargando...</option>}
                  {!loadingColonias && colonias.length === 0 && (
                    <option value="">Sin colonias disponibles</option>
                  )}
                  {!loadingColonias &&
                    colonias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                </select>
              </div>

              {modalError && <p className={styles.error}>{modalError}</p>}

              <button type="submit" className={styles.submit} disabled={isPending || loadingColonias}>
                {isPending ? "Registrando..." : "Registrar restaurante"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
