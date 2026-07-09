"use client";

import { useEffect, useState, useTransition } from "react";
import styles from "./LoginModal.module.css";
import { iniciarSesion } from "@/app/lib/actions/auth";

type TipoCuenta = "restaurante" | "usuario";

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

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  tipoCuentaInicial?: TipoCuenta;
};

export default function LoginModal({ open, onClose, tipoCuentaInicial = "usuario" }: LoginModalProps) {
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta>(tipoCuentaInicial);
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function handleClose() {
    setTipoCuenta(tipoCuentaInicial);
    setUsuario("");
    setPassword("");
    setError(null);
    onClose();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!usuario.trim() || !password) {
      setError("Ingresa tu usuario y contraseña.");
      return;
    }

    setError(null);

    const formData = new FormData();
    formData.set("tipoCuenta", tipoCuenta);
    formData.set("usuario", usuario.trim());
    formData.set("password", password);

    startTransition(async () => {
      const result = await iniciarSesion(formData);
      if (result?.error) setError(result.error);
    });
  }

  const crearCuentaHref = tipoCuenta === "usuario" ? "#registro" : "#registro-restaurante";

  return (
    <div className={styles.overlay} role="presentation" onClick={handleClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-titulo"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className={styles.modalClose} onClick={handleClose} aria-label="Cerrar">
          <CloseIcon />
        </button>

        <h3 id="login-modal-titulo" className={styles.title}>
          Inicia sesión
        </h3>
        <p className={styles.subtitle}>Selecciona el tipo de cuenta para continuar.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-tipo">
              Tipo de cuenta
            </label>
            <select
              id="login-tipo"
              className={styles.select}
              value={tipoCuenta}
              onChange={(e) => setTipoCuenta(e.target.value as TipoCuenta)}
            >
              <option value="restaurante">Restaurante</option>
              <option value="usuario">Usuario</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-usuario">
              Usuario
            </label>
            <input
              id="login-usuario"
              type="text"
              autoComplete="username"
              placeholder={
                tipoCuenta === "restaurante" ? "Tu número de celular" : "Tu nombre de usuario"
              }
              className={styles.input}
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.submit} disabled={isPending}>
              {isPending ? "Ingresando..." : "Ingresar"}
            </button>
          </div>

          <p className={styles.footer}>
            ¿Aún no tienes cuenta?{" "}
            <a href={crearCuentaHref} className={styles.footerLink} onClick={handleClose}>
              Crea tu cuenta
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
