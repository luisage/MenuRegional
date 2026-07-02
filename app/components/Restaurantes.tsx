"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./Restaurantes.module.css";

export type RestauranteHome = {
  nombre: string;
  slug: string;
  logoUrl: string | null;
  portadaUrl: string | null;
  categorias: string[];
  abierto: boolean;
};

const TAG_INTERVALO_MS = 5000;

function getVisibleCount(width: number) {
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
}

function CardRestaurante({ r }: { r: RestauranteHome }) {
  const [tagIndex, setTagIndex] = useState(0);

  useEffect(() => {
    if (r.categorias.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () => setTagIndex((i) => (i + 1) % r.categorias.length),
      TAG_INTERVALO_MS,
    );
    return () => clearInterval(id);
  }, [r.categorias.length]);

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        {r.portadaUrl ? (
          <Image
            src={r.portadaUrl}
            alt={`Portada de ${r.nombre}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden="true" />
        )}

        <div className={styles.coverScrim} aria-hidden="true" />

        {/* Logo */}
        <div className={styles.cardLogoWrap}>
          {r.logoUrl ? (
            <Image
              src={r.logoUrl}
              alt={`Logo de ${r.nombre}`}
              fill
              sizes="44px"
              className={styles.cardLogoImg}
            />
          ) : (
            <span className={styles.cardLogoInitial} aria-hidden="true">
              {r.nombre.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Estado abierto/cerrado */}
        <span
          className={`${styles.statusBadge} ${r.abierto ? styles.statusBadgeAbierto : styles.statusBadgeCerrado}`}
          aria-label={r.abierto ? "Abierto" : "Cerrado"}
        >
          <span
            className={`${styles.statusDot} ${r.abierto ? styles.statusDotAbierto : styles.statusDotCerrado}`}
            aria-hidden="true"
          />
          {r.abierto ? "Abierto" : "Cerrado"}
        </span>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.name}>{r.nombre}</h3>
        {r.categorias.length > 0 && (
          <span key={tagIndex} className={styles.category}>
            {r.categorias[tagIndex]}
          </span>
        )}
        <Link
          href={`/explorar/${r.slug}`}
          className={styles.link}
        >
          Ver menú
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
  );
}

export default function Restaurantes({
  restaurantes,
}: {
  restaurantes: RestauranteHome[];
}) {
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
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const maxIndex = Math.max(restaurantes.length - visible, 0);
  const pageCount = maxIndex + 1;

  useEffect(() => {
    setIndex((current) => Math.min(current, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (paused || maxIndex === 0) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const id = setInterval(() => {
      setIndex((current) => (current >= maxIndex ? 0 : current + 1));
    }, 8000);
    return () => clearInterval(id);
  }, [paused, maxIndex]);

  const goTo = (next: number) => {
    setIndex(((next % pageCount) + pageCount) % pageCount);
  };

  if (restaurantes.length === 0) return null;

  return (
    <section
      id="restaurantes"
      ref={sectionRef}
      className={styles.section}
      aria-roledescription="carrusel"
      aria-label="Restaurantes destacados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={styles.shell}>
        <div className={`${styles.heading} ${inView ? styles.inView : ""}`}>
          <span className={styles.eyebrow}>Lo mejor de la región</span>
          <h2 className={styles.title}>
            Restaurantes <em>destacados</em>
          </h2>
          <p className={styles.subtitle}>
            Descubre los lugares favoritos de la comunidad y explora su menú
            completo antes de hacer tu pedido.
          </p>
        </div>

        <div className={`${styles.carousel} ${inView ? styles.inView : ""}`}>
          <div className={styles.viewport}>
            <div
              className={styles.track}
              style={{ "--index": index } as unknown as React.CSSProperties}
            >
              {restaurantes.map((r) => (
                <CardRestaurante key={r.slug} r={r} />
              ))}
            </div>
          </div>

          {maxIndex > 0 && (
            <>
              <button
                type="button"
                className={`${styles.arrow} ${styles.arrowPrev}`}
                onClick={() => goTo(index - 1)}
                aria-label="Restaurante anterior"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                className={`${styles.arrow} ${styles.arrowNext}`}
                onClick={() => goTo(index + 1)}
                aria-label="Siguiente restaurante"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className={styles.dots} role="tablist" aria-label="Seleccionar grupo de restaurantes">
                {Array.from({ length: pageCount }).map((_, dotIndex) => (
                  <button
                    key={dotIndex}
                    type="button"
                    role="tab"
                    aria-selected={dotIndex === index}
                    aria-label={`Mostrar grupo ${dotIndex + 1} de ${pageCount}`}
                    className={`${styles.dot} ${dotIndex === index ? styles.dotActive : ""}`}
                    onClick={() => goTo(dotIndex)}
                  />
                ))}
              </div>
            </>
          )}

          <p className={styles.srOnly} aria-live="polite">
            {`Mostrando restaurantes ${index + 1} a ${Math.min(index + visible, restaurantes.length)} de ${restaurantes.length}`}
          </p>
        </div>
      </div>
    </section>
  );
}
