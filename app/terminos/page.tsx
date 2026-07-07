import type { Metadata } from "next";
import Link from "next/link";
import FooterMinimal from "@/app/components/FooterMinimal";
import styles from "./Terminos.module.css";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Menú Regional",
  description:
    "Conoce los términos y condiciones de uso de la plataforma Menú Regional.",
};

export default function TerminosPage() {
  return (
    <>
      <div className={styles.page}>
        {/* ── Navegación ─────────────────────────────────── */}
        <nav className={styles.nav}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>M</span>
            <span>
              Menú <b>Regional</b>
            </span>
          </Link>
          <Link href="/" className={styles.backLink}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M19 12H5M5 12l7 7M5 12l7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Regresar al inicio
          </Link>
        </nav>

        {/* ── Banner ─────────────────────────────────────── */}
        <header className={styles.banner}>
          <p className={styles.bannerLabel}>Legal</p>
          <h1 className={styles.bannerTitle}>Términos y Condiciones</h1>
          <p className={styles.bannerSub}>
            Última actualización: julio de 2026
          </p>
          <a
            href="/terminos-condiciones-menu-regional.pdf"
            download="terminos-condiciones-menu-regional.pdf"
            className={styles.downloadBtn}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Descargar PDF
          </a>
        </header>

        {/* ── Contenido ──────────────────────────────────── */}
        <main className={styles.main}>
          <article className={styles.article}>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                1. Aceptación de los Términos
              </h2>
              <p>
                Al acceder, registrarse o utilizar la plataforma Menú Regional,
                disponible en{" "}
                <a
                  href="https://menu-regional.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  https://menu-regional.com
                </a>{" "}
                (en adelante &quot;la Plataforma&quot;), usted acepta de forma
                expresa, voluntaria e informada los presentes Términos y
                Condiciones de Uso (en adelante &quot;los Términos&quot;). Si
                no está de acuerdo con alguno de ellos, le pedimos que se
                abstenga de usar la Plataforma.
              </p>
              <p>
                La Plataforma es operada por Menú Regional, con operaciones en
                el Estado de Hidalgo, México (en adelante &quot;el
                Operador&quot;).
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                2. Descripción del Servicio
              </h2>
              <p>
                Menú Regional es una plataforma digital que conecta a
                restaurantes y establecimientos de comida con sus clientes,
                permitiendo:
              </p>
              <ul className={styles.list}>
                <li>
                  <strong>A los restaurantes:</strong> publicar su menú
                  interactivo, gestionar sucursales, platillos, categorías,
                  promociones y avisos, generar códigos QR para su menú, y
                  recibir pedidos a través de WhatsApp.
                </li>
                <li>
                  <strong>A los clientes:</strong> explorar el menú de los
                  restaurantes registrados, conocer restaurantes cercanos a su
                  ubicación, realizar pedidos en línea y dar seguimiento al
                  estado de su pedido.
                </li>
              </ul>
              <p>
                El Operador actúa únicamente como intermediario tecnológico
                entre los restaurantes y sus clientes. La preparación, calidad,
                entrega y responsabilidad sobre los alimentos recae
                exclusivamente en cada restaurante.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                3. Registro y Cuentas de Usuario
              </h2>

              <h3 className={styles.subsectionTitle}>
                3.1 Cuenta de Restaurante
              </h3>
              <p>
                Para registrar un restaurante en la Plataforma, el dueño o
                responsable deberá:
              </p>
              <ul className={styles.list}>
                <li>
                  Proporcionar información veraz, actualizada y completa en el
                  formulario de registro
                </li>
                <li>
                  Mantener la confidencialidad de su nombre de usuario y
                  contraseña
                </li>
                <li>
                  Notificar al Operador de cualquier uso no autorizado de su
                  cuenta
                </li>
                <li>
                  Ser mayor de 18 años o contar con la representación legal del
                  negocio
                </li>
              </ul>
              <p>
                El Operador se reserva el derecho de suspender o cancelar
                cuentas que proporcionen información falsa o que incumplan los
                presentes Términos.
              </p>

              <h3 className={styles.subsectionTitle}>
                3.2 Cuenta de Cliente
              </h3>
              <p>
                Para crear una cuenta de cliente, el usuario deberá:
              </p>
              <ul className={styles.list}>
                <li>
                  Proporcionar su nombre, celular, dirección de entrega y una
                  contraseña
                </li>
                <li>Aceptar el Aviso de Privacidad de la Plataforma</li>
              </ul>
              <p>
                Los menores de edad podrán utilizar la Plataforma bajo la
                supervisión y responsabilidad de sus padres o tutores. Al crear
                una cuenta o realizar un pedido, se entenderá que cuentan con
                dicha autorización. Los pedidos también pueden realizarse sin
                cuenta registrada, en cuyo caso el cliente deberá proporcionar
                sus datos de contacto y entrega en cada pedido.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                4. Planes de Suscripción y Pagos
              </h2>

              <h3 className={styles.subsectionTitle}>
                4.1 Planes disponibles
              </h3>
              <p>
                La Plataforma ofrece los siguientes planes para restaurantes:
              </p>
              <ul className={styles.list}>
                <li>
                  <strong>Plan Gratuito:</strong> permite publicar hasta 10
                  platillos en el menú interactivo, generar un código QR y
                  recibir pedidos por WhatsApp, sin costo alguno.
                </li>
                <li>
                  <strong>Plan 1 Sucursal ($200 MXN/mes):</strong> platillos
                  ilimitados, gestión de promociones y avisos, y reporte de
                  ventas e ingresos para una sucursal.
                </li>
                <li>
                  <strong>Plan Multi Sucursal ($300 MXN/mes):</strong> todas
                  las funciones del plan anterior más la gestión de sucursales
                  ilimitadas.
                </li>
              </ul>

              <h3 className={styles.subsectionTitle}>
                4.2 Formas de pago
              </h3>
              <p>
                Los pagos de suscripción podrán realizarse mediante:
              </p>
              <ul className={styles.list}>
                <li>
                  Transferencia bancaria a la cuenta que el Operador indique
                </li>
                <li>
                  Pago en efectivo conforme al procedimiento que el Operador
                  establezca
                </li>
              </ul>
              <p>
                El periodo de suscripción es mensual y se renueva cada mes. La
                falta de pago en la fecha acordada podrá resultar en la
                suspensión de las funciones del plan contratado, regresando el
                restaurante al Plan Gratuito hasta regularizar el pago.
              </p>

              <h3 className={styles.subsectionTitle}>
                4.3 Cambios de plan
              </h3>
              <p>
                El restaurante podrá cambiar de plan en cualquier momento. Al
                hacer un upgrade (subir de plan), el nuevo plan entrará en
                vigor a partir del pago correspondiente. Al hacer un downgrade
                (bajar de plan), el restaurante deberá ajustar su contenido a
                los límites del nuevo plan.
              </p>

              <h3 className={styles.subsectionTitle}>
                4.4 No reembolsos
              </h3>
              <p>
                Los pagos realizados no son reembolsables, salvo en casos en
                que el servicio haya presentado interrupciones graves imputables
                al Operador por un periodo mayor a 72 horas continuas.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                5. Obligaciones de los Restaurantes
              </h2>
              <p>
                Los restaurantes registrados en la Plataforma se comprometen a:
              </p>
              <ul className={styles.list}>
                <li>
                  Publicar información veraz sobre sus platillos, precios,
                  ingredientes, horarios y datos de contacto
                </li>
                <li>
                  Mantener su menú actualizado, incluyendo disponibilidad y
                  precios vigentes
                </li>
                <li>
                  Atender los pedidos recibidos a través de la Plataforma de
                  forma oportuna y conforme a lo ofrecido en su menú
                </li>
                <li>
                  Ser responsables de la calidad, inocuidad y entrega de los
                  alimentos
                </li>
                <li>
                  No publicar contenido ofensivo, engañoso o contrario a la ley
                </li>
                <li>
                  Cumplir con las regulaciones sanitarias y legales aplicables
                  a su establecimiento
                </li>
                <li>
                  Informar al Operador sobre cualquier cambio relevante en su
                  negocio que afecte el servicio
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                6. Obligaciones de los Clientes
              </h2>
              <p>
                Los clientes que utilicen la Plataforma se comprometen a:
              </p>
              <ul className={styles.list}>
                <li>
                  Proporcionar datos de contacto y dirección de entrega
                  correctos al realizar un pedido
                </li>
                <li>
                  Estar disponibles para recibir su pedido en el domicilio
                  indicado
                </li>
                <li>
                  No realizar pedidos con información falsa o con intención de
                  causar daño al restaurante
                </li>
                <li>
                  Utilizar la Plataforma únicamente para fines lícitos
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                7. Responsabilidad del Operador
              </h2>
              <p>El Operador no se hace responsable por:</p>
              <ul className={styles.list}>
                <li>
                  La calidad, presentación, temperatura o inocuidad de los
                  alimentos entregados por los restaurantes
                </li>
                <li>
                  Retrasos en la entrega de pedidos causados por el restaurante
                  o factores externos
                </li>
                <li>
                  Errores en los pedidos derivados de información incorrecta
                  proporcionada por el cliente o el restaurante
                </li>
                <li>
                  Interrupciones del servicio de WhatsApp u otras plataformas
                  de terceros utilizadas para la comunicación de pedidos
                </li>
                <li>
                  Daños derivados del uso incorrecto de la Plataforma por parte
                  de los usuarios
                </li>
              </ul>
              <p>
                El Operador hará su mejor esfuerzo para mantener la Plataforma
                disponible de forma continua, pero no garantiza la
                disponibilidad ininterrumpida del servicio.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                8. Propiedad Intelectual
              </h2>
              <p>
                El diseño, código, logotipos, textos y demás elementos de la
                Plataforma son propiedad del Operador o de sus respectivos
                titulares. Queda prohibida su reproducción, distribución o uso
                sin autorización expresa.
              </p>
              <p>
                Los restaurantes conservan la propiedad de las imágenes y
                contenidos que publiquen en la Plataforma, otorgando al
                Operador una licencia de uso no exclusiva para mostrarlos dentro
                de la Plataforma mientras dure su suscripción.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                9. Contenido Prohibido
              </h2>
              <p>
                Queda estrictamente prohibido publicar en la Plataforma:
              </p>
              <ul className={styles.list}>
                <li>
                  Información falsa o engañosa sobre productos, precios o
                  servicios
                </li>
                <li>
                  Imágenes o descripciones de productos que no correspondan a
                  lo ofrecido
                </li>
                <li>
                  Contenido ofensivo, discriminatorio o contrario a la moral y
                  las buenas costumbres
                </li>
                <li>
                  Información de terceros sin su consentimiento
                </li>
              </ul>
              <p>
                El incumplimiento de esta sección podrá dar lugar a la
                suspensión inmediata de la cuenta sin derecho a reembolso.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                10. Suspensión y Cancelación de Cuentas
              </h2>
              <p>
                El Operador podrá suspender o cancelar una cuenta de restaurante
                o cliente en los siguientes casos:
              </p>
              <ul className={styles.list}>
                <li>
                  Incumplimiento de los presentes Términos y Condiciones
                </li>
                <li>
                  Falta de pago de la suscripción por más de 15 días naturales
                </li>
                <li>Publicación de información falsa o engañosa</li>
                <li>
                  Conducta que perjudique a otros usuarios o al Operador
                </li>
              </ul>
              <p>
                El restaurante también podrá cancelar su cuenta en cualquier
                momento, lo cual resultará en la eliminación de su menú y datos
                de la Plataforma conforme al Aviso de Privacidad.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                11. Modificaciones a los Términos
              </h2>
              <p>
                El Operador se reserva el derecho de modificar los presentes
                Términos en cualquier momento. Las modificaciones serán
                publicadas en{" "}
                <a
                  href="https://menu-regional.com/terminos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  https://menu-regional.com/terminos
                </a>{" "}
                con al menos 15 días de anticipación a su entrada en vigor. El
                uso continuo de la Plataforma después de dicha fecha implicará
                la aceptación de los nuevos Términos.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                12. Ley Aplicable y Jurisdicción
              </h2>
              <p>
                Los presentes Términos y Condiciones se rigen por las leyes de
                los Estados Unidos Mexicanos. Para cualquier controversia
                derivada del uso de la Plataforma, las partes se someten a la
                jurisdicción de los tribunales competentes del Estado de
                Hidalgo, México, renunciando a cualquier otro fuero que pudiera
                corresponderles.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>13. Contacto</h2>
              <p>
                Para cualquier duda, aclaración o solicitud relacionada con los
                presentes Términos, puede comunicarse con el Operador a través
                del sitio web{" "}
                <a
                  href="https://menu-regional.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  https://menu-regional.com
                </a>
                .
              </p>
            </section>

            <div className={styles.firma}>
              <p>Menú Regional &mdash; julio de 2026</p>
            </div>

          </article>

          <div className={styles.downloadWrap}>
            <a
              href="/terminos-condiciones-menu-regional.pdf"
              download="terminos-condiciones-menu-regional.pdf"
              className={styles.downloadBtn}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Descargar PDF
            </a>
          </div>
        </main>
      </div>

      <FooterMinimal />
    </>
  );
}
