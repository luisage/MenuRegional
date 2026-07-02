"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./VerMenu.module.css";
import { desactivarPlatillo } from "@/app/lib/actions/menu";

// ── Types ──────────────────────────────────────────────────────────────────

export type PlatilloVista = {
  id: string;
  nombre: string;
  descripcion: string | null;
  costo: string;
  imagenUrl: string | null;
};

export type CategoriaVista = {
  id: string;
  nombre: string;
  platillos: PlatilloVista[];
};

type Props = {
  nombre: string;
  logoUrl: string | null;
  portadaUrl: string | null;
  categorias: CategoriaVista[];
};

// ── Icons ──────────────────────────────────────────────────────────────────

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PlateIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 9 9" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function VerMenuClient({ nombre, logoUrl, portadaUrl, categorias }: Props) {
  const router = useRouter();

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [quitarPending, startQuitarTransition] = useTransition();

  const allPlatillos = categorias.flatMap((c) => c.platillos);
  const confirmNombre = allPlatillos.find((p) => p.id === confirmId)?.nombre ?? "";

  function handleQuitarConfirm() {
    if (!confirmId) return;
    startQuitarTransition(async () => {
      const result = await desactivarPlatillo(confirmId);
      if ("ok" in result) { setConfirmId(null); router.refresh(); }
    });
  }

  return (
    <>
      {/* ── Header restaurante ── */}
      <div className={`${styles.restauranteHeader} ${portadaUrl ? styles.conPortada : ""}`}>
        {portadaUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={portadaUrl} alt="" className={styles.coverImg} aria-hidden="true" />
            <div className={styles.coverScrim} aria-hidden="true" />
          </>
        )}
        <div className={styles.headerContent}>
          <div className={styles.logoWrap}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={`Logo de ${nombre}`} className={styles.logo} />
            ) : (
              <span className={styles.logoPlaceholder} aria-hidden="true">
                {nombre.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h2 className={styles.restauranteNombre}>{nombre}</h2>
          <p className={styles.restauranteSubtitle}>Menú</p>
        </div>
      </div>

      {/* ── Sin platillos ── */}
      {categorias.length === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}><PlateIcon /></span>
          <p className={styles.emptyTitle}>Sin platillos disponibles</p>
          <p className={styles.emptyDesc}>Agrega platillos desde la sección <strong>Registrar menú</strong>.</p>
        </div>
      )}

      {/* ── Categorías ── */}
      <div className={styles.menu}>
        {categorias.map((cat) => (
          <section key={cat.id} className={styles.categoriaSection}>
            <div className={styles.categoriaHeader}>
              <h3 className={styles.categoriaNombre}>{cat.nombre}</h3>
              <span className={styles.categoriaLine} aria-hidden="true" />
            </div>

            <div className={styles.platillosGrid}>
              {cat.platillos.map((plat) => (
                <article key={plat.id} className={styles.platilloCard}>
                  {/* Imagen */}
                  <div className={styles.cardImgWrap}>
                    {plat.imagenUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={plat.imagenUrl}
                        alt={plat.nombre}
                        className={styles.cardImg}
                        loading="lazy"
                      />
                    ) : (
                      <span className={styles.cardImgPlaceholder} aria-hidden="true">
                        <PlateIcon />
                      </span>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className={styles.cardContent}>
                    <span className={styles.cardNombre}>{plat.nombre}</span>
                    {plat.descripcion && (
                      <span className={styles.cardDesc}>{plat.descripcion}</span>
                    )}
                    <span className={styles.cardCosto}>
                      ${Number(plat.costo).toFixed(2)}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className={styles.cardActions}>
                    <Link
                      href="/panel/platillos/nuevo"
                      className={`${styles.cardBtn} ${styles.cardBtnEdit}`}
                      aria-label={`Editar ${plat.nombre}`}
                      title="Editar platillo"
                    >
                      <EditIcon />
                    </Link>
                    <button
                      type="button"
                      className={`${styles.cardBtn} ${styles.cardBtnDelete}`}
                      aria-label={`Quitar ${plat.nombre} del menú`}
                      title="Quitar del menú"
                      onClick={() => setConfirmId(plat.id)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ── Modal confirmar quitar ── */}
      {confirmId && (
        <div
          className={styles.overlay}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmId(null); }}
        >
          <div className={styles.modal} role="alertdialog" aria-modal>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Quitar platillo del menú</h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setConfirmId(null)}
                aria-label="Cerrar"
              >
                <CloseIcon />
              </button>
            </div>
            <p className={styles.confirmText}>¿Está seguro de quitar el platillo del menú?</p>
            <p className={styles.confirmSub}>
              <strong>{confirmNombre}</strong> dejará de mostrarse. Puedes volver a agregarlo desde{" "}
              <em>Registrar menú</em>.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setConfirmId(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                disabled={quitarPending}
                onClick={handleQuitarConfirm}
              >
                {quitarPending ? "Quitando…" : "Sí, quitar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
