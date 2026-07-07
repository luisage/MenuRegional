import styles from "./Footer.module.css";

const columnas = [
  {
    titulo: "Explora",
    enlaces: [
      { href: "#restaurantes", label: "Restaurantes" },
      { href: "#platillos", label: "Platillos" },
      { href: "#nosotros", label: "Nosotros" },
    ],
  },
  {
    titulo: "Cuenta",
    enlaces: [
      { href: "#registro", label: "Registro de usuario" },
      { href: "#registro-restaurante", label: "Registro de restaurante" },
    ],
  },
  {
    titulo: "Ayuda",
    enlaces: [{ href: "#contacto", label: "Contacto" }],
  },
];

const redes = [
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M14 9h2V6h-2c-1.66 0-3 1.34-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14V9.5c0-.28.22-.5.5-.5H14Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20 12a8 8 0 1 1-3.4-6.55"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M20 12a8 8 0 0 1-11.6 7.13L4 20l.9-4.27A8 8 0 1 1 20 12Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 9.8c.1-.6.6-.6 1-.6.3 0 .5.2.6.5l.4 1c.1.3 0 .6-.2.8l-.4.4c.4.9 1.1 1.6 2 2l.4-.4c.2-.2.5-.3.8-.2l1 .4c.3.1.5.3.5.6 0 .4 0 .9-.6 1-1.3.3-3.3-.6-4.5-1.8-1.2-1.2-2.1-3.2-1.8-4.5Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.shell}>
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <a className={styles.brand} href="#">
              <span className={styles.brandMark}>M</span>
              <span>
                Menú <b>Regional</b>
              </span>
            </a>
            <p className={styles.tagline}>
              Conectamos a los restaurantes de la región con quienes buscan
              descubrir sus mejores platillos.
            </p>
            <div className={styles.social}>
              {redes.map((red) => (
                <a
                  key={red.label}
                  className={styles.socialLink}
                  href={red.href}
                  aria-label={red.label}
                >
                  {red.icon}
                </a>
              ))}
            </div>
          </div>

          {columnas.map((columna) => (
            <div className={styles.col} key={columna.titulo}>
              <h3 className={styles.colTitle}>{columna.titulo}</h3>
              <ul className={styles.colList}>
                {columna.enlaces.map((enlace) => (
                  <li key={enlace.label}>
                    <a href={enlace.href}>{enlace.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {year} Menú Regional. Todos los derechos reservados.
          </p>
          <div className={styles.legal}>
            <a href="/terminos">Términos y condiciones</a>
            <a href="/privacidad">Aviso de privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
