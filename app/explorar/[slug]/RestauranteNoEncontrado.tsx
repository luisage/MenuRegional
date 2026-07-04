import Link from "next/link";
import styles from "./RestauranteNoEncontrado.module.css";

export default function RestauranteNoEncontrado() {
  return (
    <div className={styles.page}>
      {/* Decorative background blobs */}
      <div className={styles.blobTop} aria-hidden="true" />
      <div className={styles.blobBottom} aria-hidden="true" />

      <div className={styles.card}>
        {/* Icon */}
        <div className={styles.iconWrap} aria-hidden="true">
          <StoreCerradoIcon />
        </div>

        {/* Heading */}
        <h1 className={styles.titulo}>
          Este restaurante no está disponible
        </h1>

        <p className={styles.sub}>
          Es posible que haya cerrado temporalmente o cambiado de dirección.
          ¡No te quedes con hambre!
        </p>

        {/* Divider */}
        <div className={styles.divider} aria-hidden="true">
          <span />
          <span className={styles.dividerText}>Pero hay más opciones</span>
          <span />
        </div>

        <p className={styles.cta}>
          Descubre decenas de restaurantes locales con sus menús completos.
          Ordena desde tu celular en segundos.
        </p>

        <Link href="/explorar" className={styles.btn}>
          <CompassIcon />
          Explorar restaurantes
        </Link>
      </div>
    </div>
  );
}

function StoreCerradoIcon() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Store body */}
      <path
        d="M16 42v34a4 4 0 0 0 4 4h56a4 4 0 0 0 4-4V42"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
      {/* Store roof/awning */}
      <path
        d="M10 20h76l4 22H6l4-22Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
      {/* Door */}
      <path
        d="M38 80V60h20v20"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
      {/* X mark — "closed" */}
      <circle cx="72" cy="26" r="18" fill="var(--color-espresso)" />
      <path
        d="M64 18l16 16M80 18L64 34"
        stroke="#E8513A"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
