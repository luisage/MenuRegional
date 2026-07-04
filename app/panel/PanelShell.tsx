"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Panel.module.css";
import { cerrarSesion } from "@/app/lib/actions/sesion";
import {
  PlateIcon,
  MenuListIcon,
  OrdersIcon,
  ClockIcon,
  StoreIcon,
  LogoutIcon,
  ReportesIcon,
  QrIcon,
} from "./icons";

const navItems = [
  { href: "/panel/datos", label: "Datos del restaurante", icon: <StoreIcon /> },
  { href: "/panel/platillos/nuevo", label: "Administrar menú", icon: <PlateIcon /> },
  { href: "/panel/horario", label: "Registrar horario", icon: <ClockIcon /> },
  { href: "/panel/menu", label: "Ver menú", icon: <MenuListIcon /> },
  { href: "/panel/pedidos", label: "Ver pedidos", icon: <OrdersIcon /> },
  { href: "/panel/reportes", label: "Reportes", icon: <ReportesIcon /> },
  { href: "/panel/qr", label: "QR del menú", icon: <QrIcon /> },
];

type PanelShellProps = {
  nombreRestaurante: string;
  logoUrl: string | null;
  children: React.ReactNode;
};

export default function PanelShell({ nombreRestaurante, logoUrl, children }: PanelShellProps) {
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
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className={styles.logo} />
          ) : (
            <span className={styles.logoPlaceholder} aria-hidden="true">
              {nombreRestaurante.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <p className={styles.sidebarLabel}>Mi restaurante</p>
            <p className={styles.sidebarName}>{nombreRestaurante}</p>
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

        <form action={cerrarSesion} className={styles.logoutForm}>
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
