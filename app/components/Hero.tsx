"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Hero.module.css";
import LoginModal from "./LoginModal";

const navLinks = [
  { href: "#", label: "Restaurantes" },
  { href: "#", label: "Platillos" },
  { href: "#", label: "Nosotros" },
  { href: "#registro", label: "Registro de usuario" },
  { href: "#registro-restaurante", label: "Registro de restaurante" },
  { href: "#contacto", label: "Contacto" },
];

function LoginIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Hero() {
  const [navOpen, setNavOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <section className={styles.hero}>
      <div className={styles.bg}>
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/hero/fondoHamburguesa.png"
        >
          <source src="/hero/menuInteractivo.mp4" type="video/mp4" />
        </video>
      </div>
      <div className={styles.scrim} />
      <div className={styles.vignette} />

      <div className={styles.shell}>
        <nav className={`${styles.nav} ${navOpen ? styles.navOpen : ""}`}>
          <a className={styles.brand} href="#">
            <span className={styles.brandMark}>M</span>
            <span>
              Menú <b>Regional</b>
            </span>
          </a>

          <ul className={styles.navLinks}>
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  className={styles.navLink}
                  href={link.href}
                  onClick={() => setNavOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <button
                type="button"
                className={styles.loginBtn}
                aria-label="Iniciar sesión"
                onClick={() => {
                  setNavOpen(false);
                  setLoginOpen(true);
                }}
              >
                <span className={styles.loginIcon}>
                  <LoginIcon />
                </span>
                <span className={styles.loginText}>Inicia sesión</span>
              </button>
            </li>
          </ul>

          <button
            className={styles.burger}
            aria-label={navOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((open) => !open)}
          >
            <span />
          </button>
        </nav>

        <div className={styles.heroMain}>
          <div className={styles.copy}>
            <h1 className={`${styles.copyTitle} ${styles.anim} ${styles.delay1}`}>
              Los sabores de tu región, <em>en un solo lugar</em>
            </h1>
            <p className={`${styles.copySub} ${styles.anim} ${styles.delay2}`}>
              Descubre menús locales, arma tu pedido y recíbelo sin
              complicaciones. Conectamos a los restaurantes de la región y su
              deliciosa comida.
            </p>
            <div className={`${styles.copyActions} ${styles.anim} ${styles.delay3}`}>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/explorar">
                Explorar restaurantes
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 12h15M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <a className={`${styles.btn} ${styles.btnOutline}`} href="#registro-restaurante">
                Soy restaurante
              </a>
            </div>
            <p className={`${styles.copyNote} ${styles.anim} ${styles.delay4}`}>
              ¿Tienes un restaurante?{" "}
              <a href="#registro-restaurante">Da de alta tu menú gratis y recibe pedidos</a>
            </p>
          </div>
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </section>
  );
}
