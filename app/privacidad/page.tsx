import type { Metadata } from "next";
import Link from "next/link";
import FooterMinimal from "@/app/components/FooterMinimal";
import styles from "./Privacidad.module.css";

export const metadata: Metadata = {
  title: "Aviso de Privacidad | Menú Regional",
  description:
    "Conoce cómo Menú Regional trata y protege tus datos personales conforme a la LFPDPPP.",
};

export default function PrivacidadPage() {
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
          <h1 className={styles.bannerTitle}>Aviso de Privacidad</h1>
          <p className={styles.bannerSub}>
            Última actualización: julio de 2026
          </p>
          <a
            href="/aviso-privacidad-menu-regional.pdf"
            download="aviso-privacidad-menu-regional.pdf"
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
                1. Identidad y Domicilio del Responsable
              </h2>
              <p>
                Menú Regional (en adelante &quot;el Responsable&quot;), con
                sitio web en{" "}
                <a
                  href="https://menu-regional.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  https://menu-regional.com
                </a>
                , es responsable del tratamiento de los datos personales que
                usted nos proporcione, en los términos del presente Aviso de
                Privacidad, de conformidad con la Ley Federal de Protección de
                Datos Personales en Posesión de los Particulares (LFPDPPP) y su
                Reglamento.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                2. Datos Personales que Recabamos
              </h2>

              <h3 className={styles.subsectionTitle}>
                2.1 De los Dueños y Administradores de Restaurantes
              </h3>
              <p>
                Al registrar una cuenta de restaurante en nuestra plataforma,
                recabamos los siguientes datos:
              </p>
              <ul className={styles.list}>
                <li>Nombre del dueño o responsable del restaurante</li>
                <li>
                  Nombre de usuario y contraseña (almacenada de forma cifrada)
                </li>
                <li>Número de celular</li>
                <li>Correo electrónico (opcional)</li>
                <li>
                  Información del restaurante: nombre, descripción, logotipo e
                  imagen de portada
                </li>
                <li>
                  Datos de las sucursales: nombre, dirección (calle, número,
                  colonia, municipio, estado), coordenadas geográficas (latitud
                  y longitud), número de WhatsApp para recepción de pedidos,
                  horarios de atención, costo y rango de envío
                </li>
                <li>Imágenes de las sucursales</li>
                <li>
                  Información del plan contratado y registros de pagos
                  realizados
                </li>
              </ul>

              <h3 className={styles.subsectionTitle}>
                2.2 De los Clientes que Realizan Pedidos
              </h3>
              <p>
                Al crear una cuenta de cliente en nuestra plataforma, recabamos
                los siguientes datos:
              </p>
              <ul className={styles.list}>
                <li>Nombre completo</li>
                <li>
                  Nombre de usuario y contraseña (almacenada de forma cifrada)
                </li>
                <li>Número de celular</li>
                <li>
                  Dirección de entrega: calle, número, colonia, municipio,
                  estado y referencias adicionales
                </li>
                <li>
                  Coordenadas geográficas (latitud y longitud) de la dirección
                  de entrega
                </li>
                <li>
                  Historial de pedidos realizados, incluyendo platillos, montos,
                  tipo de envío y método de pago
                </li>
              </ul>

              <h3 className={styles.subsectionTitle}>
                2.3 Datos generados por el uso de la plataforma
              </h3>
              <p>
                Adicionalmente, la plataforma genera y almacena de forma
                automática:
              </p>
              <ul className={styles.list}>
                <li>
                  Registros de pedidos: folio, estado, detalle de platillos y
                  extras seleccionados, costos, propina, notas del pedido y
                  datos de entrega al momento de realizarlo
                </li>
                <li>
                  Conteo de escaneos de códigos QR generados por los
                  restaurantes
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                3. Finalidades del Tratamiento de Datos
              </h2>

              <h3 className={styles.subsectionTitle}>
                3.1 Finalidades primarias (necesarias para el servicio)
              </h3>
              <ul className={styles.list}>
                <li>Crear y administrar su cuenta en la plataforma</li>
                <li>
                  Permitir a los restaurantes publicar su menú, gestionar
                  platillos, sucursales, promociones y avisos
                </li>
                <li>
                  Facilitar la realización y seguimiento de pedidos de comida
                </li>
                <li>
                  Enviar los detalles del pedido al restaurante a través de
                  WhatsApp
                </li>
                <li>
                  Calcular si la dirección del cliente se encuentra dentro del
                  rango de envío del restaurante
                </li>
                <li>
                  Mostrar restaurantes y sucursales cercanas a la ubicación del
                  cliente
                </li>
                <li>
                  Gestionar los planes de suscripción y el registro de pagos de
                  los restaurantes
                </li>
                <li>
                  Generar códigos QR que dirijan al menú interactivo del
                  restaurante
                </li>
              </ul>

              <h3 className={styles.subsectionTitle}>
                3.2 Finalidades secundarias (mejora del servicio)
              </h3>
              <ul className={styles.list}>
                <li>
                  Generar reportes de ventas e ingresos para los dueños de
                  restaurantes
                </li>
                <li>
                  Analizar el uso de los códigos QR por sucursal y ubicación
                </li>
                <li>Mejorar la experiencia de usuario en la plataforma</li>
              </ul>
              <p>
                Si usted no desea que sus datos sean tratados para las
                finalidades secundarias, puede comunicarlo a través de los
                medios indicados en la sección 7 de este aviso, sin que ello
                afecte el uso principal de la plataforma.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                4. Transferencia de Datos Personales
              </h2>
              <p>
                Sus datos personales no serán transferidos, vendidos ni cedidos
                a terceros sin su consentimiento, salvo en los siguientes casos
                permitidos por la ley:
              </p>
              <ul className={styles.list}>
                <li>
                  Cuando sea requerido por autoridad competente mediante orden
                  judicial o mandato legal
                </li>
                <li>
                  Cuando sea necesario para la prestación del servicio a través
                  de proveedores tecnológicos como servicios de almacenamiento
                  en la nube y gestión de imágenes (Cloudinary), bajo acuerdos
                  de confidencialidad
                </li>
              </ul>
              <p>
                La información de su dirección y datos de entrega es compartida
                exclusivamente con el restaurante al que usted realizó un
                pedido, con la finalidad de completar la entrega.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>5. Medidas de Seguridad</h2>
              <p>
                El Responsable ha implementado las siguientes medidas técnicas
                para proteger sus datos personales:
              </p>
              <ul className={styles.list}>
                <li>
                  Las contraseñas se almacenan únicamente en formato cifrado
                  (hash) y nunca en texto plano
                </li>
                <li>
                  La comunicación entre su dispositivo y nuestra plataforma se
                  realiza mediante protocolo seguro HTTPS
                </li>
                <li>
                  El acceso a la base de datos está restringido y protegido
                </li>
                <li>
                  Las imágenes se almacenan en servidores seguros de Cloudinary
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>6. Derechos ARCO</h2>
              <p>
                Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse
                (derechos ARCO) al tratamiento de sus datos personales. También
                tiene derecho a revocar el consentimiento que haya otorgado y a
                la portabilidad de sus datos. Para ejercer sus derechos, puede:
              </p>
              <ul className={styles.list}>
                <li>
                  Acceder a su perfil dentro de la plataforma para consultar y
                  modificar sus datos directamente
                </li>
                <li>
                  Solicitar la eliminación de su cuenta, lo cual resultará en la
                  cancelación de sus datos personales conforme a lo permitido
                  por la ley
                </li>
              </ul>
              <p>
                Le daremos respuesta en un plazo máximo de 20 días hábiles a
                partir de la recepción de su solicitud.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                7. Contacto y Ejercicio de Derechos
              </h2>
              <p>
                Para cualquier solicitud relacionada con el tratamiento de sus
                datos personales, puede contactarnos a través del sitio web{" "}
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

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                8. Uso de Cookies y Tecnologías de Rastreo
              </h2>
              <p>
                Nuestra plataforma puede utilizar cookies de sesión necesarias
                para el funcionamiento del sistema de autenticación. Estas
                cookies no recopilan información personal más allá de la
                necesaria para mantener su sesión activa y no son compartidas
                con terceros con fines publicitarios.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                9. Cambios al Aviso de Privacidad
              </h2>
              <p>
                El Responsable se reserva el derecho de modificar el presente
                Aviso de Privacidad en cualquier momento. Las modificaciones
                serán publicadas en{" "}
                <a
                  href="https://menu-regional.com/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  https://menu-regional.com/privacidad
                </a>
                . Se recomienda revisar periódicamente esta página. El uso
                continuo de la plataforma después de publicados los cambios
                implica la aceptación de los mismos.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>10. Marco Legal</h2>
              <p>
                El presente Aviso de Privacidad se emite en cumplimiento de la
                Ley Federal de Protección de Datos Personales en Posesión de
                los Particulares, publicada en el Diario Oficial de la
                Federación el 5 de julio de 2010, y su Reglamento.
              </p>
            </section>

            <div className={styles.firma}>
              <p>Menú Regional &mdash; julio de 2026</p>
            </div>

          </article>

          {/* Botón de descarga secundario al final del artículo */}
          <div className={styles.downloadWrap}>
            <a
              href="/aviso-privacidad-menu-regional.pdf"
              download="aviso-privacidad-menu-regional.pdf"
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
