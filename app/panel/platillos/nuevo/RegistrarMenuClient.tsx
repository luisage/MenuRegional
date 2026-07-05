"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./Menu.module.css";
import {
  crearCategoria,
  editarCategoria,
  desactivarCategoria,
  crearPlatillo,
  editarPlatillo,
  obtenerPlatillo,
  activarPlatillo,
  desactivarPlatillo,
  buscarIngredientes,
  crearIngrediente,
  buscarExtras,
} from "@/app/lib/actions/menu";
import { subirImagenDirecto } from "@/app/lib/uploadCloudinary";
import SuscribeteModal from "../../SuscribeteModal";

// ── Types ──────────────────────────────────────────────────────────────────

export type CategoriaItem = {
  id: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
};

export type PlatilloItem = {
  id: string;
  nombre: string;
  descripcion: string | null;
  costo: string;
  imagenUrl: string | null;
  disponible: boolean;
  categoriaId: string;
  categoriaNombre: string;
};

export type SucursalItem = {
  id: string;
  nombre: string;
};

type IngredItem = { id: string; nombre: string };
type ExtraChip = { nombre: string; costo: string };

type Props = {
  categorias: CategoriaItem[];
  platillos: PlatilloItem[];
  sucursales: SucursalItem[];
  mostrarBannerGratis: boolean;
  puedeAgregarPlatillo: boolean;
};

// ── Icons ──────────────────────────────────────────────────────────────────

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function AddToMenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
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

function ImageIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function PlateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 9 9" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  );
}

// ── Dropdown de búsqueda reutilizable ─────────────────────────────────────

type SearchDropdownProps = {
  value: string;
  onChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  placeholder: string;
  showDrop: boolean;
  loading: boolean;
  suggestions: React.ReactNode;
};

