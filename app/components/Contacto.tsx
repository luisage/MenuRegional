"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Contacto.module.css";

type Motivo = {
  texto: string;
  icon: React.ReactNode;
};

const motivos: Motivo[] = [
  {
    texto: "¿Tienes dudas sobre nuestro servicio?",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 17.5a8 8 0 1 0-4.9-1.68L5 21l4.3-1.1A8 8 0 0 0 12 17.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 13.5v-.5c0-.6.4-1 .9-1.3.7-.4 1.1-.9 1.1-1.7 0-1.1-.9-2-2-2s-2 .9-2 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="16.2" r="0.9" fill="currentColor" />
      </svg>
    ),
  },
  {
    texto: "¿Tienes dudas de cómo registrar tu restaurante o agregar tu menú?",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7 3h8l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 13h6M9 17h6M9 9h2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function Contacto() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
    <section id="contacto" ref={sectionRef} className={styles.section}>
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.shell}>
        <div className={`${styles.info} ${inView ? styles.inView : ""}`}>
          <span className={styles.eyebrow}>Contacto</span>
          <h2 className={styles.title}>¿Tienes alguna duda?</h2>

          <ul className={styles.motivos}>
            {motivos.map((motivo) => (
              <li className={styles.motivo} key={motivo.texto}>
                <span className={styles.motivoIcon}>{motivo.icon}</span>
                <p className={styles.motivoText}>{motivo.texto}</p>
              </li>
            ))}
          </ul>

          <p className={styles.cta}>Contáctanos</p>
        </div>

        <div className={`${styles.formCard} ${inView ? styles.inView : ""}`}>
          <h3 className={styles.formTitle}>Envíanos tu mensaje</h3>

          <form className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="contacto-mensaje">
                Tu duda o comentario
              </label>
              <textarea
                id="contacto-mensaje"
                name="mensaje"
                rows={6}
                placeholder="Escribe aquí tu duda o comentario..."
                className={styles.textarea}
              />
            </div>

            <button type="submit" className={styles.submit}>
              Enviar
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M3 11.5 21 4l-7.5 18-2.5-7.5L3 11.5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
