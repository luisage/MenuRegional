"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./Nosotros.module.css";

export default function Nosotros() {
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
    <section id="nosotros" ref={sectionRef} className={styles.section}>
      <div className={styles.bg}>
        <Image
          src="/nosotros/platillos.jpg"
          alt="Mesa con una variedad de platillos típicos mexicanos coloridos"
          fill
          sizes="100vw"
          className={styles.image}
        />
      </div>
      <div className={styles.scrim} />

      <div className={styles.shell}>
        <div className={`${styles.content} ${inView ? styles.inView : ""}`}>
          <span className={styles.eyebrow}>Nosotros</span>
          <h2 className={styles.title}>
            Conectamos tu región con <em>su mejor comida</em>
          </h2>
          <div className={styles.body}>
            <p>
              Reunimos en este lugar los restaurantes de la región para que
              descubras sus platillos, explores sus menús y hagas tus
              pedidos de forma rápida y sencilla.
            </p>
            <p>Aquí encontrarás comida, postres, bebidas y más.</p>
            <p>
              Consulta horarios, contactos y platillos actualizados en
              tiempo real.
            </p>
            <p>
              Aquí tienes todo lo que necesitas para vivir la mejor
              experiencia gastronómica local.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
