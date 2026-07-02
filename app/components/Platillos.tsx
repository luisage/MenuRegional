"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./Platillos.module.css";

export type PlatilloHome = {
  id: string;
  nombre: string;
  imagenUrl: string | null;
  costo: string;
  restauranteNombre: string;
  restauranteSlug: string;
};

const AUTOPLAY_MS = 8000;

function getVisibleCount(width: number) {
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
}

export default function Platillos({ platillos }: { platillos: PlatilloHome[] }) {
  const [visible, setVisible] = useState(3);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const update = () => setVisible(getVisibleCount(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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

  const maxIndex = Math.max(platillos.length - visible, 0);
  const pageCount = maxIndex + 1;
  const effectiveIndex = Math.min(index, maxIndex);

  useEffect(() => {
    if (paused || maxIndex === 0) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const id = setInterval(() => {
      setIndex((current) => (current >= maxIndex ? 0 : current + 1));
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, maxIndex]);

  const goTo = (next: number) => {
    setIndex(((next % pageCount) + pageCount) % pageCount);
  };

  if (platillos.length === 0) return null;

  return (
    <section
      id="platillos"
      ref={sectionRef}
      className={styles.section}
      aria-roledescription="carrusel"
      aria-label="Platillos destacados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={styles.shell}>
        <div className={`${styles.heading} ${inView ? styles.inView : ""}`}>
          <span className={styles.eyebrow}>Para chuparse los dedos</span>
          <h2 className={styles.title}>
            Platillos <em>destacados</em>
          </h2>
          <p className={styles.subtitle}>
            Los favoritos de la comunidad, listos para pedir desde tu
            restaurante favorito en un par de clics.
          </p>
        </div>

        <div className={`${styles.carousel} ${inView ? styles.inView : ""}`}>
          <div className={styles.viewport}>
            <div
              className={styles.track}
              style={{ "--index": effectiveIndex } as unknown as React.CSSProperties}
            >
              {platillos.map((p) => (
                <article className={styles.card} key={p.id}>
                  <div className={styles.imageWrap}>
                    {p.imagenUrl ? (
                      <Image
                        src={p.imagenUrl}
                        alt={p.nombre}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className={styles.image}
                      />
                    ) : (
                      <div className={styles.imagePlaceholder} aria-hidden="true" />
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <span className={styles.category}>{p.restauranteNombre}</span>
                    <h3 className={styles.name}>{p.nombre}</h3>
                    <Link
                      href={`/explorar/${p.restauranteSlug}?platilloId=${p.id}`}
                      className={styles.link}
                    >
                      Pedir ahora
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M4 12h15M13 6l6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {maxIndex > 0 && (
            <>
              <button
                type="button"
                className={`${styles.arrow} ${styles.arrowPrev}`}
                onClick={() => goTo(effectiveIndex - 1)}
                aria-label="Platillo anterior"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                className={`${styles.arrow} ${styles.arrowNext}`}
                onClick={() => goTo(effectiveIndex + 1)}
                aria-label="Siguiente platillo"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className={styles.dots} role="tablist" aria-label="Seleccionar grupo de platillos">
                {Array.from({ length: pageCount }).map((_, dotIndex) => (
                  <button
                    key={dotIndex}
                    type="button"
                    role="tab"
                    aria-selected={dotIndex === effectiveIndex}
                    aria-label={`Mostrar grupo ${dotIndex + 1} de ${pageCount}`}
                    className={`${styles.dot} ${dotIndex === effectiveIndex ? styles.dotActive : ""}`}
                    onClick={() => goTo(dotIndex)}
                  />
                ))}
              </div>
            </>
          )}

          <p className={styles.srOnly} aria-live="polite">
            {`Mostrando platillos ${effectiveIndex + 1} a ${Math.min(effectiveIndex + visible, platillos.length)} de ${platillos.length}`}
          </p>
        </div>
      </div>
    </section>
  );
}
