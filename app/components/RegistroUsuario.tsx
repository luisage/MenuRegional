"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./RegistroUsuario.module.css";
import { loginCliente } from "@/app/lib/actions/clienteAuth";

type Beneficio = {
  titulo: string;
  descripcion: string;
  icon: React.ReactNode;
};

const beneficios: Beneficio[] = [
  {
    titulo: "Tus datos siempre listos",
    descripcion:
      "Guarda tu información para que cada pedido sea más rápido.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    titulo: "Repite tus favoritos",
    descripcion: "Vuelve a pedir tus platillos preferidos en un par de clics.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 12a9 9 0 1 0 2.64-6.36L3 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 4v4h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 8v4l3 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    titulo: "Sigue tus pedidos",
    descripcion: "Consulta el estado de tus órdenes desde tu cuenta.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 6h18M3 12h18M3 18h11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 16l3 3 3-3"
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

export default function RegistroUsuario() {
  const router = useRouter();
  const [inView, setInView] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const [modalLogin, setModalLogin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPending, startLoginTransition] = useTransition();

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

        <div className={`${styles.formCard} ${inView ? styles.inView : ""}`}>
          <h3 className={styles.formTitle}>Crear cuenta</h3>

          <form className={styles.form}>
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
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleLoginSubmit}>
            <div className={styles.loginBody}>
              <div className={styles.loginField}>
                <label className={styles.loginLabel} htmlFor="rl-usuario">Usuario</label>
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
                <label className={styles.loginLabel} htmlFor="rl-password">Contraseña</label>
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
              {loginError && <p className={styles.loginError} role="alert">{loginError}</p>}
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
