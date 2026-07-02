"use client";

import { useState } from "react";
import styles from "./SuscribeteModal.module.css";

const NUMERO_CONTACTO = "7731339934";

type Plan = {
  emoji: string;
  nombre: string;
  precio: string | null;
  descripcion: string;
};

const PLANES: Plan[] = [
  {
    emoji: "🆓",
    nombre: "Plan Gratis",
    precio: null,
    descripcion:
      "Empieza sin compromiso. Crea tu menú interactivo con hasta 10 platillos, genera tu código QR y compártelo con tus clientes. Recibe pedidos directo por WhatsApp, sin complicaciones.",
  },
  {
    emoji: "⭐",
    nombre: "Plan 1 Sucursal",
    precio: "$200/mes",
    descripcion:
      "Lleva tu restaurante al siguiente nivel. Agrega todos los platillos que quieras, crea promociones y avisos para tus clientes, y mantente al día con reportes de tus ventas e ingresos. Todo lo que necesitas para hacer crecer tu negocio.",
  },
  {
    emoji: "🚀",
    nombre: "Plan Multi Sucursal",
    precio: "$300/mes",
    descripcion:
      "Para restaurantes en expansión. Administra todas tus sucursales desde un solo lugar, con menú ilimitado, promociones, avisos y reportes de ventas e ingresos por cada sucursal.",
  },
];

export default function SuscribeteModal({
  mensaje,
  onClose,
}: {
  mensaje: string;
  onClose: () => void;
}) {
  const [contactando, setContactando] = useState(false);
  const [comentario, setComentario] = useState("");

  function handleContactarClick() {
    if (!contactando) {
      setContactando(true);
      return;
    }

    const texto = comentario.trim();
    if (!texto) return;

    const rawPhone = NUMERO_CONTACTO.replace(/\D/g, "");
    const phone = rawPhone.startsWith("52") ? rawPhone : `52${rawPhone}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Suscríbete para desbloquear esta función"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.panel}>
        <div className={styles.header}>
          <p className={styles.mensaje}>{mensaje}</p>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <p className={styles.titulo}>Elige el plan ideal para tu restaurante</p>

        <div className={styles.planesGrid}>
          {PLANES.map((plan) => (
            <div key={plan.nombre} className={styles.planCard}>
              <span className={styles.planEmoji} aria-hidden="true">{plan.emoji}</span>
              <p className={styles.planNombre}>
                {plan.nombre}
                {plan.precio && <span className={styles.planPrecio}> — {plan.precio}</span>}
              </p>
              <p className={styles.planDesc}>{plan.descripcion}</p>
            </div>
          ))}
        </div>

        {contactando && (
          <textarea
            key="comentario-textarea"
            className={styles.comentarioTextarea}
            placeholder="Escribe tu comentario..."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            autoFocus
            rows={3}
          />
        )}

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.contactarBtn}
            onClick={handleContactarClick}
            disabled={contactando && !comentario.trim()}
          >
            <span key={contactando ? "enviar" : "contactanos"} className={styles.btnLabelFade}>
              {contactando ? "Enviar" : "Contáctanos"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
