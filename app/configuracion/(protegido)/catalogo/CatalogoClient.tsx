"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  crearCategoriaComida, editarCategoriaComida, toggleCategoriaComida,
  crearCategoriaTipo, editarCategoriaTipo, toggleCategoriaTipo,
  crearIngrediente, editarIngrediente, toggleIngrediente,
  crearExtra, editarExtra, toggleExtra,
} from "@/app/lib/actions/catalogo";
import styles from "./Catalogo.module.css";

// ── Tipos exportados ──────────────────────────────────────────────────────────

export type CategoriaComidaRow = {
  id: string; nombre: string; descripcion: string | null;
  orden: number; activa: boolean;
  restauranteId: string; restauranteNombre: string;
};
export type CategoriaTipoRow = {
  id: string; nombre: string; tipo: string; slug: string;
  icono: string | null; activo: boolean;
};
export type IngredienteRow = { id: string; nombre: string; activo: boolean };
export type ExtraRow = {
  id: string; nombre: string; costo: string; descripcion: string | null;
  disponible: boolean; platilloId: string;
  platilloNombre: string; restauranteNombre: string;
};
export type RestauranteOpcion = { id: string; nombre: string };
export type PlatilloOpcion = { id: string; nombre: string; restauranteId: string; restauranteNombre: string };

// ── Tipos de sección / tab / modal ───────────────────────────────────────────

type Seccion = "categorias" | "ingredientes" | "extras";
type TabCateg = "menu" | "tipo";

type ModalEstado =
  | { seccion: "categMenu"; accion: "crear" }
  | { seccion: "categMenu"; accion: "editar" | "toggle"; item: CategoriaComidaRow }
  | { seccion: "categTipo"; accion: "crear" }
  | { seccion: "categTipo"; accion: "editar" | "toggle"; item: CategoriaTipoRow }
  | { seccion: "ingrediente"; accion: "crear" }
  | { seccion: "ingrediente"; accion: "editar" | "toggle"; item: IngredienteRow }
  | { seccion: "extra"; accion: "crear" }
  | { seccion: "extra"; accion: "editar" | "toggle"; item: ExtraRow }
  | null;

// ── Íconos ────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Sub-componentes reutilizables ─────────────────────────────────────────────

