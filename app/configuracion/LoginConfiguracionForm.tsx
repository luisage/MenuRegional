"use client";

import { useState, useTransition } from "react";
import { iniciarSesionAdmin } from "@/app/lib/actions/admin";
import formStyles from "./Form.module.css";

export default function LoginConfiguracionForm() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!usuario.trim() || !password) {
      setError("Ingresa tu usuario y contraseña.");
      return;
    }

    setError(null);

    const formData = new FormData();
    formData.set("usuario", usuario.trim());
    formData.set("password", password);

    startTransition(async () => {
      const result = await iniciarSesionAdmin(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form className={formStyles.form} onSubmit={handleSubmit}>
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="config-usuario">
          Usuario
        </label>
        <input
          id="config-usuario"
          type="text"
          autoComplete="username"
          placeholder="Tu nombre de usuario"
          className={formStyles.input}
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
        />
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="config-password">
          Contraseña
        </label>
        <input
          id="config-password"
          type="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          className={formStyles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <p className={formStyles.error}>{error}</p>}

      <button type="submit" className={formStyles.submit} disabled={isPending}>
        {isPending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
