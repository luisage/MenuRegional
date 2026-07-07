import styles from "./FooterMinimal.module.css";

export default function FooterMinimal() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.shell}>
        <p className={styles.copyright}>
          © {year} Menú Regional. Todos los derechos reservados.
        </p>
        <div className={styles.legal}>
          <a href="/terminos">Términos y condiciones</a>
          <a href="/privacidad">Aviso de privacidad</a>
        </div>
      </div>
    </footer>
  );
}