function Badge({ activo }: { activo: boolean }) {
  return (
    <span className={`${styles.badge} ${activo ? styles.badgeActivo : styles.badgeInactivo}`}>
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}

function BtnEdit({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" className={styles.iconBtn} aria-label={label} onClick={onClick}>
      <EditIcon />
    </button>
  );
}

function BtnToggle({ activo, onClick, label }: { activo: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className={`${styles.iconBtn} ${activo ? styles.iconBtnDanger : styles.iconBtnSuccess}`}
      aria-label={label}
      onClick={onClick}
    >
      {activo ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CatalogoClient({
  categoriasComida,
  categoriasTipo,
  ingredientes,
  extras,
  restaurantes,
  platillos,
}: {
  categoriasComida: CategoriaComidaRow[];
  categoriasTipo: CategoriaTipoRow[];
  ingredientes: IngredienteRow[];
  extras: ExtraRow[];
  restaurantes: RestauranteOpcion[];
  platillos: PlatilloOpcion[];
}) {
  const router = useRouter();
  const [seccion, setSeccion] = useState<Seccion>("categorias");
  const [tabCateg, setTabCateg] = useState<TabCateg>("menu");
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState<ModalEstado>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Campos del formulario
  const [fNombre, setFNombre] = useState("");
  const [fDescripcion, setFDescripcion] = useState("");
  const [fOrden, setFOrden] = useState("0");
  const [fRestauranteId, setFRestauranteId] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [fIcono, setFIcono] = useState("");
  const [fCosto, setFCosto] = useState("");
  const [fPlatilloRestId, setFPlatilloRestId] = useState("");
  const [fPlatilloId, setFPlatilloId] = useState("");

  // Platillos filtrados por restaurante en modal Extra
  const platillosFiltrados = useMemo(() => {
    if (!fPlatilloRestId) return platillos;
    return platillos.filter((p) => p.restauranteId === fPlatilloRestId);
  }, [platillos, fPlatilloRestId]);

  // ── Filtros de búsqueda ────────────────────────────────────────────────────

  const categMenuFilt = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return categoriasComida;
    return categoriasComida.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.restauranteNombre.toLowerCase().includes(q)
    );
  }, [categoriasComida, busqueda]);

  const categTipoFilt = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return categoriasTipo;
    return categoriasTipo.filter((c) => c.nombre.toLowerCase().includes(q) || c.tipo.toLowerCase().includes(q));
  }, [categoriasTipo, busqueda]);

  const ingredientesFilt = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return ingredientes;
    return ingredientes.filter((i) => i.nombre.toLowerCase().includes(q));
  }, [ingredientes, busqueda]);

  const extrasFilt = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return extras;
    return extras.filter(
      (e) => e.nombre.toLowerCase().includes(q) || e.platilloNombre.toLowerCase().includes(q)
    );
  }, [extras, busqueda]);

  // ── Abrir modales ──────────────────────────────────────────────────────────

  function resetForm() {
    setFNombre(""); setFDescripcion(""); setFOrden("0");
    setFRestauranteId(restaurantes[0]?.id ?? "");
    setFTipo(""); setFIcono(""); setFCosto("");
    setFPlatilloRestId(""); setFPlatilloId("");
    setError("");
  }

  function abrirCrearCategMenu() {
    resetForm();
    setModal({ seccion: "categMenu", accion: "crear" });
  }
  function abrirEditarCategMenu(item: CategoriaComidaRow) {
    setError("");
    setFNombre(item.nombre); setFDescripcion(item.descripcion ?? "");
    setFOrden(String(item.orden)); setFRestauranteId(item.restauranteId);
    setModal({ seccion: "categMenu", accion: "editar", item });
  }
  function abrirToggleCategMenu(item: CategoriaComidaRow) {
    setError("");
    setModal({ seccion: "categMenu", accion: "toggle", item });
  }

  function abrirCrearCategTipo() {
    resetForm();
    setModal({ seccion: "categTipo", accion: "crear" });
  }
  function abrirEditarCategTipo(item: CategoriaTipoRow) {
    setError("");
    setFNombre(item.nombre); setFTipo(item.tipo); setFIcono(item.icono ?? "");
    setModal({ seccion: "categTipo", accion: "editar", item });
  }
  function abrirToggleCategTipo(item: CategoriaTipoRow) {
    setError("");
    setModal({ seccion: "categTipo", accion: "toggle", item });
  }

  function abrirCrearIngrediente() {
    resetForm();
    setModal({ seccion: "ingrediente", accion: "crear" });
  }
  function abrirEditarIngrediente(item: IngredienteRow) {
    setError(""); setFNombre(item.nombre);
    setModal({ seccion: "ingrediente", accion: "editar", item });
  }
  function abrirToggleIngrediente(item: IngredienteRow) {
    setError("");
    setModal({ seccion: "ingrediente", accion: "toggle", item });
  }

  function abrirCrearExtra() {
    resetForm();
    setFPlatilloRestId(restaurantes[0]?.id ?? "");
    setModal({ seccion: "extra", accion: "crear" });
  }
  function abrirEditarExtra(item: ExtraRow) {
    setError("");
    setFNombre(item.nombre); setFCosto(item.costo);
    setFDescripcion(item.descripcion ?? ""); setFPlatilloId(item.platilloId);
    const rest = platillos.find((p) => p.id === item.platilloId)?.restauranteId ?? "";
    setFPlatilloRestId(rest);
    setModal({ seccion: "extra", accion: "editar", item });
  }
  function abrirToggleExtra(item: ExtraRow) {
    setError("");
    setModal({ seccion: "extra", accion: "toggle", item });
  }

  function cerrarModal() { setModal(null); setError(""); }

  function cambiarSeccion(s: Seccion) {
    setSeccion(s);
    setBusqueda("");
  }

  // ── Envío del formulario ───────────────────────────────────────────────────

  function handleSubmit() {
    if (!modal || modal.accion === "toggle") return;
    setError("");

    const fd = new FormData();
    fd.set("nombre", fNombre);

    startTransition(async () => {
      let result: { ok: true } | { error: string };

      if (modal.seccion === "categMenu") {
        fd.set("descripcion", fDescripcion);
        fd.set("orden", fOrden);
        fd.set("restauranteId", fRestauranteId);
        result = modal.accion === "crear"
          ? await crearCategoriaComida(fd)
          : await editarCategoriaComida(modal.item.id, fd);

      } else if (modal.seccion === "categTipo") {
        fd.set("tipo", fTipo);
        fd.set("icono", fIcono);
        result = modal.accion === "crear"
          ? await crearCategoriaTipo(fd)
          : await editarCategoriaTipo(modal.item.id, fd);

      } else if (modal.seccion === "ingrediente") {
        result = modal.accion === "crear"
          ? await crearIngrediente(fd)
          : await editarIngrediente(modal.item.id, fd);

      } else {
        fd.set("costo", fCosto);
        fd.set("descripcion", fDescripcion);
        fd.set("platilloId", fPlatilloId);
        result = modal.accion === "crear"
          ? await crearExtra(fd)
          : await editarExtra(modal.item.id, fd);
      }

      if ("error" in result) { setError(result.error); }
      else { cerrarModal(); router.refresh(); }
    });
  }

  function handleToggle() {
    if (!modal || modal.accion !== "toggle") return;
    setError("");

    startTransition(async () => {
      let result: { ok: true } | { error: string };
      if (modal.seccion === "categMenu") result = await toggleCategoriaComida(modal.item.id);
      else if (modal.seccion === "categTipo") result = await toggleCategoriaTipo(modal.item.id);
      else if (modal.seccion === "ingrediente") result = await toggleIngrediente(modal.item.id);
      else result = await toggleExtra(modal.item.id);

      if ("error" in result) { setError(result.error); }
      else { cerrarModal(); router.refresh(); }
    });
  }

  // ── Helpers de modal ───────────────────────────────────────────────────────

  const esToggle = modal?.accion === "toggle";

  function itemActivo(): boolean {
    if (!modal || !("item" in modal)) return true;
    const it = modal.item as Record<string, unknown>;
    if ("activa" in it) return Boolean(it.activa);
    if ("activo" in it) return Boolean(it.activo);
    return Boolean(it.disponible);
  }

  function tituloModal(): string {
    if (!modal) return "";
    const tipo =
      modal.seccion === "categMenu" ? "categoría de menú" :
      modal.seccion === "categTipo" ? "categoría de restaurante" :
      modal.seccion === "ingrediente" ? "ingrediente" : "extra";
    if (modal.accion === "crear") return `Agregar ${tipo}`;
    if (modal.accion === "editar") return `Editar ${tipo}`;
    return `${itemActivo() ? "Desactivar" : "Activar"} ${tipo}`;
  }

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div>
      <h1 className={styles.pageTitle}>
        Catálogo y <em>configuración</em>
      </h1>

      {/* ── Selector de sección ─────────────────────────────────────────── */}
      <div className={styles.selectorWrap}>
        <span className={styles.selectorLabel}>Selecciona una sección</span>
        <div className={styles.selector}>
          {(["categorias", "ingredientes", "extras"] as Seccion[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.selectorBtn} ${seccion === s ? styles.selectorBtnActive : ""}`}
              onClick={() => cambiarSeccion(s)}
            >
              {s === "categorias" ? "Categorías" : s === "ingredientes" ? "Ingredientes" : "Extras"}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN: Categorías                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {seccion === "categorias" && (
        <>
          <div className={styles.tabs} role="tablist">
            <button
              type="button" role="tab"
              aria-selected={tabCateg === "menu"}
              className={`${styles.tab} ${tabCateg === "menu" ? styles.tabActive : ""}`}
              onClick={() => { setTabCateg("menu"); setBusqueda(""); }}
            >
              Categoría de menú
              <span className={styles.tabCount}>{categoriasComida.length}</span>
            </button>
            <button
              type="button" role="tab"
              aria-selected={tabCateg === "tipo"}
              className={`${styles.tab} ${tabCateg === "tipo" ? styles.tabActive : ""}`}
              onClick={() => { setTabCateg("tipo"); setBusqueda(""); }}
            >
              Categoría de restaurante
              <span className={styles.tabCount}>{categoriasTipo.length}</span>
            </button>
          </div>

          {/* Tab: Categoría de menú */}
          {tabCateg === "menu" && (
            <div role="tabpanel">
              <div className={styles.toolbar}>
                <div className={styles.buscadorWrap}>
                  <span className={styles.buscadorIcono}><SearchIcon /></span>
                  <input type="text" className={styles.buscadorInput}
                    placeholder="Buscar por nombre o restaurante..."
                    value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                    aria-label="Buscar categoría de menú" />
                </div>
                <button type="button" className={styles.agregarBtn} onClick={abrirCrearCategMenu}>
                  <PlusIcon /> Agregar
                </button>
              </div>

              {categoriasComida.length === 0 ? (
                <p className={styles.empty}>No hay categorías de menú registradas.</p>
              ) : categMenuFilt.length === 0 ? (
                <p className={styles.empty}>Sin resultados para &ldquo;{busqueda}&rdquo;.</p>
              ) : (
                <div className={styles.tabla}>
                  <div className={`${styles.filaCategComida} ${styles.encabezado}`}>
                    <span>Nombre</span><span>Restaurante</span><span>Orden</span>
                    <span>Estatus</span><span />
                  </div>
                  {categMenuFilt.map((c) => (
                    <div key={c.id} className={styles.filaCategComida}>
                      <span className={styles.nombreCelda}>{c.nombre}</span>
                      <span>{c.restauranteNombre}</span>
                      <span>{c.orden}</span>
                      <span><Badge activo={c.activa} /></span>
                      <div className={styles.accionesCelda}>
                        <BtnEdit onClick={() => abrirEditarCategMenu(c)} label={`Editar ${c.nombre}`} />
                        <BtnToggle activo={c.activa} onClick={() => abrirToggleCategMenu(c)} label={`${c.activa ? "Desactivar" : "Activar"} ${c.nombre}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Categoría de restaurante */}
          {tabCateg === "tipo" && (
            <div role="tabpanel">
              <div className={styles.toolbar}>
                <div className={styles.buscadorWrap}>
                  <span className={styles.buscadorIcono}><SearchIcon /></span>
                  <input type="text" className={styles.buscadorInput}
                    placeholder="Buscar por nombre o tipo..."
                    value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                    aria-label="Buscar categoría de restaurante" />
                </div>
                <button type="button" className={styles.agregarBtn} onClick={abrirCrearCategTipo}>
                  <PlusIcon /> Agregar
                </button>
              </div>

              {categoriasTipo.length === 0 ? (
                <p className={styles.empty}>No hay categorías de restaurante registradas.</p>
              ) : categTipoFilt.length === 0 ? (
                <p className={styles.empty}>Sin resultados para &ldquo;{busqueda}&rdquo;.</p>
              ) : (
                <div className={styles.tabla}>
                  <div className={`${styles.filaCategTipo} ${styles.encabezado}`}>
                    <span>Nombre</span><span>Tipo</span><span>Ícono</span>
                    <span>Estatus</span><span />
                  </div>
                  {categTipoFilt.map((c) => (
                    <div key={c.id} className={styles.filaCategTipo}>
                      <span className={styles.nombreCelda}>{c.nombre}</span>
                      <span>{c.tipo}</span>
                      <span className={styles.iconoCelda}>{c.icono ?? "—"}</span>
                      <span><Badge activo={c.activo} /></span>
                      <div className={styles.accionesCelda}>
                        <BtnEdit onClick={() => abrirEditarCategTipo(c)} label={`Editar ${c.nombre}`} />
                        <BtnToggle activo={c.activo} onClick={() => abrirToggleCategTipo(c)} label={`${c.activo ? "Desactivar" : "Activar"} ${c.nombre}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN: Ingredientes                                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {seccion === "ingredientes" && (
        <div>
          <div className={styles.toolbar}>
            <div className={styles.buscadorWrap}>
              <span className={styles.buscadorIcono}><SearchIcon /></span>
              <input type="text" className={styles.buscadorInput}
                placeholder="Buscar ingrediente..."
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar ingrediente" />
            </div>
            <button type="button" className={styles.agregarBtn} onClick={abrirCrearIngrediente}>
              <PlusIcon /> Agregar ingrediente
            </button>
          </div>

          {ingredientes.length === 0 ? (
            <p className={styles.empty}>No hay ingredientes registrados.</p>
          ) : ingredientesFilt.length === 0 ? (
            <p className={styles.empty}>Sin resultados para &ldquo;{busqueda}&rdquo;.</p>
          ) : (
            <div className={styles.tabla}>
              <div className={`${styles.filaIngrediente} ${styles.encabezado}`}>
                <span>Nombre</span><span>Estatus</span><span />
              </div>
              {ingredientesFilt.map((i) => (
                <div key={i.id} className={styles.filaIngrediente}>
                  <span className={styles.nombreCelda}>{i.nombre}</span>
                  <span><Badge activo={i.activo} /></span>
                  <div className={styles.accionesCelda}>
                    <BtnEdit onClick={() => abrirEditarIngrediente(i)} label={`Editar ${i.nombre}`} />
                    <BtnToggle activo={i.activo} onClick={() => abrirToggleIngrediente(i)} label={`${i.activo ? "Desactivar" : "Activar"} ${i.nombre}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN: Extras                                                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {seccion === "extras" && (
        <div>
          <div className={styles.toolbar}>
            <div className={styles.buscadorWrap}>
              <span className={styles.buscadorIcono}><SearchIcon /></span>
              <input type="text" className={styles.buscadorInput}
                placeholder="Buscar extra o platillo..."
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar extra" />
            </div>
            <button type="button" className={styles.agregarBtn} onClick={abrirCrearExtra}>
              <PlusIcon /> Agregar extra
            </button>
          </div>

          {extras.length === 0 ? (
            <p className={styles.empty}>No hay extras registrados.</p>
          ) : extrasFilt.length === 0 ? (
            <p className={styles.empty}>Sin resultados para &ldquo;{busqueda}&rdquo;.</p>
          ) : (
            <div className={styles.tabla}>
              <div className={`${styles.filaExtra} ${styles.encabezado}`}>
                <span>Nombre</span><span>Platillo</span><span>Costo</span>
                <span>Estatus</span><span />
              </div>
              {extrasFilt.map((e) => (
                <div key={e.id} className={styles.filaExtra}>
                  <span className={styles.nombreCelda}>{e.nombre}</span>
                  <span>{e.platilloNombre}</span>
                  <span className={styles.costoCelda}>${Number(e.costo).toFixed(2)}</span>
                  <span><Badge activo={e.disponible} /></span>
                  <div className={styles.accionesCelda}>
                    <BtnEdit onClick={() => abrirEditarExtra(e)} label={`Editar ${e.nombre}`} />
                    <BtnToggle activo={e.disponible} onClick={() => abrirToggleExtra(e)} label={`${e.disponible ? "Desactivar" : "Activar"} ${e.nombre}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL                                                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {modal && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={tituloModal()}
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}
        >
          <div className={styles.modalPanel}>
            <h3 className={styles.modalTitle}>{tituloModal()}</h3>

            {/* ── Modal: Toggle (confirmación) ──────────────────────────── */}
            {esToggle && "item" in modal && (
              <>
                <p className={styles.modalSubtitle}>
                  {itemActivo()
                    ? `Al desactivar este registro dejará de estar disponible en el sistema.`
                    : `Al activar este registro volverá a estar disponible en el sistema.`}
                </p>
                {error && <p className={styles.modalError}>{error}</p>}
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={cerrarModal}>Cancelar</button>
                  <button
                    type="button"
                    className={itemActivo() ? styles.dangerBtn : styles.saveBtn}
                    disabled={isPending}
                    onClick={handleToggle}
                  >
                    {isPending ? "Guardando..." : itemActivo() ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </>
            )}

            {/* ── Modal: Crear / Editar ─────────────────────────────────── */}
            {!esToggle && (
              <>
                <p className={styles.modalSubtitle}>
                  {modal.accion === "crear" ? "Completa los campos para agregar el registro." : "Modifica los datos del registro."}
                </p>

                {/* ---- Categoría de menú ---- */}
                {modal.seccion === "categMenu" && modal.accion === "crear" && (
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel} htmlFor="cm-rest">Restaurante</label>
                    <select id="cm-rest" className={styles.modalSelect}
                      value={fRestauranteId} onChange={(e) => setFRestauranteId(e.target.value)}>
                      <option value="">Selecciona un restaurante</option>
                      {restaurantes.map((r) => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
                {modal.seccion === "categMenu" && (
                  <>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel} htmlFor="cm-nombre">Nombre</label>
                      <input id="cm-nombre" type="text" className={styles.modalInput}
                        placeholder="Ej: Hamburguesas, Bebidas..."
                        value={fNombre} onChange={(e) => { setFNombre(e.target.value); setError(""); }}
                        autoFocus />
                    </div>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel} htmlFor="cm-desc">Descripción (opcional)</label>
                      <input id="cm-desc" type="text" className={styles.modalInput}
                        placeholder="Descripción breve de la categoría"
                        value={fDescripcion} onChange={(e) => setFDescripcion(e.target.value)} />
                    </div>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel} htmlFor="cm-orden">Orden de aparición</label>
                      <input id="cm-orden" type="number" min="0" className={styles.modalInput}
                        placeholder="0"
                        value={fOrden} onChange={(e) => setFOrden(e.target.value)} />
                      <span className={styles.modalHint}>Número menor = aparece primero en el menú.</span>
                    </div>
                  </>
                )}

                {/* ---- Categoría de restaurante ---- */}
                {modal.seccion === "categTipo" && (
                  <>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel} htmlFor="ct-nombre">Nombre</label>
                      <input id="ct-nombre" type="text" className={styles.modalInput}
                        placeholder="Ej: Antojitos mexicanos, Pizzas..."
                        value={fNombre} onChange={(e) => { setFNombre(e.target.value); setError(""); }}
                        autoFocus />
                    </div>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel} htmlFor="ct-tipo">Tipo</label>
                      <input id="ct-tipo" type="text" className={styles.modalInput}
                        placeholder="Ej: Comida, Bebidas, Postres..."
                        value={fTipo} onChange={(e) => { setFTipo(e.target.value); setError(""); }} />
                    </div>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel} htmlFor="ct-icono">Ícono (opcional)</label>
                      <input id="ct-icono" type="text" className={styles.modalInput}
                        placeholder="Ej: 🍕 o nombre de ícono"
                        value={fIcono} onChange={(e) => setFIcono(e.target.value)} />
                      {modal.accion === "crear" && (
                        <span className={styles.modalHint}>
                          El slug se genera automáticamente del nombre.
                        </span>
                      )}
                    </div>
                  </>
                )}

                {/* ---- Ingrediente ---- */}
                {modal.seccion === "ingrediente" && (
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel} htmlFor="ing-nombre">Nombre</label>
                    <input id="ing-nombre" type="text" className={styles.modalInput}
                      placeholder="Ej: Jitomate, Lechuga, Jalapeño..."
                      value={fNombre} onChange={(e) => { setFNombre(e.target.value); setError(""); }}
                      autoFocus />
                  </div>
                )}

                {/* ---- Extra ---- */}
                {modal.seccion === "extra" && (
                  <>
                    {modal.accion === "crear" && (
                      <>
                        <div className={styles.modalField}>
                          <label className={styles.modalLabel} htmlFor="ex-rest">Restaurante</label>
                          <select id="ex-rest" className={styles.modalSelect}
                            value={fPlatilloRestId}
                            onChange={(e) => { setFPlatilloRestId(e.target.value); setFPlatilloId(""); }}>
                            <option value="">Selecciona un restaurante</option>
                            {restaurantes.map((r) => (
                              <option key={r.id} value={r.id}>{r.nombre}</option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.modalField}>
                          <label className={styles.modalLabel} htmlFor="ex-platillo">Platillo</label>
                          <select id="ex-platillo" className={styles.modalSelect}
                            value={fPlatilloId} onChange={(e) => setFPlatilloId(e.target.value)}
                            disabled={!fPlatilloRestId}>
                            <option value="">
                              {fPlatilloRestId ? "Selecciona un platillo" : "Primero selecciona un restaurante"}
                            </option>
                            {platillosFiltrados.map((p) => (
                              <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel} htmlFor="ex-nombre">Nombre</label>
                      <input id="ex-nombre" type="text" className={styles.modalInput}
                        placeholder="Ej: Orilla de queso, Guacamole extra..."
                        value={fNombre} onChange={(e) => { setFNombre(e.target.value); setError(""); }}
                        autoFocus />
                    </div>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel} htmlFor="ex-costo">Costo ($)</label>
                      <input id="ex-costo" type="number" min="0" step="0.50" className={styles.modalInput}
                        placeholder="0.00"
                        value={fCosto} onChange={(e) => { setFCosto(e.target.value); setError(""); }} />
                    </div>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel} htmlFor="ex-desc">Descripción (opcional)</label>
                      <input id="ex-desc" type="text" className={styles.modalInput}
                        placeholder="Descripción breve del extra"
                        value={fDescripcion} onChange={(e) => setFDescripcion(e.target.value)} />
                    </div>
                  </>
                )}

                {error && <p className={styles.modalError}>{error}</p>}

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={cerrarModal}>Cancelar</button>
                  <button
                    type="button"
                    className={styles.saveBtn}
                    disabled={isPending || !fNombre.trim()}
                    onClick={handleSubmit}
                  >
                    {isPending ? "Guardando..." : modal.accion === "crear" ? "Agregar" : "Guardar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
