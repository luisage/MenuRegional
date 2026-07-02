"use client";

import { useEffect, useState } from "react";
import styles from "./AvisosCarousel.module.css";

export type AvisoVista = {
  id: string;
  descripcion: string;
  fecha: string | null;
  imagenUrl: string | null;
};

const AUTOPLAY_MS = 8000;

function getVisibleCount(width: number) {
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
}

function BellIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function AvisosCarousel({
  avisos,
  titulo = "Avisos",
  ariaLabel = "Avisos del restaurante",
}: {
  avisos: AvisoVista[];
  titulo?: string;
  ariaLabel?: string;
}) {
  const [visible, setVisible] = useState(3);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [avisoAmpliado, setAvisoAmpliado] = useState<AvisoVista | null>(null);

  useEffect(() => {
    const update = () => setVisible(getVisibleCount(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = Math.max(avisos.length - visible, 0);
  const pageCount = maxIndex + 1;
  const clampedIndex = Math.min(index, maxIndex);

  useEffect(() => {
    if (paused || maxIndex === 0 || avisoAmpliado) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const id = setInterval(() => {
      setIndex((current) => (current >= maxIndex ? 0 : current + 1));
    }, AUTOPLAY_MS);

    return () => clearInterval(id);
  }, [paused, maxIndex, avisoAmpliado]);

  const goTo = (next: number) => {
    setIndex(((next % pageCount) + pageCount) % pageCount);
  };

  if (avisos.length === 0) return null;

  return (
    <section
      className={styles.section}
      aria-roledescription="carrusel"
      aria-label={ariaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={styles.header}>
        <h2 className={styles.eyebrow}>{titulo}</h2>
        <span className={styles.line} aria-hidden="true" />
      </div>

      <div className={styles.carousel}>
        <div className={styles.viewport}>
          <div
            className={styles.track}
            style={{ "--index": clampedIndex } as unknown as React.CSSProperties}
          >
            {avisos.map((aviso) => (
              <article className={styles.card} key={aviso.id}>
                {aviso.imagenUrl ? (
                  <>
                    <div className={styles.imageWrap}>
                      <button
                        type="button"
                        className={styles.imgBtn}
                        onClick={() => setAvisoAmpliado(aviso)}
                        aria-label={`Ver aviso en tamaño completo: ${aviso.descripcion}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={aviso.imagenUrl} alt={aviso.descripcion} className={styles.image} loading="lazy" />
                      </button>
                    </div>
                    <div className={styles.cardBody}>
                      <p className={styles.descripcion}>{aviso.descripcion}</p>
                      {aviso.fecha && <p className={styles.fecha}>{aviso.fecha}</p>}
                    </div>
                  </>
                ) : (
                  <div className={styles.noImg}>
                    <BellIcon />
                    <p className={styles.noImgDesc}>{aviso.descripcion}</p>
                    {aviso.fecha && <p className={styles.noImgFecha}>{aviso.fecha}</p>}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        {maxIndex > 0 && (
          <>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowPrev}`}
              onClick={() => goTo(clampedIndex - 1)}
              aria-label="Aviso anterior"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowNext}`}
              onClick={() => goTo(clampedIndex + 1)}
              aria-label="Siguiente aviso"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className={styles.dots} role="tablist" aria-label="Seleccionar grupo de avisos">
              {Array.from({ length: pageCount }).map((_, dotIndex) => (
                <button
                  key={dotIndex}
                  type="button"
                  role="tab"
                  aria-selected={dotIndex === clampedIndex}
                  aria-label={`Mostrar grupo ${dotIndex + 1} de ${pageCount}`}
                  className={`${styles.dot} ${dotIndex === clampedIndex ? styles.dotActive : ""}`}
                  onClick={() => goTo(dotIndex)}
                />
              ))}
            </div>
          </>
        )}

        <p className={styles.srOnly} aria-live="polite">
          {`Mostrando avisos ${clampedIndex + 1} a ${Math.min(clampedIndex + visible, avisos.length)} de ${avisos.length}`}
        </p>
      </div>

      {avisoAmpliado?.imagenUrl && (
        <div
          className={styles.lightboxOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Imagen del aviso en tamaño completo"
          onClick={(e) => { if (e.target === e.currentTarget) setAvisoAmpliado(null); }}
        >
          <button
            type="button"
            className={styles.lightboxCloseBtn}
            aria-label="Cerrar"
            onClick={() => setAvisoAmpliado(null)}
          >
            <CloseIcon />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avisoAmpliado.imagenUrl} alt={avisoAmpliado.descripcion} className={styles.lightboxImg} />
        </div>
      )}
    </section>
  );
}
