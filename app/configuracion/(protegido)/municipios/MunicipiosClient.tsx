"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  crearEstado, editarEstado, toggleEstadoActivo,
  crearMunicipio, editarMunicipio, toggleMunicipioActivo,
  crearColonia, editarColonia, toggleColoniaActivo,
} from "@/app/lib/actions/ubicaciones";
import styles from "./Municipios.module.css";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type EstadoRow = { id: string; nombre: string; activo: boolean };
export type MunicipioRow = {
  id: string; nombre: string; activo: boolean;
  estadoId: string; estadoNombre: string;
};
export type ColoniaRow = {
  id: string; nombre: string; activo: boolean;
  municipioId: string; municipioNombre: string;
  estadoId: string; estadoNombre: string;
};

type Tab = "estados" | "municipios" | "colonias";
type ModalTipo = "estado" | "municipio" | "colonia";
type ModalAccion = "crear" | "editar" | "toggle";

type ModalState =
  | { tipo: "estado"; accion: "crear" }
  | { tipo: "estado"; accion: "editar"; item: EstadoRow }
  | { tipo: "estado"; accion: "toggle"; item: EstadoRow }
  | { tipo: "municipio"; accion: "crear" }
  | { tipo: "municipio"; accion: "editar"; item: MunicipioRow }
  | { tipo: "municipio"; accion: "toggle"; item: MunicipioRow }
  | { tipo: "colonia"; accion: "crear" }
  | { tipo: "colonia"; accion: "editar"; item: ColoniaRow }
  | { tipo: "colonia"; accion: "toggle"; item: ColoniaRow }
  | null;

// ── Íconos SVG ───────────────────────────────────────────────────────────────

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
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

// ── Componente principal ─────────────────────────────────────────────────────

