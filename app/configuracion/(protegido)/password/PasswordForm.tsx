"use client";

import { useState, useTransition } from "react";
import { actualizarPasswordAdmin } from "@/app/lib/actions/admin";
import formStyles from "../../Form.module.css";
import styles from "./Password.module.css";

export default function PasswordForm() {
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "error"; mensaje: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);

    const formData = new FormData();
    formData.set("passwordActual", passwordActual);
    formData.set("passwordNueva", passwordNueva);
    formData.set("passwordConfirmar", passwordConfirmar);

    startTransition(async () => {
      const result = await actualizarPasswordAdmin(formData);
      if ("ok" in result) {
        setFeedback({ tipo: "ok", mensaje: "Contraseña actualizada correctamente." });
        setPasswordActual("");
        setPasswordNueva("");
        setPasswordConfirmar("");
      } else {
        setFeedback({ tipo: "error", mensaje: result.error });
      }
    });
  }

  return (
    <div className={styles.card}>
      <form className={formStyles.form} onSubmit={handleSubmit}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="password-actual">
            Contraseña actual
          </label>
          <input
            id="password-actual"
            type="password"
            autoComplete="current-password"
            className={formStyles.input}
            value={passwordActual}
            onChange={(e) => { setPasswordActual(e.target.value); setFeedback(null); }}
          />
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="password-nueva">
            Nueva contraseña
          </label>
          <input
            id="password-nueva"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            className={formStyles.input}
            value={passwordNueva}
            onChange={(e) => { setPasswordNueva(e.target.value); setFeedback(null); }}
          />
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="password-confirmar">
            Confirmar nueva contraseña
          </label>
          <input
            id="password-confirmar"
            type="password"
            autoComplete="new-password"
            className={formStyles.input}
            value={passwordConfirmar}
            onChange={(e) => { setPasswordConfirmar(e.target.value); setFeedback(null); }}
          />
        </div>

        {feedback && (
          <p className={feedback.tipo === "ok" ? formStyles.success : formStyles.error}>
            {feedback.mensaje}
          </p>
        )}

        <button type="submit" className={formStyles.submit} disabled={isPending}>
          {isPending ? "Guardando..." : "Actualizar contraseña"}
        </button>
      </form>
    </div>
  );
}
