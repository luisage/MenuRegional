import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesionAdminId } from "@/app/lib/session";
import LoginConfiguracionForm from "./LoginConfiguracionForm";
import styles from "./Login.module.css";

export const metadata: Metadata = {
  title: "Configuración | Menú Regional",
};

export default async function ConfiguracionLoginPage() {
  const adminId = await obtenerSesionAdminId();
  if (adminId) redirect("/configuracion/restaurantes");

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/" className={styles.brand}>
          Menú <b>Regional</b>
        </Link>

        <p className={styles.eyebrow}>Configuración</p>
        <h1 className={styles.title}>Inicio de sesión</h1>
        <p className={styles.subtitle}>
          Ingresa con tu cuenta de administrador para gestionar la plataforma.
        </p>

        <LoginConfiguracionForm />
      </div>
    </div>
  );
}