export default function MunicipiosClient({
  estados,
  municipios,
  colonias,
}: {
  estados: EstadoRow[];
  municipios: MunicipioRow[];
  colonias: ColoniaRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("estados");
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Campos del formulario
  const [nombre, setNombre] = useState("");
  const [estadoIdSel, setEstadoIdSel] = useState("");
  const [municipioIdSel, setMunicipioIdSel] = useState("");

  // Municipios filtrados por estado en modal colonia
  const municipiosFiltrados = useMemo(() => {
    if (!estadoIdSel) return municipios;
    return municipios.filter((m) => m.estadoId === estadoIdSel);
  }, [municipios, estadoIdSel]);

  function abrirCrear(tipo: ModalTipo) {
    setError("");
    setNombre("");
    setEstadoIdSel(estados[0]?.id ?? "");
    setMunicipioIdSel(municipios[0]?.id ?? "");
    setModal({ tipo, accion: "crear" } as ModalState);
  }

  function abrirEditar(tipo: "estado", item: EstadoRow): void;
  function abrirEditar(tipo: "municipio", item: MunicipioRow): void;
  function abrirEditar(tipo: "colonia", item: ColoniaRow): void;
  function abrirEditar(tipo: ModalTipo, item: EstadoRow | MunicipioRow | ColoniaRow) {
    setError("");
    setNombre(item.nombre);
    if (tipo === "municipio") {
      setEstadoIdSel((item as MunicipioRow).estadoId);
    }
    if (tipo === "colonia") {
      setEstadoIdSel((item as ColoniaRow).estadoId);
      setMunicipioIdSel((item as ColoniaRow).municipioId);
    }
    setModal({ tipo, accion: "editar", item } as unknown as ModalState);
  }

  function abrirToggle(tipo: "estado", item: EstadoRow): void;
  function abrirToggle(tipo: "municipio", item: MunicipioRow): void;
  function abrirToggle(tipo: "colonia", item: ColoniaRow): void;
  function abrirToggle(tipo: ModalTipo, item: EstadoRow | MunicipioRow | ColoniaRow) {
    setError("");
    setModal({ tipo, accion: "toggle", item } as unknown as ModalState);
  }

  function cerrarModal() {
    setModal(null);
    setError("");
  }

  function handleTabChange(nextTab: Tab) {
    setTab(nextTab);
    setBusqueda("");
  }

  // Listas filtradas
  const estadosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return estados;
    return estados.filter((e) => e.nombre.toLowerCase().includes(q));
  }, [estados, busqueda]);

  const municipiosFilt = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return municipios;
    return municipios.filter(
      (m) => m.nombre.toLowerCase().includes(q) || m.estadoNombre.toLowerCase().includes(q)
    );
  }, [municipios, busqueda]);

  const coloniasFilt = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return colonias;
    return colonias.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.municipioNombre.toLowerCase().includes(q) ||
        c.estadoNombre.toLowerCase().includes(q)
    );
  }, [colonias, busqueda]);

  // ── Submit ──────────────────────────────────────────────────────────────────

  function handleSubmit() {
    if (!modal) return;
    setError("");

    const fd = new FormData();
    fd.set("nombre", nombre);
    if (modal.tipo === "municipio") fd.set("estadoId", estadoIdSel);
    if (modal.tipo === "colonia") fd.set("municipioId", municipioIdSel);

    startTransition(async () => {
      let result: { ok: true } | { error: string };

      if (modal.accion === "crear") {
        if (modal.tipo === "estado") result = await crearEstado(fd);
        else if (modal.tipo === "municipio") result = await crearMunicipio(fd);
        else result = await crearColonia(fd);
      } else if (modal.accion === "editar" && "item" in modal) {
        if (modal.tipo === "estado") result = await editarEstado(modal.item.id, fd);
        else if (modal.tipo === "municipio") result = await editarMunicipio(modal.item.id, fd);
        else result = await editarColonia(modal.item.id, fd);
      } else {
        cerrarModal();
        return;
      }

      if ("error" in result) {
        setError(result.error);
      } else {
        cerrarModal();
        router.refresh();
      }
    });
  }

  function handleToggle() {
    if (!modal || modal.accion !== "toggle") return;
    setError("");

    startTransition(async () => {
      let result: { ok: true } | { error: string };
      if (modal.tipo === "estado") result = await toggleEstadoActivo(modal.item.id);
      else if (modal.tipo === "municipio") result = await toggleMunicipioActivo(modal.item.id);
      else result = await toggleColoniaActivo(modal.item.id);

      if ("error" in result) {
        setError(result.error);
      } else {
        cerrarModal();
        router.refresh();
      }
    });
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  function Badge({ activo }: { activo: boolean }) {
    return (
      <span className={`${styles.badge} ${activo ? styles.badgeActivo : styles.badgeInactivo}`}>
        {activo ? "Activo" : "Inactivo"}
      </span>
    );
  }

  function AccionesCelda({
    tipo, item,
  }: {
    tipo: "estado";
    item: EstadoRow;
  } | {
    tipo: "municipio";
    item: MunicipioRow;
  } | {
    tipo: "colonia";
    item: ColoniaRow;
  }) {
    return (
      <div className={styles.accionesCelda}>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label={`Editar ${item.nombre}`}
          onClick={() => {
            if (tipo === "estado") abrirEditar("estado", item as EstadoRow);
            else if (tipo === "municipio") abrirEditar("municipio", item as MunicipioRow);
            else abrirEditar("colonia", item as ColoniaRow);
          }}
        >
          <EditIcon />
        </button>
        <button
          type="button"
          className={`${styles.iconBtn} ${item.activo ? styles.iconBtnDanger : styles.iconBtnSuccess}`}
          aria-label={item.activo ? `Desactivar ${item.nombre}` : `Activar ${item.nombre}`}
          onClick={() => {
            if (tipo === "estado") abrirToggle("estado", item as EstadoRow);
            else if (tipo === "municipio") abrirToggle("municipio", item as MunicipioRow);
            else abrirToggle("colonia", item as ColoniaRow);
          }}
        >
          {item.activo ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    );
  }

  // ── Modal content ───────────────────────────────────────────────────────────

  const modalAbierto = modal !== null;
  const esToggle = modal?.accion === "toggle";

  const modalNombreTipo =
    modal?.tipo === "estado" ? "estado" :
    modal?.tipo === "municipio" ? "municipio" : "colonia";

  const modalTitulo = !modal ? "" :
    modal.accion === "crear" ? `Agregar ${modalNombreTipo}` :
    modal.accion === "editar" ? `Editar ${modalNombreTipo}` :
    `${"item" in modal && modal.item.activo ? "Desactivar" : "Activar"} ${modalNombreTipo}`;

  // ── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Encabezado */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Municipios y <em>colonias</em>
        </h1>
      </div>

      {/* Tabs */}
      <div className={styles.tabs} role="tablist">
        {(["estados", "municipios", "colonias"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
            onClick={() => handleTabChange(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span className={styles.tabCount}>
              {t === "estados" ? estados.length : t === "municipios" ? municipios.length : colonias.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── TAB: Estados ───────────────────────────────────────────────────── */}
      {tab === "estados" && (
        <div role="tabpanel">
          <div className={styles.seccionHeader}>
            <div className={styles.buscadorWrap}>
              <span className={styles.buscadorIcono}><SearchIcon /></span>
              <input
                type="text"
                className={styles.buscadorInput}
                placeholder="Buscar estado..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar estado"
              />
            </div>
            <button type="button" className={styles.agregarBtn} onClick={() => abrirCrear("estado")}>
              <PlusIcon /> Agregar estado
            </button>
          </div>

          {estados.length === 0 ? (
            <p className={styles.empty}>No hay estados registrados.</p>
          ) : estadosFiltrados.length === 0 ? (
            <p className={styles.empty}>Sin resultados para &ldquo;{busqueda}&rdquo;.</p>
          ) : (
            <div className={styles.tabla}>
              <div className={`${styles.filaEstado} ${styles.encabezado}`}>
                <span>Nombre</span>
                <span>Estatus</span>
                <span />
              </div>
              {estadosFiltrados.map((e) => (
                <div key={e.id} className={styles.filaEstado}>
                  <span className={styles.nombreCelda}>{e.nombre}</span>
                  <span><Badge activo={e.activo} /></span>
                  <AccionesCelda tipo="estado" item={e} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Municipios ─────────────────────────────────────────────────── */}
      {tab === "municipios" && (
        <div role="tabpanel">
          <div className={styles.seccionHeader}>
            <div className={styles.buscadorWrap}>
              <span className={styles.buscadorIcono}><SearchIcon /></span>
              <input
                type="text"
                className={styles.buscadorInput}
                placeholder="Buscar municipio o estado..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar municipio"
              />
            </div>
            <button type="button" className={styles.agregarBtn} onClick={() => abrirCrear("municipio")}>
              <PlusIcon /> Agregar municipio
            </button>
          </div>

          {municipios.length === 0 ? (
            <p className={styles.empty}>No hay municipios registrados.</p>
          ) : municipiosFilt.length === 0 ? (
            <p className={styles.empty}>Sin resultados para &ldquo;{busqueda}&rdquo;.</p>
          ) : (
            <div className={styles.tabla}>
              <div className={`${styles.filaMunicipio} ${styles.encabezado}`}>
                <span>Nombre</span>
                <span>Estado</span>
                <span>Estatus</span>
                <span />
              </div>
              {municipiosFilt.map((m) => (
                <div key={m.id} className={styles.filaMunicipio}>
                  <span className={styles.nombreCelda}>{m.nombre}</span>
                  <span>{m.estadoNombre}</span>
                  <span><Badge activo={m.activo} /></span>
                  <AccionesCelda tipo="municipio" item={m} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Colonias ───────────────────────────────────────────────────── */}
      {tab === "colonias" && (
        <div role="tabpanel">
          <div className={styles.seccionHeader}>
            <div className={styles.buscadorWrap}>
              <span className={styles.buscadorIcono}><SearchIcon /></span>
              <input
                type="text"
                className={styles.buscadorInput}
                placeholder="Buscar colonia, municipio o estado..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar colonia"
              />
            </div>
            <button type="button" className={styles.agregarBtn} onClick={() => abrirCrear("colonia")}>
              <PlusIcon /> Agregar colonia
            </button>
          </div>

          {colonias.length === 0 ? (
            <p className={styles.empty}>No hay colonias registradas.</p>
          ) : coloniasFilt.length === 0 ? (
            <p className={styles.empty}>Sin resultados para &ldquo;{busqueda}&rdquo;.</p>
          ) : (
            <div className={styles.tabla}>
              <div className={`${styles.filaColonia} ${styles.encabezado}`}>
                <span>Nombre</span>
                <span>Municipio</span>
                <span>Estado</span>
                <span>Estatus</span>
                <span />
              </div>
              {coloniasFilt.map((c) => (
                <div key={c.id} className={styles.filaColonia}>
                  <span className={styles.nombreCelda}>{c.nombre}</span>
                  <span>{c.municipioNombre}</span>
                  <span>{c.estadoNombre}</span>
                  <span><Badge activo={c.activo} /></span>
                  <AccionesCelda tipo="colonia" item={c} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {modalAbierto && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={modalTitulo}
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}
        >
          <div className={styles.modalPanel}>
            <h3 className={styles.modalTitle}>{modalTitulo}</h3>

            {/* Toggle: confirmación */}
            {esToggle && "item" in modal && (
              <>
                <p className={styles.modalSubtitle}>
                  {modal.item.activo
                    ? `Al desactivar "${modal.item.nombre}", dejará de aparecer en las opciones de registro de clientes.`
                    : `Al activar "${modal.item.nombre}", volverá a aparecer en las opciones de registro de clientes.`}
                </p>
                {error && <p className={styles.modalError}>{error}</p>}
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={cerrarModal}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className={modal.item.activo ? styles.dangerBtn : styles.saveBtn}
                    disabled={isPending}
                    onClick={handleToggle}
                  >
                    {isPending ? "Guardando..." : modal.item.activo ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </>
            )}

            {/* Crear / Editar */}
            {!esToggle && (
              <>
                <p className={styles.modalSubtitle}>
                  {modal?.accion === "crear"
                    ? `Registra un nuevo ${modalNombreTipo} en el catálogo.`
                    : `Modifica los datos del ${modalNombreTipo}.`}
                </p>

                {/* Si es municipio: selector de estado primero */}
                {modal?.tipo === "municipio" && (
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel} htmlFor="sel-estado">Estado</label>
                    <select
                      id="sel-estado"
                      className={styles.modalSelect}
                      value={estadoIdSel}
                      onChange={(e) => setEstadoIdSel(e.target.value)}
                    >
                      <option value="">Selecciona un estado</option>
                      {estados.map((e) => (
                        <option key={e.id} value={e.id}>{e.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Si es colonia: selector de estado + municipio */}
                {modal?.tipo === "colonia" && (
                  <>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel} htmlFor="sel-estado-col">Estado</label>
                      <select
                        id="sel-estado-col"
                        className={styles.modalSelect}
                        value={estadoIdSel}
                        onChange={(e) => {
                          setEstadoIdSel(e.target.value);
                          setMunicipioIdSel("");
                        }}
                      >
                        <option value="">Selecciona un estado</option>
                        {estados.map((e) => (
                          <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel} htmlFor="sel-municipio">Municipio</label>
                      <select
                        id="sel-municipio"
                        className={styles.modalSelect}
                        value={municipioIdSel}
                        onChange={(e) => setMunicipioIdSel(e.target.value)}
                        disabled={!estadoIdSel}
                      >
                        <option value="">
                          {estadoIdSel ? "Selecciona un municipio" : "Primero selecciona un estado"}
                        </option>
                        {municipiosFiltrados.map((m) => (
                          <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Nombre */}
                <div className={styles.modalField}>
                  <label className={styles.modalLabel} htmlFor="inp-nombre">Nombre</label>
                  <input
                    id="inp-nombre"
                    type="text"
                    className={styles.modalInput}
                    placeholder={`Nombre del ${modalNombreTipo}`}
                    value={nombre}
                    onChange={(e) => { setNombre(e.target.value); setError(""); }}
                    autoFocus
                  />
                </div>

                {error && <p className={styles.modalError}>{error}</p>}

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={cerrarModal}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className={styles.saveBtn}
                    disabled={isPending || !nombre.trim()}
                    onClick={handleSubmit}
                  >
                    {isPending ? "Guardando..." : modal?.accion === "crear" ? "Agregar" : "Guardar"}
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
