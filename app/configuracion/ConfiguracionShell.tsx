"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Configuracion.module.css";
import { cerrarSesionAdmin } from "@/app/lib/actions/admin";
import { StoreIcon, KeyIcon, MapPinIcon, SettingsIcon, LogoutIcon } from "./icons";

const navItems = [
  { href: "/configuracion/restaurantes", label: "Gestionar restaurantes", icon: <StoreIcon /> },
  { href: "/configuracion/municipios", label: "Municipios y colonias", icon: <MapPinIcon /> },
  { href: "/configuracion/catalogo", label: "Configuración", icon: <SettingsIcon /> },
  { href: "/configuracion/password", label: "Editar contraseña", icon: <KeyIcon /> },
];

type ConfiguracionShellProps = {
  nombreAdmin: string;
  children: React.ReactNode;
};

export default function ConfiguracionShell({ nombreAdmin, children }: ConfiguracionShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className={styles.layout}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand}>
          Menú <b>Regional</b>
        </Link>
        <button
          type="button"
          className={`${styles.burger} ${open ? styles.burgerOpen : ""}`}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
        </button>
      </header>

      {open && (
        <div
          className={styles.overlay}
          role="presentation"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.logoPlaceholder} aria-hidden="true">
            {nombreAdmin.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className={styles.sidebarLabel}>Configuración</p>
            <p className={styles.sidebarName}>{nombreAdmin}</p>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.active : ""}`}
              onClick={() => setOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <form action={cerrarSesionAdmin} className={styles.logoutForm}>
          <button type="submit" className={styles.logoutBtn}>
            <LogoutIcon />
            Cerrar sesión
          </button>
        </form>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