function SearchDropdown({ value, onChange, onFocus, onBlur, placeholder, showDrop, loading, suggestions }: SearchDropdownProps) {
  return (
    <div className={styles.ingredInputContainer}>
      <input type="text" className={styles.input} value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus} onBlur={onBlur}
        placeholder={placeholder} autoComplete="off" />
      {showDrop && (
        <div className={styles.ingredSuggestions}>
          {loading ? <div className={styles.ingredSuggestionEmpty}>Buscando…</div> : suggestions}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function RegistrarMenuClient({
  categorias,
  platillos,
  sucursales,
  mostrarBannerGratis,
  puedeAgregarPlatillo,
}: Props) {
  const router = useRouter();
  const [mensajeSuscribete, setMensajeSuscribete] = useState<string | null>(null);

  // ── Filtro de categoría ──
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const platillosFiltrados = filtroCategoria
    ? platillos.filter((p) => p.categoriaId === filtroCategoria)
    : platillos;

  // ── Modal categoría ──
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catEditing, setCatEditing] = useState<CategoriaItem | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmNombre = categorias.find((c) => c.id === confirmId)?.nombre ?? "";

  const [catNombre, setCatNombre] = useState("");
  const [catDescripcion, setCatDescripcion] = useState("");
  const [catOrden, setCatOrden] = useState("0");
  const [catError, setCatError] = useState("");
  const [catPending, startCat] = useTransition();
  const [confirmPending, startConfirm] = useTransition();

  // ── Modal platillo (add/edit compartido) ──
  const [platModalOpen, setPlatModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null); // null = modo agregar
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);
  const modoEdicion = editandoId !== null;

  const [platNombre, setPlatNombre] = useState("");
  const [platCategoriaId, setPlatCategoriaId] = useState(categorias[0]?.id ?? "");
  const [platTamano, setPlatTamano] = useState("");
  const [platTipo, setPlatTipo] = useState("");
  const [platCosto, setPlatCosto] = useState("");
  const [platDescripcion, setPlatDescripcion] = useState("");
  const [platImagen, setPlatImagen] = useState<File | null>(null);
  const [platImagenPreview, setPlatImagenPreview] = useState<string | null>(null);
  const [platSucursales, setPlatSucursales] = useState<string[]>(sucursales.map((s) => s.id));
  const [platError, setPlatError] = useState("");
  const [platPending, startPlat] = useTransition();
  const [isDragging, setIsDragging] = useState(false);

  // ── Confirmar quitar platillo del menú ──
  const [confirmPlatId, setConfirmPlatId] = useState<string | null>(null);
  const confirmPlatNombre = platillos.find((p) => p.id === confirmPlatId)?.nombre ?? "";
  const [deletePlatPending, startDeletePlat] = useTransition();

  // ── Confirmar agregar platillo al menú ──
  const [confirmActivarId, setConfirmActivarId] = useState<string | null>(null);
  const confirmActivarNombre = platillos.find((p) => p.id === confirmActivarId)?.nombre ?? "";
  const [activarPlatPending, startActivarPlat] = useTransition();
  const dropRef = useRef<HTMLDivElement>(null);

  // ── Ingredientes ──
  const [ingredSearch, setIngredSearch] = useState("");
  const [ingredSuggestions, setIngredSuggestions] = useState<IngredItem[]>([]);
  const [ingredLoading, setIngredLoading] = useState(false);
  const [showIngredDrop, setShowIngredDrop] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<IngredItem[]>([]);
  const [ingredSavePending, startIngredSave] = useTransition();

  // ── Extras ──
  const [extraSearch, setExtraSearch] = useState("");
  const [extraSuggestions, setExtraSuggestions] = useState<ExtraChip[]>([]);
  const [extraLoading, setExtraLoading] = useState(false);
  const [showExtraDrop, setShowExtraDrop] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<ExtraChip[]>([]);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [extraNuevoCosto, setExtraNuevoCosto] = useState("");

  // ── Debounce ingredientes ──
  useEffect(() => {
    const q = ingredSearch.trim();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q.length < 1) { setIngredSuggestions([]); setShowIngredDrop(false); setIngredLoading(false); return; }
    setIngredLoading(true);
    const t = setTimeout(async () => {
      const results = await buscarIngredientes(q);
      setIngredSuggestions(results); setShowIngredDrop(true); setIngredLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [ingredSearch]);

  // ── Debounce extras ──
  useEffect(() => {
    const q = extraSearch.trim();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q.length < 1) { setExtraSuggestions([]); setShowExtraDrop(false); setExtraLoading(false); return; }
    setExtraLoading(true);
    const t = setTimeout(async () => {
      const results = await buscarExtras(q);
      setExtraSuggestions(results); setShowExtraDrop(true); setExtraLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [extraSearch]);

  const showSaveIngredBtn =
    ingredSearch.trim().length > 0 &&
    !ingredSuggestions.some((s) => s.nombre.toLowerCase() === ingredSearch.trim().toLowerCase()) &&
    !selectedIngredients.some((s) => s.nombre.toLowerCase() === ingredSearch.trim().toLowerCase());

  const showSaveExtraBtn =
    extraSearch.trim().length > 0 && !showExtraForm &&
    !extraSuggestions.some((s) => s.nombre.toLowerCase() === extraSearch.trim().toLowerCase()) &&
    !selectedExtras.some((s) => s.nombre.toLowerCase() === extraSearch.trim().toLowerCase());

  // ── Helpers ───────────────────────────────────────────────────────────────

  function resetPlatForm() {
    setPlatNombre(""); setPlatCategoriaId(categorias[0]?.id ?? "");
    setPlatTamano(""); setPlatTipo(""); setPlatCosto(""); setPlatDescripcion("");
    setPlatImagen(null); setPlatImagenPreview(null);
    setPlatSucursales(sucursales.map((s) => s.id)); setPlatError("");
    setIngredSearch(""); setIngredSuggestions([]); setShowIngredDrop(false); setSelectedIngredients([]);
    setExtraSearch(""); setExtraSuggestions([]); setShowExtraDrop(false);
    setSelectedExtras([]); setShowExtraForm(false); setExtraNuevoCosto("");
  }

  function openAddCat() {
    setCatEditing(null); setCatNombre(""); setCatDescripcion(""); setCatOrden("0"); setCatError("");
    setCatModalOpen(true);
  }

  function openEditCat(cat: CategoriaItem) {
    setCatEditing(cat); setCatNombre(cat.nombre); setCatDescripcion(cat.descripcion ?? "");
    setCatOrden(String(cat.orden)); setCatError(""); setCatModalOpen(true);
  }

  function closeCatModal() { setCatModalOpen(false); setCatEditing(null); setCatError(""); }

  function openPlatModal() {
    resetPlatForm(); setEditandoId(null); setPlatModalOpen(true);
  }

  async function openEditPlatModal(platilloId: string) {
    setEditLoadingId(platilloId);
    const result = await obtenerPlatillo(platilloId);
    setEditLoadingId(null);
    if (!("ok" in result)) return;

    const p = result.platillo;
    setPlatNombre(p.nombre);
    setPlatCategoriaId(p.categoriaId);
    setPlatTamano(p.tamano);
    setPlatTipo(p.tipo);
    setPlatCosto(p.costo);
    setPlatDescripcion(p.descripcion);
    setPlatImagen(null);
    setPlatImagenPreview(p.imagenUrl);
    setPlatSucursales(p.sucursalIds.length > 0 ? p.sucursalIds : sucursales.map((s) => s.id));
    setSelectedIngredients(p.ingredientes);
    setSelectedExtras(p.extras);
    setPlatError("");
    setIngredSearch(""); setIngredSuggestions([]); setShowIngredDrop(false);
    setExtraSearch(""); setExtraSuggestions([]); setShowExtraDrop(false);
    setShowExtraForm(false); setExtraNuevoCosto("");
    setEditandoId(platilloId);
    setPlatModalOpen(true);
  }

  function closePlatModal() { setPlatModalOpen(false); setPlatError(""); setEditandoId(null); }

  function handleImageSelect(file: File) {
    if (!file.type.startsWith("image/")) return;
    setPlatImagen(file); setPlatImagenPreview(URL.createObjectURL(file));
  }

  function toggleSucursal(id: string, checked: boolean) {
    setPlatSucursales((prev) => checked ? [...prev, id] : prev.filter((s) => s !== id));
  }

  function handleSelectIngredient(item: IngredItem) {
    if (!selectedIngredients.find((i) => i.id === item.id))
      setSelectedIngredients((prev) => [...prev, item]);
    setIngredSearch(""); setIngredSuggestions([]); setShowIngredDrop(false);
  }

  function handleRemoveIngredient(id: string) {
    setSelectedIngredients((prev) => prev.filter((i) => i.id !== id));
  }

  function handleSaveIngredient() {
    const nombre = ingredSearch.trim();
    if (!nombre) return;
    startIngredSave(async () => {
      const result = await crearIngrediente(nombre);
      if ("ok" in result) handleSelectIngredient({ id: result.id, nombre: result.nombre });
    });
  }

  function handleSelectExtra(item: ExtraChip) {
    if (!selectedExtras.find((e) => e.nombre.toLowerCase() === item.nombre.toLowerCase()))
      setSelectedExtras((prev) => [...prev, item]);
    setExtraSearch(""); setExtraSuggestions([]); setShowExtraDrop(false);
  }

  function handleRemoveExtra(nombre: string) {
    setSelectedExtras((prev) => prev.filter((e) => e.nombre !== nombre));
  }

  function handleConfirmNewExtra() {
    const nombre = extraSearch.trim();
    if (!nombre) return;
    setSelectedExtras((prev) => [...prev, { nombre, costo: extraNuevoCosto.trim() || "0" }]);
    setExtraSearch(""); setExtraNuevoCosto(""); setShowExtraForm(false);
    setExtraSuggestions([]); setShowExtraDrop(false);
  }

  // ── Submits ───────────────────────────────────────────────────────────────

  function handleCatSubmit() {
    const fd = new FormData();
    fd.append("nombre", catNombre); fd.append("descripcion", catDescripcion); fd.append("orden", catOrden);
    startCat(async () => {
      const result = catEditing
        ? await editarCategoria(catEditing.id, fd)
        : await crearCategoria(fd);
      if ("ok" in result) { closeCatModal(); router.refresh(); }
      else setCatError(result.error);
    });
  }

  function handleDeleteConfirm() {
    if (!confirmId) return;
    startConfirm(async () => {
      const result = await desactivarCategoria(confirmId);
      if ("ok" in result) { setConfirmId(null); router.refresh(); }
    });
  }

  function handleDeletePlatConfirm() {
    if (!confirmPlatId) return;
    startDeletePlat(async () => {
      const result = await desactivarPlatillo(confirmPlatId);
      if ("ok" in result) { setConfirmPlatId(null); router.refresh(); }
    });
  }

  function handleActivarPlatConfirm() {
    if (!confirmActivarId) return;
    startActivarPlat(async () => {
      const result = await activarPlatillo(confirmActivarId);
      if ("ok" in result) { setConfirmActivarId(null); router.refresh(); }
    });
  }

  function handlePlatSubmit() {
    startPlat(async () => {
      const fd = new FormData();
      fd.append("nombre", platNombre); fd.append("categoriaId", platCategoriaId);
      fd.append("tamano", platTamano); fd.append("tipo", platTipo);
      fd.append("costo", platCosto); fd.append("descripcion", platDescripcion);
      platSucursales.forEach((id) => fd.append("sucursales", id));
      selectedIngredients.forEach((i) => fd.append("ingredientes", i.id));
      fd.append("extras", JSON.stringify(selectedExtras));

      if (platImagen) {
        try {
          const { url, publicId } = await subirImagenDirecto(platImagen, "menu_regional/platillos");
          fd.append("imagenUrl", url);
          fd.append("imagenPublicId", publicId);
        } catch (err) {
          setPlatError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
          return;
        }
      }

      const result = modoEdicion && editandoId
        ? await editarPlatillo(editandoId, fd)
        : await crearPlatillo(fd);
      if ("ok" in result) { closePlatModal(); router.refresh(); }
      else setPlatError(result.error);
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className={styles.wrapper}>

        {mostrarBannerGratis && (
          <div className={styles.planBanner}>
            <p className={styles.planBannerTexto}>
              Con el plan Gratis solo puedes agregar 10 platillos, suscríbete para poder agregar tu menú completo.
            </p>
            <button
              type="button"
              className={styles.planBannerBtn}
              onClick={() => setMensajeSuscribete("Suscríbete para poder agregar tu menú completo.")}
            >
              Planes
            </button>
          </div>
        )}

        {/* ══ CATEGORÍAS ══ */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Categorías de comida</h2>
            <button type="button" className={styles.addBtn} onClick={openAddCat} aria-label="Agregar categoría">+</button>
          </div>

          <div className={`${styles.catRow} ${styles.listHeader}`}>
            <span>Nombre</span>
            <span style={{ textAlign: "center" }}>Orden</span>
            <span />
          </div>

          <div className={styles.catList}>
            {categorias.length === 0 ? (
              <p className={styles.emptyState}>Sin categorías. Agrega la primera.</p>
            ) : (
              categorias.map((cat) => (
                <div key={cat.id} className={styles.catRow}>
                  <span className={styles.rowText}>{cat.nombre}</span>
                  <span className={styles.rowNumber}>{cat.orden}</span>
                  <span className={styles.rowActions}>
                    <button type="button" className={`${styles.iconBtn} ${styles.iconBtnEdit}`}
                      aria-label="Editar categoría" onClick={() => openEditCat(cat)}><EditIcon /></button>
                    <button type="button" className={`${styles.iconBtn} ${styles.iconBtnDelete}`}
                      aria-label="Eliminar categoría" onClick={() => setConfirmId(cat.id)}><TrashIcon /></button>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ══ PLATILLOS ══ */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Platillos</h2>
            {categorias.length > 0 && (
              <select className={styles.filterSelect} value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}>
                <option value="">Todas las categorías</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            )}
            <button
              type="button"
              className={styles.addBtn}
              aria-label="Agregar platillo"
              onClick={() => {
                if (!puedeAgregarPlatillo) {
                  setMensajeSuscribete("Suscríbete para poder agregar tu menú completo.");
                  return;
                }
                openPlatModal();
              }}
            >
              +
            </button>
          </div>

          <div className={`${styles.platRow} ${styles.listHeader} ${styles.platListHeader}`}>
            <span />
            <span>Nombre</span>
            <span>Categoría</span>
            <span>Costo</span>
            <span />
          </div>

          <div className={styles.platList}>
            {platillosFiltrados.length === 0 ? (
              <p className={styles.emptyState}>
                {filtroCategoria ? "Sin platillos en esta categoría." : "Sin platillos registrados. Agrega el primero."}
              </p>
            ) : (
              platillosFiltrados.map((plat) => (
                <div key={plat.id} className={`${styles.platRow} ${!plat.disponible ? styles.platRowUnavailable : ""}`}>
                  {plat.imagenUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={plat.imagenUrl} alt={plat.nombre} className={styles.platThumb} />
                  ) : (
                    <span className={styles.platThumbPlaceholder}><PlateIcon /></span>
                  )}
                  {/* nombre + descripción (descripción solo visible en mobile) */}
                  <span className={styles.platContent}>
                    <span className={styles.rowText}>{plat.nombre}</span>
                    {plat.descripcion && (
                      <span className={styles.platDescMobile}>{plat.descripcion}</span>
                    )}
                  </span>
                  <span className={styles.rowMuted}>{plat.categoriaNombre}</span>
                  <span className={`${styles.rowMuted} ${styles.platCosto}`}>${Number(plat.costo).toFixed(2)}</span>
                  <span className={styles.rowActions}>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.iconBtnEdit}`}
                      aria-label="Editar platillo"
                      disabled={editLoadingId === plat.id}
                      onClick={() => openEditPlatModal(plat.id)}
                    >
                      {editLoadingId === plat.id ? (
                        <span className={styles.miniSpinner} />
                      ) : (
                        <EditIcon />
                      )}
                    </button>
                    {plat.disponible ? (
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnDelete}`}
                        aria-label="Quitar platillo del menú"
                        onClick={() => setConfirmPlatId(plat.id)}
                      >
                        <TrashIcon />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnActivar}`}
                        aria-label="Agregar platillo al menú"
                        onClick={() => setConfirmActivarId(plat.id)}
                      >
                        <AddToMenuIcon />
                      </button>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ══ MODAL CATEGORÍA ══ */}
      {catModalOpen && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeCatModal(); }}>
          <div className={styles.modal} role="dialog" aria-modal>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{catEditing ? "Editar categoría" : "Nueva categoría"}</h3>
              <button type="button" className={styles.modalClose} onClick={closeCatModal} aria-label="Cerrar"><CloseIcon /></button>
            </div>
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Nombre *</label>
                <input type="text" className={styles.input} value={catNombre} autoFocus
                  onChange={(e) => { setCatNombre(e.target.value); setCatError(""); }}
                  placeholder="Ej: Hamburguesas, Tacos, Bebidas…" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Descripción</label>
                <textarea className={styles.textarea} rows={2} value={catDescripcion}
                  onChange={(e) => setCatDescripcion(e.target.value)}
                  placeholder="Descripción opcional de la categoría…" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Orden</label>
                <input type="number" className={styles.input} value={catOrden}
                  onChange={(e) => { setCatOrden(e.target.value); setCatError(""); }} placeholder="0" />
                <span className={styles.hint}>Orden en que aparecerá en el menú</span>
              </div>
              {catError && <p className={styles.feedbackError}>{catError}</p>}
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={closeCatModal}>Cancelar</button>
                <button type="button" className={styles.btnPrimary} disabled={catPending} onClick={handleCatSubmit}>
                  {catPending ? "Guardando…" : catEditing ? "Guardar cambios" : "Agregar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL CONFIRMAR DESACTIVAR ══ */}
      {confirmId && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) setConfirmId(null); }}>
          <div className={styles.modal} role="alertdialog" aria-modal style={{ maxWidth: 380 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Desactivar categoría</h3>
              <button type="button" className={styles.modalClose} onClick={() => setConfirmId(null)} aria-label="Cerrar"><CloseIcon /></button>
            </div>
            <p className={styles.confirmText}>¿Desactivar <strong>{confirmNombre}</strong>?</p>
            <p className={styles.confirmSub}>La categoría dejará de mostrarse en el menú. Los platillos que pertenecen a ella no se eliminan.</p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSecondary} onClick={() => setConfirmId(null)}>Cancelar</button>
              <button type="button" className={styles.btnDanger} disabled={confirmPending} onClick={handleDeleteConfirm}>
                {confirmPending ? "Desactivando…" : "Sí, desactivar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL CONFIRMAR QUITAR PLATILLO ══ */}
      {confirmPlatId && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) setConfirmPlatId(null); }}>
          <div className={styles.modal} role="alertdialog" aria-modal style={{ maxWidth: 380 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Quitar platillo del menú</h3>
              <button type="button" className={styles.modalClose} onClick={() => setConfirmPlatId(null)} aria-label="Cerrar"><CloseIcon /></button>
            </div>
            <p className={styles.confirmText}>¿Está seguro de quitar el platillo del menú?</p>
            <p className={styles.confirmSub}><strong>{confirmPlatNombre}</strong> dejará de mostrarse en el menú. Puedes volver a agregarlo cuando quieras.</p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSecondary} onClick={() => setConfirmPlatId(null)}>Cancelar</button>
              <button type="button" className={styles.btnDanger} disabled={deletePlatPending} onClick={handleDeletePlatConfirm}>
                {deletePlatPending ? "Quitando…" : "Sí, quitar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL CONFIRMAR AGREGAR AL MENÚ ══ */}
      {confirmActivarId && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) setConfirmActivarId(null); }}>
          <div className={styles.modal} role="alertdialog" aria-modal style={{ maxWidth: 380 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Agregar platillo al menú</h3>
              <button type="button" className={styles.modalClose} onClick={() => setConfirmActivarId(null)} aria-label="Cerrar"><CloseIcon /></button>
            </div>
            <p className={styles.confirmText}>¿Está seguro de agregar el platillo al menú?</p>
            <p className={styles.confirmSub}><strong>{confirmActivarNombre}</strong> volverá a mostrarse en el menú.</p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSecondary} onClick={() => setConfirmActivarId(null)}>Cancelar</button>
              <button type="button" className={styles.btnPrimary} disabled={activarPlatPending} onClick={handleActivarPlatConfirm}>
                {activarPlatPending ? "Agregando…" : "Sí, agregar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL PLATILLO (agregar / editar) ══ */}
      {platModalOpen && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) closePlatModal(); }}>
          <div className={`${styles.modal} ${styles.modalWide}`} role="dialog" aria-modal>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{modoEdicion ? "Editar platillo" : "Nuevo platillo"}</h3>
              <button type="button" className={styles.modalClose} onClick={closePlatModal} aria-label="Cerrar"><CloseIcon /></button>
            </div>

            <div className={styles.form}>
              {/* Imagen */}
              <div className={styles.field}>
                <span className={styles.label}>Imagen</span>
                <div ref={dropRef}
                  className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ""}`}
                  onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { if (!dropRef.current?.contains(e.relatedTarget as Node)) setIsDragging(false); }}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleImageSelect(f); }}
                >
                  {platImagenPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={platImagenPreview} alt="Vista previa" className={styles.dropzonePreview} />
                  ) : (
                    <>
                      <span className={styles.dropzoneIcon}><ImageIcon /></span>
                      <span className={styles.dropzoneText}>{isDragging ? "Suelta la imagen aquí" : "Arrastra o selecciona una imagen"}</span>
                      <span className={styles.dropzoneSubtext}>PNG, JPG o WebP · Máx. 5 MB</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className={styles.dropzoneFileInput}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }} />
                </div>
                {modoEdicion && platImagenPreview && !platImagen && (
                  <span className={styles.hint}>Imagen actual. Selecciona una nueva para reemplazarla.</span>
                )}
              </div>

              {/* Nombre */}
              <div className={styles.field}>
                <label className={styles.label}>Nombre *</label>
                <input type="text" className={styles.input} value={platNombre} autoFocus
                  onChange={(e) => { setPlatNombre(e.target.value); setPlatError(""); }}
                  placeholder="Nombre del platillo" />
              </div>

              {/* Categoría */}
              <div className={styles.field}>
                <label className={styles.label}>Categoría *</label>
                {categorias.length === 0 ? (
                  <div className={styles.noCatNotice}>
                    <p className={styles.noCatText}>
                      Primero registra la categoría en la que se encontrará el platillo.<br />
                      <em>Ejemplo: Hamburguesas, Antojitos, Bebidas, etc.</em>
                    </p>
                    <button type="button" className={styles.noCatBtn}
                      onClick={() => { closePlatModal(); openAddCat(); }}>+ Agregar categoría</button>
                  </div>
                ) : (
                  <select className={styles.select} value={platCategoriaId}
                    onChange={(e) => { setPlatCategoriaId(e.target.value); setPlatError(""); }}>
                    {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                )}
              </div>

              {/* Tamaño y Tipo */}
              <div className={styles.fieldRow2}>
                <div className={styles.field}>
                  <label className={styles.label}>Tamaño</label>
                  <input type="text" className={styles.input} value={platTamano}
                    onChange={(e) => setPlatTamano(e.target.value)} placeholder="Mediano" />
                  <span className={styles.hint}>Ejemplo: Chico, Mediano, Grande</span>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Tipo</label>
                  <input type="text" className={styles.input} value={platTipo}
                    onChange={(e) => setPlatTipo(e.target.value)} placeholder="Especial" />
                  <span className={styles.hint}>Ejemplo: Vegetariano, Picante, Especial</span>
                </div>
              </div>

              {/* Costo */}
              <div className={styles.field}>
                <label className={styles.label}>Costo *</label>
                <input type="number" min="0" step="0.50" className={styles.input}
                  value={platCosto} onChange={(e) => { setPlatCosto(e.target.value); setPlatError(""); }}
                  placeholder="0.00" />
              </div>

              {/* Descripción */}
              <div className={styles.field}>
                <label className={styles.label}>Descripción</label>
                <textarea className={styles.textarea} rows={2} value={platDescripcion}
                  onChange={(e) => setPlatDescripcion(e.target.value)}
                  placeholder="Descripción del platillo, ingredientes destacados…" />
              </div>

              {/* ── Ingredientes ── */}
              <div className={styles.field}>
                <span className={styles.label}>Ingredientes</span>
                <span className={styles.hint}>Ingredientes que quizá el cliente no quiera. Ej. Jitomate, Picante</span>
                <div className={styles.ingredWrap}>
                  <div className={styles.ingredInputRow}>
                    <SearchDropdown
                      value={ingredSearch} onChange={setIngredSearch}
                      onFocus={() => { if (ingredSuggestions.length > 0) setShowIngredDrop(true); }}
                      onBlur={() => setTimeout(() => setShowIngredDrop(false), 150)}
                      placeholder="Buscar ingrediente…"
                      showDrop={showIngredDrop} loading={ingredLoading}
                      suggestions={
                        ingredSuggestions.filter((s) => !selectedIngredients.find((sel) => sel.id === s.id)).length === 0
                          ? <div className={styles.ingredSuggestionEmpty}>Sin resultados</div>
                          : ingredSuggestions
                              .filter((s) => !selectedIngredients.find((sel) => sel.id === s.id))
                              .map((item) => (
                                <button key={item.id} type="button" className={styles.ingredSuggestion}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleSelectIngredient(item)}>{item.nombre}</button>
                              ))
                      }
                    />
                    {showSaveIngredBtn && (
                      <button type="button" className={styles.ingredSaveBtn}
                        disabled={ingredSavePending}
                        onMouseDown={(e) => e.preventDefault()} onClick={handleSaveIngredient}>
                        {ingredSavePending ? "…" : "Guardar"}
                      </button>
                    )}
                  </div>
                  {selectedIngredients.length > 0 && (
                    <div className={styles.ingredChips}>
                      {selectedIngredients.map((ingred) => (
                        <span key={ingred.id} className={styles.ingredChip}>
                          {ingred.nombre}
                          <button type="button" className={styles.ingredChipRemove}
                            onClick={() => handleRemoveIngredient(ingred.id)}
                            aria-label={`Quitar ${ingred.nombre}`}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Extras ── */}
              <div className={styles.field}>
                <span className={styles.label}>Extras</span>
                <span className={styles.hint}>Complementos opcionales con costo adicional. Ej. Orilla de queso, Papas extra</span>
                <div className={styles.ingredWrap}>
                  <div className={styles.ingredInputRow}>
                    <SearchDropdown
                      value={extraSearch}
                      onChange={(v) => { setExtraSearch(v); if (showExtraForm) setShowExtraForm(false); }}
                      onFocus={() => { if (extraSuggestions.length > 0) setShowExtraDrop(true); }}
                      onBlur={() => setTimeout(() => setShowExtraDrop(false), 150)}
                      placeholder="Buscar extra…"
                      showDrop={showExtraDrop} loading={extraLoading}
                      suggestions={
                        extraSuggestions.filter((s) => !selectedExtras.find((sel) => sel.nombre.toLowerCase() === s.nombre.toLowerCase())).length === 0
                          ? <div className={styles.ingredSuggestionEmpty}>Sin resultados</div>
                          : extraSuggestions
                              .filter((s) => !selectedExtras.find((sel) => sel.nombre.toLowerCase() === s.nombre.toLowerCase()))
                              .map((item) => (
                                <button key={item.nombre} type="button" className={styles.ingredSuggestion}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleSelectExtra(item)}>
                                  {item.nombre}
                                  <span className={styles.extraSuggestionCosto}>+${Number(item.costo).toFixed(2)}</span>
                                </button>
                              ))
                      }
                    />
                    {showSaveExtraBtn && (
                      <button type="button" className={styles.ingredSaveBtn}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setShowExtraForm(true); setShowExtraDrop(false); }}>
                        Guardar
                      </button>
                    )}
                  </div>

                  {showExtraForm && (
                    <div className={styles.extraNuevoForm}>
                      <span className={styles.extraNuevoNombre}>&ldquo;{extraSearch.trim()}&rdquo;</span>
                      <div className={styles.extraNuevoCostoRow}>
                        <span className={styles.extraCostoLabel}>Costo:</span>
                        <div className={styles.extraCostoWrap}>
                          <span className={styles.extraCostoPrefix}>$</span>
                          <input type="number" min="0" step="0.50"
                            className={`${styles.input} ${styles.extraCostoInput}`}
                            value={extraNuevoCosto} onChange={(e) => setExtraNuevoCosto(e.target.value)}
                            placeholder="0.00" autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleConfirmNewExtra(); } }} />
                        </div>
                        <button type="button" className={`${styles.btnPrimary} ${styles.extraConfirmBtn}`}
                          onClick={handleConfirmNewExtra}>Agregar</button>
                        <button type="button" className={`${styles.btnSecondary} ${styles.extraConfirmBtn}`}
                          onClick={() => { setShowExtraForm(false); setExtraNuevoCosto(""); }}>✕</button>
                      </div>
                    </div>
                  )}

                  {selectedExtras.length > 0 && (
                    <div className={styles.ingredChips}>
                      {selectedExtras.map((extra) => (
                        <span key={extra.nombre} className={`${styles.ingredChip} ${styles.extraChip}`}>
                          {extra.nombre}
                          {Number(extra.costo) > 0 && (
                            <span className={styles.extraChipCosto}>+${Number(extra.costo).toFixed(2)}</span>
                          )}
                          <button type="button" className={styles.ingredChipRemove}
                            onClick={() => handleRemoveExtra(extra.nombre)}
                            aria-label={`Quitar ${extra.nombre}`}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sucursales (solo si hay más de una) */}
              {sucursales.length > 1 && (
                <div className={styles.field}>
                  <span className={styles.label}>Disponible en sucursales</span>
                  <div className={styles.sucursalesGrid}>
                    {sucursales.map((s) => (
                      <label key={s.id} className={styles.checkLabel}>
                        <input type="checkbox" checked={platSucursales.includes(s.id)}
                          onChange={(e) => toggleSucursal(s.id, e.target.checked)} />
                        {s.nombre}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {platError && <p className={styles.feedbackError}>{platError}</p>}

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={closePlatModal}>Cancelar</button>
                <button type="button" className={styles.btnPrimary}
                  disabled={platPending || categorias.length === 0} onClick={handlePlatSubmit}>
                  {platPending
                    ? (modoEdicion ? "Guardando…" : "Agregando…")
                    : (modoEdicion ? "Guardar cambios" : "Agregar platillo")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mensajeSuscribete && (
        <SuscribeteModal mensaje={mensajeSuscribete} onClose={() => setMensajeSuscribete(null)} />
      )}
    </>
  );
}
