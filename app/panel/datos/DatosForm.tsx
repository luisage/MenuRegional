"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import styles from "./Datos.module.css";
import { actualizarRestaurante, actualizarSucursal, crearSucursal, crearAviso, editarAviso, eliminarAviso } from "@/app/lib/actions/datos";
import { obtenerColoniasPorMunicipio } from "@/app/lib/actions/ubicacion";
import SuscribeteModal from "../SuscribeteModal";

const MapaUbicacion = dynamic(() => import("./MapaUbicacion"), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Cargando mapa…</div>,
});

const MapaRangoEnvio = dynamic(() => import("./MapaRangoEnvio"), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Cargando mapa…</div>,
});

type Opcion = { id: string; nombre: string };

type SucursalData = {
  id: string;
  nombre: string;
  calle: string;
  numero: string;
  coloniaId: string;
  telefonoWhatsApp: string;
  envioDomicilio: boolean;
  costoEnvio: string;
  descripcionEnvio: string;
  rangoEnvio: string;
  latitud: string;
  longitud: string;
  descripcion: string;
  colonia: { id: string; nombre: string; municipioId: string };
};

type CategoriaTipoItem = {
  id: string;
  nombre: string;
  Tipo: string;
  icono: string | null;
};

type AvisoItem = {
  ids: string[];
  id: string;
  descripcion: string;
  fecha: string | null;
  imagenUrl: string | null;
  imagenPublicId: string | null;
  estatus: boolean;
};

type Props = {
  restaurante: { nombre: string; descripcion: string | null; logoUrl: string | null; portadaUrl: string | null };
  sucursales: SucursalData[];
  sucursalSeleccionadaId: string;
  municipios: Opcion[];
  coloniasIniciales: Opcion[];
  municipioActualId: string;
  todasCategoriasTipo: CategoriaTipoItem[];
  categoriasSeleccionadasIds: string[];
  avisosIniciales: AvisoItem[];
  puedeAgregarAvisos: boolean;
  puedeAgregarSucursal: boolean;
};

type Feedback = { tipo: "ok" | "error"; mensaje: string };

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="3" />
      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 14 8 14s8-8.75 8-14a8 8 0 0 0-8-8z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function DatosForm({
  restaurante,
  sucursales,
  sucursalSeleccionadaId,
  municipios,
  coloniasIniciales,
  municipioActualId,
  todasCategoriasTipo,
  categoriasSeleccionadasIds,
  avisosIniciales,
  puedeAgregarAvisos,
  puedeAgregarSucursal,
}: Props) {
  const router = useRouter();
  const [mensajeSuscribete, setMensajeSuscribete] = useState<string | null>(null);
  const sucursalActual = sucursales.find((s) => s.id === sucursalSeleccionadaId)!;
  const [sucursalActivaId, setSucursalActivaId] = useState(sucursalSeleccionadaId);

  // ---- Estado: Restaurante ----
  const [logoPreview, setLogoPreview] = useState<string | null>(restaurante.logoUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [portadaPreview, setPortadaPreview] = useState<string | null>(restaurante.portadaUrl);
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [portadaArrastrando, setPortadaArrastrando] = useState(false);
  const [restDescripcion, setRestDescripcion] = useState(restaurante.descripcion ?? "");
  const [restFeedback, setRestFeedback] = useState<Feedback | null>(null);
  const [restPending, startRestTransition] = useTransition();

  // ---- Estado: Tipos de comida ----
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>(categoriasSeleccionadasIds);

  const gruposTipoComida = todasCategoriasTipo.reduce<Record<string, CategoriaTipoItem[]>>(
    (acc, cat) => {
      if (!acc[cat.Tipo]) acc[cat.Tipo] = [];
      acc[cat.Tipo].push(cat);
      return acc;
    },
    {}
  );

  const [abiertosGrupos, setAbiertosGrupos] = useState<Record<string, boolean>>({});

  function toggleGrupo(tipo: string) {
    setAbiertosGrupos((prev) => ({ ...prev, [tipo]: !prev[tipo] }));
  }

  function toggleCategoria(id: string) {
    setSelectedCatIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
    setRestFeedback(null);
  }

  // ---- Estado: Sucursal ----
  const [sucNombre, setSucNombre] = useState(sucursalActual.nombre);
  const [sucTelefono, setSucTelefono] = useState(sucursalActual.telefonoWhatsApp);
  const [sucEnvio, setSucEnvio] = useState(sucursalActual.envioDomicilio);
  const [sucCostoEnvio, setSucCostoEnvio] = useState(sucursalActual.costoEnvio);
  const [sucDescEnvio, setSucDescEnvio] = useState(sucursalActual.descripcionEnvio);
  const [sucRangoEnvio, setSucRangoEnvio] = useState(sucursalActual.rangoEnvio);
  const [modalRangoAbierto, setModalRangoAbierto] = useState(false);
  const [sucCalle, setSucCalle] = useState(sucursalActual.calle);
  const [sucNumero, setSucNumero] = useState(sucursalActual.numero);
  const [sucMunicipioId, setSucMunicipioId] = useState(municipioActualId);
  const [sucColonias, setSucColonias] = useState<Opcion[]>(coloniasIniciales);
  const [sucColoniaId, setSucColoniaId] = useState(sucursalActual.coloniaId);
  const [sucLatStr, setSucLatStr] = useState(sucursalActual.latitud);
  const [sucLngStr, setSucLngStr] = useState(sucursalActual.longitud);
  const [mapaAbierto, setMapaAbierto] = useState(false);
  const [sucDescripcion, setSucDescripcion] = useState(sucursalActual.descripcion);
  const [loadingColonias, setLoadingColonias] = useState(false);
  const [sucFeedback, setSucFeedback] = useState<Feedback | null>(null);
  const [sucPending, startSucTransition] = useTransition();

  // ---- Estado: Lista de avisos ----
  const [avisos, setAvisos] = useState<AvisoItem[]>(avisosIniciales);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvisos(avisosIniciales);
  }, [avisosIniciales]);

  // ---- Estado: Editar aviso ----
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [avisoEditando, setAvisoEditando] = useState<AvisoItem | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editFecha, setEditFecha] = useState("");
  const [editEstatus, setEditEstatus] = useState(true);
  const [editImagenOriginalUrl, setEditImagenOriginalUrl] = useState<string | null>(null);
  const [editImagenFile, setEditImagenFile] = useState<File | null>(null);
  const [editImagenPreview, setEditImagenPreview] = useState<string | null>(null);
  const [editArrastrando, setEditArrastrando] = useState(false);
  const [editPending, startEditTransition] = useTransition();
  const [editFeedback, setEditFeedback] = useState<Feedback | null>(null);

  // ---- Estado: Eliminar aviso ----
  const [avisoAEliminar, setAvisoAEliminar] = useState<AvisoItem | null>(null);
  const [eliminarPending, startEliminarTransition] = useTransition();

  // ---- Estado: Aviso modal ----
  const [modalAvisoAbierto, setModalAvisoAbierto] = useState(false);
  const [avisoDescripcion, setAvisoDescripcion] = useState("");
  const [avisoFecha, setAvisoFecha] = useState("");
  const [avisoEstatus, setAvisoEstatus] = useState(true);
  const [avisoImagenFile, setAvisoImagenFile] = useState<File | null>(null);
  const [avisoImagenPreview, setAvisoImagenPreview] = useState<string | null>(null);
  const [avisoArrastrando, setAvisoArrastrando] = useState(false);
  const [avisoSucursalesIds, setAvisoSucursalesIds] = useState<string[]>(() => sucursales.map((s) => s.id));
  const [avisoPending, startAvisoTransition] = useTransition();
  const [avisoFeedback, setAvisoFeedback] = useState<Feedback | null>(null);

  // ---- Estado: Nueva sucursal ----
  const [modoNuevaSucursal, setModoNuevaSucursal] = useState(false);
  const [nuevaNombre, setNuevaNombre] = useState("");
  const [nuevaTelefono, setNuevaTelefono] = useState("");
  const [nuevaEnvio, setNuevaEnvio] = useState(false);
  const [nuevaCostoEnvio, setNuevaCostoEnvio] = useState("");
  const [nuevaDescEnvio, setNuevaDescEnvio] = useState("");
  const [nuevaRangoEnvio, setNuevaRangoEnvio] = useState("");
  const [nuevaCalle, setNuevaCalle] = useState("");
  const [nuevaNumero, setNuevaNumero] = useState("");
  const [nuevaMunicipioId, setNuevaMunicipioId] = useState(municipios[0]?.id ?? "");
  const [nuevaColonias, setNuevaColonias] = useState<Opcion[]>([]);
  const [nuevaColoniaId, setNuevaColoniaId] = useState("");
  const [nuevaLatStr, setNuevaLatStr] = useState("");
  const [nuevaLngStr, setNuevaLngStr] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevaMapaAbierto, setNuevaMapaAbierto] = useState(false);
  const [nuevaLoadingColonias, setNuevaLoadingColonias] = useState(false);
  const [nuevaFeedback, setNuevaFeedback] = useState<Feedback | null>(null);
  const [nuevaPending, startNuevaTransition] = useTransition();

  // Cargar colonias al abrir el formulario de nueva sucursal
  useEffect(() => {
    if (!modoNuevaSucursal || !nuevaMunicipioId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNuevaLoadingColonias(true);
    obtenerColoniasPorMunicipio(nuevaMunicipioId).then((colonias) => {
      setNuevaColonias(colonias);
      setNuevaColoniaId(colonias[0]?.id ?? "");
      setNuevaLoadingColonias(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoNuevaSucursal]);

  // Lat/lng como número para el mapa
  const latNum = sucLatStr !== "" ? parseFloat(sucLatStr) : NaN;
  const lngNum = sucLngStr !== "" ? parseFloat(sucLngStr) : NaN;
  const latitud = isNaN(latNum) ? null : latNum;
  const longitud = isNaN(lngNum) ? null : lngNum;

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setRestFeedback(null);
  }

  function seleccionarPortadaImagen(file: File) {
    if (!file.type.startsWith("image/")) return;
    setPortadaFile(file);
    setPortadaPreview(URL.createObjectURL(file));
    setRestFeedback(null);
  }

  async function handleSucursalChange(id: string) {
    const suc = sucursales.find((s) => s.id === id);
    if (!suc) return;
    setSucursalActivaId(id);
    setSucNombre(suc.nombre);
    setSucTelefono(suc.telefonoWhatsApp);
    setSucEnvio(suc.envioDomicilio);
    setSucCostoEnvio(suc.costoEnvio);
    setSucDescEnvio(suc.descripcionEnvio);
    setSucRangoEnvio(suc.rangoEnvio);
    setSucCalle(suc.calle);
    setSucNumero(suc.numero);
    setSucLatStr(suc.latitud);
    setSucLngStr(suc.longitud);
    setSucDescripcion(suc.descripcion);
    setSucFeedback(null);
    setMapaAbierto(false);
    setModalRangoAbierto(false);

    const newMunicipioId = suc.colonia.municipioId;
    setSucMunicipioId(newMunicipioId);
    setLoadingColonias(true);
    setSucColonias([]);
    setSucColoniaId("");
    const colonias = await obtenerColoniasPorMunicipio(newMunicipioId);
    setSucColonias(colonias);
    setSucColoniaId(suc.coloniaId);
    setLoadingColonias(false);
  }

  async function handleMunicipioChange(id: string) {
    setSucMunicipioId(id);
    setSucColonias([]);
    setSucColoniaId("");
    setSucFeedback(null);
    setLoadingColonias(true);
    const colonias = await obtenerColoniasPorMunicipio(id);
    setSucColonias(colonias);
    setSucColoniaId(colonias[0]?.id ?? "");
    setLoadingColonias(false);
  }

  function handleMapPick(lat: number, lng: number) {
    setSucLatStr(lat.toFixed(8));
    setSucLngStr(lng.toFixed(8));
    setSucFeedback(null);
  }

  function handleGuardarRestaurante() {
    const fd = new FormData();
    fd.append("descripcion", restDescripcion);
    if (logoFile) fd.append("logo", logoFile);
    if (portadaFile) fd.append("portada", portadaFile);
    selectedCatIds.forEach((id) => fd.append("categoriasIds", id));

    startRestTransition(async () => {
      const result = await actualizarRestaurante(fd);
      if ("ok" in result) {
        setRestFeedback({ tipo: "ok", mensaje: "Datos del restaurante actualizados correctamente." });
        setLogoFile(null);
        setPortadaFile(null);
      } else {
        setRestFeedback({ tipo: "error", mensaje: result.error });
      }
    });
  }

  function handleGuardarSucursal() {
    const fd = new FormData();
    fd.append("nombre", sucNombre);
    fd.append("telefonoWhatsApp", sucTelefono);
    fd.append("envioDomicilio", String(sucEnvio));
    fd.append("costoEnvio", sucCostoEnvio);
    fd.append("descripcionEnvio", sucDescEnvio);
    fd.append("rangoEnvio", sucRangoEnvio);
    fd.append("calle", sucCalle);
    fd.append("numero", sucNumero);
    fd.append("coloniaId", sucColoniaId);
    fd.append("latitud", sucLatStr);
    fd.append("longitud", sucLngStr);
    fd.append("descripcion", sucDescripcion);

    startSucTransition(async () => {
      const result = await actualizarSucursal(sucursalActivaId, fd);
      if ("ok" in result) {
        setSucFeedback({ tipo: "ok", mensaje: `Datos de la sucursal "${sucNombre}" actualizados correctamente.` });
      } else {
        setSucFeedback({ tipo: "error", mensaje: result.error });
      }
    });
  }

  async function handleNuevaMunicipioChange(id: string) {
    setNuevaMunicipioId(id);
    setNuevaColonias([]);
    setNuevaColoniaId("");
    setNuevaFeedback(null);
    setNuevaLoadingColonias(true);
    const colonias = await obtenerColoniasPorMunicipio(id);
    setNuevaColonias(colonias);
    setNuevaColoniaId(colonias[0]?.id ?? "");
    setNuevaLoadingColonias(false);
  }

  function cancelarNuevaSucursal() {
    setModoNuevaSucursal(false);
    setNuevaNombre(""); setNuevaTelefono(""); setNuevaEnvio(false);
    setNuevaCostoEnvio(""); setNuevaDescEnvio(""); setNuevaRangoEnvio(""); setNuevaCalle("");
    setNuevaNumero(""); setNuevaMunicipioId(municipios[0]?.id ?? "");
    setNuevaColonias([]); setNuevaColoniaId(""); setNuevaLatStr("");
    setNuevaLngStr(""); setNuevaDescripcion(""); setNuevaMapaAbierto(false);
    setNuevaFeedback(null);
  }

  function handleCrearSucursal() {
    const fd = new FormData();
    fd.append("nombre", nuevaNombre);
    fd.append("telefonoWhatsApp", nuevaTelefono);
    fd.append("envioDomicilio", String(nuevaEnvio));
    fd.append("costoEnvio", nuevaCostoEnvio);
    fd.append("descripcionEnvio", nuevaDescEnvio);
    fd.append("rangoEnvio", nuevaRangoEnvio);
    fd.append("calle", nuevaCalle);
    fd.append("numero", nuevaNumero);
    fd.append("coloniaId", nuevaColoniaId);
    fd.append("latitud", nuevaLatStr);
    fd.append("longitud", nuevaLngStr);
    fd.append("descripcion", nuevaDescripcion);

    startNuevaTransition(async () => {
      const result = await crearSucursal(fd);
      if ("ok" in result) {
        router.push(`/panel/datos?sucursalId=${result.id}`);
      } else {
        setNuevaFeedback({ tipo: "error", mensaje: result.error });
      }
    });
  }

  function seleccionarAvisoImagen(file: File) {
    setAvisoImagenFile(file);
    setAvisoImagenPreview(URL.createObjectURL(file));
    setAvisoFeedback(null);
  }

  function quitarAvisoImagen() {
    setAvisoImagenFile(null);
    setAvisoImagenPreview(null);
  }

  function handleGuardarAviso() {
    const desc = avisoDescripcion.trim();
    if (!desc) {
      setAvisoFeedback({ tipo: "error", mensaje: "La descripción es requerida." });
      return;
    }
    if (avisoSucursalesIds.length === 0) {
      setAvisoFeedback({ tipo: "error", mensaje: "Selecciona al menos una sucursal." });
      return;
    }
    const fd = new FormData();
    fd.append("descripcion", desc);
    fd.append("estatus", String(avisoEstatus));
    fd.append("fecha", avisoFecha);
    avisoSucursalesIds.forEach((id) => fd.append("sucursalIds", id));
    if (avisoImagenFile) fd.append("imagen", avisoImagenFile);

    startAvisoTransition(async () => {
      const result = await crearAviso(fd);
      if ("ok" in result) {
        setModalAvisoAbierto(false);
        setAvisoDescripcion("");
        setAvisoFecha("");
        setAvisoEstatus(true);
        setAvisoImagenFile(null);
        setAvisoImagenPreview(null);
        setAvisoSucursalesIds(sucursales.map((s) => s.id));
        setAvisoFeedback(null);
        router.refresh();
      } else {
        setAvisoFeedback({ tipo: "error", mensaje: result.error });
      }
    });
  }

  function abrirEditarAviso(aviso: AvisoItem) {
    setAvisoEditando(aviso);
    setEditDesc(aviso.descripcion);
    setEditFecha(aviso.fecha ?? "");
    setEditEstatus(aviso.estatus);
    setEditImagenOriginalUrl(aviso.imagenUrl);
    setEditImagenFile(null);
    setEditImagenPreview(aviso.imagenUrl);
    setEditArrastrando(false);
    setEditFeedback(null);
    setModalEditarAbierto(true);
  }

  function cerrarEditarAviso() {
    setModalEditarAbierto(false);
    setAvisoEditando(null);
    setEditImagenFile(null);
    setEditImagenPreview(null);
    setEditFeedback(null);
  }

  function seleccionarEditImagen(file: File) {
    setEditImagenFile(file);
    setEditImagenPreview(URL.createObjectURL(file));
    setEditFeedback(null);
  }

  function quitarEditImagen() {
    if (editImagenFile) {
      setEditImagenFile(null);
      setEditImagenPreview(editImagenOriginalUrl);
    } else {
      setEditImagenPreview(null);
    }
    setEditFeedback(null);
  }

  function handleGuardarEdicion() {
    const desc = editDesc.trim();
    if (!desc || !avisoEditando) {
      setEditFeedback({ tipo: "error", mensaje: "La descripción es requerida." });
      return;
    }
    const fd = new FormData();
    fd.append("descripcion", desc);
    fd.append("estatus", String(editEstatus));
    fd.append("fecha", editFecha);
    if (editImagenFile) {
      fd.append("imagen", editImagenFile);
    } else if (editImagenPreview === null && editImagenOriginalUrl !== null) {
      fd.append("quitarImagen", "true");
    }

    startEditTransition(async () => {
      const result = await editarAviso(avisoEditando.ids, fd);
      if ("ok" in result) {
        cerrarEditarAviso();
        router.refresh();
      } else {
        setEditFeedback({ tipo: "error", mensaje: result.error });
      }
    });
  }

  function handleEliminarAviso() {
    if (!avisoAEliminar) return;
    startEliminarTransition(async () => {
      await eliminarAviso(avisoAEliminar.ids);
      setAvisoAEliminar(null);
      router.refresh();
    });
  }

  return (
    <div className={styles.wrapper}>
      {/* ===== CARD RESTAURANTE ===== */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Datos del restaurante</h2>

        <div className={styles.field}>
          <span className={styles.label}>Logo</span>
          <div className={styles.imageUpload}>
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Logo del restaurante" className={styles.logoPreview} />
            ) : (
              <span className={styles.imagePlaceholder}><UploadIcon /></span>
            )}
            <span className={styles.imageUploadText}>
              {logoPreview ? "Cambiar imagen" : "Subir logo"}
            </span>
            <input type="file" accept="image/*" className={styles.fileInput} onChange={handleLogoChange} />
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Imagen de portada</span>
          <p className={styles.hint}>Se muestra como banner en la página de tu restaurante.</p>
          <label
            className={`${styles.portadaDropZone} ${portadaArrastrando ? styles.portadaDropZoneActiva : ""}`}
            onDragOver={(e) => { e.preventDefault(); setPortadaArrastrando(true); }}
            onDragLeave={() => setPortadaArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setPortadaArrastrando(false);
              const file = e.dataTransfer.files[0];
              if (file) seleccionarPortadaImagen(file);
            }}
          >
            {portadaPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={portadaPreview} alt="Portada del restaurante" className={styles.portadaPreview} />
            ) : (
              <>
                <span className={styles.imagePlaceholder}><UploadIcon /></span>
                <span className={styles.avisoDropZoneTexto}>
                  {portadaArrastrando ? "Suelta aquí" : "Arrastra una imagen o toca para elegir"}
                </span>
                <span className={styles.avisoDropZoneHint}>JPG, PNG o WebP · máx. 5 MB</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className={styles.avisoFileInput}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) seleccionarPortadaImagen(file);
                e.target.value = "";
              }}
            />
          </label>
          {portadaPreview && (
            <p className={styles.hint}>Arrastra o toca la imagen para cambiarla.</p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Descripción</label>
          <textarea
            className={styles.textarea}
            rows={3}
            value={restDescripcion}
            onChange={(e) => { setRestDescripcion(e.target.value); setRestFeedback(null); }}
            placeholder="Tipo de comida, especialidades, ambiente..."
          />
        </div>

        {/* ── Tipo de comida ── */}
        {todasCategoriasTipo.length > 0 && (
          <div className={styles.field}>
            <span className={styles.label}>Tipo de comida</span>
            <p className={styles.hint}>Elige las categorías que describen tu restaurante.</p>

            <div className={styles.tipoComidaScroll}>
              {Object.entries(gruposTipoComida).map(([tipo, cats]) => {
                const abierto = abiertosGrupos[tipo] ?? false;
                const numSeleccionados = cats.filter((c) => selectedCatIds.includes(c.id)).length;
                return (
                  <div key={tipo} className={styles.tipoGrupo}>
                    <button
                      type="button"
                      className={styles.tipoGrupoHeader}
                      onClick={() => toggleGrupo(tipo)}
                      aria-expanded={abierto}
                    >
                      <span className={styles.tipoGrupoLabelWrap}>
                        <span className={styles.tipoGrupoLabel}>{tipo}</span>
                        {numSeleccionados > 0 && (
                          <span className={styles.tipoGrupoBadge}>{numSeleccionados}</span>
                        )}
                      </span>
                      <ChevronIcon open={abierto} />
                    </button>

                    {abierto && (
                      <div className={styles.tipoChips}>
                        {cats.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategoria(cat.id)}
                            className={`${styles.tipoChip} ${selectedCatIds.includes(cat.id) ? styles.tipoChipActivo : ""}`}
                            aria-pressed={selectedCatIds.includes(cat.id)}
                          >
                            {cat.icono && <span aria-hidden="true">{cat.icono}</span>}
                            {cat.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedCatIds.length > 0 && (
              <div className={styles.tipoSeleccionados}>
                {selectedCatIds.map((id) => {
                  const cat = todasCategoriasTipo.find((c) => c.id === id);
                  if (!cat) return null;
                  return (
                    <span key={id} className={styles.tipoChipSeleccionado}>
                      {cat.icono && <span aria-hidden="true">{cat.icono}</span>}
                      {cat.nombre}
                      <button
                        type="button"
                        className={styles.tipoChipRemove}
                        onClick={() => toggleCategoria(id)}
                        aria-label={`Quitar ${cat.nombre}`}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className={styles.avisoLink}
          onClick={() => {
            if (!puedeAgregarAvisos) {
              setMensajeSuscribete("Suscríbete para poder agregar tus promociones, eventos, avisos y más.");
              return;
            }
            setModalAvisoAbierto(true);
            setAvisoFeedback(null);
          }}
        >
          + Agrega un aviso, promoción, evento, etc.
        </button>

        {avisos.length > 0 && (
          <div className={styles.avisosGrid}>
            {avisos.map((aviso) => (
              <div key={aviso.id} className={styles.avisoCard}>
                {aviso.imagenUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={aviso.imagenUrl} alt="" className={styles.avisoCardThumb} />
                ) : (
                  <div className={styles.avisoCardNoImg}>
                    <BellIcon />
                  </div>
                )}
                <div className={styles.avisoCardBody}>
                  <p className={styles.avisoCardDesc}>{aviso.descripcion}</p>
                  {aviso.fecha && (
                    <p className={styles.avisoCardFecha}>{aviso.fecha}</p>
                  )}
                </div>
                <div className={styles.avisoCardActions}>
                  <button
                    type="button"
                    className={styles.avisoCardActionBtn}
                    onClick={() => abrirEditarAviso(aviso)}
                    aria-label="Editar aviso"
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className={`${styles.avisoCardActionBtn} ${styles.avisoCardActionBtnDanger}`}
                    onClick={() => setAvisoAEliminar(aviso)}
                    aria-label="Eliminar aviso"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {restFeedback && (
          <p className={restFeedback.tipo === "ok" ? styles.feedbackOk : styles.feedbackError}>
            {restFeedback.mensaje}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.saveBtn} disabled={restPending} onClick={handleGuardarRestaurante}>
            {restPending ? "Actualizando..." : "Actualizar restaurante"}
          </button>
        </div>
      </section>

      {/* ===== CARD SUCURSAL ===== */}
      <section className={styles.card}>
        <div className={styles.sucCardTitleRow}>
          <h2 className={styles.cardTitle}>Datos de la sucursal</h2>
          {!modoNuevaSucursal && (
            <button
              type="button"
              className={styles.addSucBtn}
              onClick={() => {
                if (!puedeAgregarSucursal) {
                  setMensajeSuscribete("Suscríbete para poder agregar todas tus sucursales.");
                  return;
                }
                setModoNuevaSucursal(true);
              }}
            >
              + Sucursal
            </button>
          )}
        </div>

        {modoNuevaSucursal ? (
          /* ── FORMULARIO NUEVA SUCURSAL ── */
          <>
            <p className={styles.seccionTitulo}>Datos de la sucursal</p>

            <div className={styles.field}>
              <label className={styles.label}>Nombre de la sucursal</label>
              <input type="text" className={styles.input} value={nuevaNombre}
                placeholder="Ej: Sucursal Centro"
                onChange={(e) => { setNuevaNombre(e.target.value); setNuevaFeedback(null); }} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Número de WhatsApp</label>
              <input type="tel" className={styles.input} value={nuevaTelefono} placeholder="10 dígitos"
                onChange={(e) => { setNuevaTelefono(e.target.value); setNuevaFeedback(null); }} />
              <p className={styles.hint}><strong>Nota: Importante</strong> — a este número llegará el pedido del cliente.</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Descripción</label>
              <textarea className={styles.textarea} rows={3} value={nuevaDescripcion}
                placeholder="Información adicional sobre esta sucursal..."
                onChange={(e) => { setNuevaDescripcion(e.target.value); setNuevaFeedback(null); }} />
            </div>

            <p className={styles.seccionTitulo}>Dirección</p>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Calle</label>
                <input type="text" className={styles.input} value={nuevaCalle}
                  onChange={(e) => { setNuevaCalle(e.target.value); setNuevaFeedback(null); }} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Número</label>
                <input type="text" className={styles.input} value={nuevaNumero}
                  onChange={(e) => { setNuevaNumero(e.target.value); setNuevaFeedback(null); }} />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Municipio</label>
              <select className={styles.select} value={nuevaMunicipioId}
                onChange={(e) => handleNuevaMunicipioChange(e.target.value)}>
                {municipios.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Colonia</label>
              <select className={styles.select} value={nuevaColoniaId}
                disabled={nuevaLoadingColonias || nuevaColonias.length === 0}
                onChange={(e) => { setNuevaColoniaId(e.target.value); setNuevaFeedback(null); }}>
                {nuevaLoadingColonias
                  ? <option value="">Cargando colonias...</option>
                  : nuevaColonias.length === 0
                    ? <option value="">Selecciona un municipio</option>
                    : nuevaColonias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)
                }
              </select>
            </div>

            <div className={styles.coordRow}>
              <div className={styles.field}>
                <label className={styles.label}>Latitud</label>
                <input type="text" className={`${styles.input} ${styles.inputReadonly}`}
                  value={nuevaLatStr} readOnly placeholder="Se obtiene del mapa" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Longitud</label>
                <input type="text" className={`${styles.input} ${styles.inputReadonly}`}
                  value={nuevaLngStr} readOnly placeholder="Se obtiene del mapa" />
              </div>
            </div>

            <button type="button" className={styles.mapToggle}
              onClick={() => setNuevaMapaAbierto((v) => !v)}>
              <MapIcon />
              Colocar ubicación del restaurante
              <ChevronIcon open={nuevaMapaAbierto} />
            </button>

            {nuevaMapaAbierto && (
              <div className={styles.mapContainer}>
                <MapaUbicacion
                  latitud={!isNaN(parseFloat(nuevaLatStr)) ? parseFloat(nuevaLatStr) : null}
                  longitud={!isNaN(parseFloat(nuevaLngStr)) ? parseFloat(nuevaLngStr) : null}
                  onChange={(lat, lng) => { setNuevaLatStr(lat.toFixed(8)); setNuevaLngStr(lng.toFixed(8)); setNuevaFeedback(null); }}
                />
              </div>
            )}

            <p className={styles.seccionTitulo}>Envío a domicilio</p>

            <div className={styles.field}>
              <span className={styles.label}>Envío a domicilio</span>
              <label className={styles.toggleRow}>
                <span className={styles.toggleWrap}>
                  <input type="checkbox" className={styles.toggleInput} checked={nuevaEnvio}
                    onChange={(e) => { setNuevaEnvio(e.target.checked); setNuevaFeedback(null); }} />
                  <span className={styles.toggleSlider} />
                </span>
                <span className={styles.toggleLabel}>{nuevaEnvio ? "Disponible" : "No disponible"}</span>
              </label>
            </div>

            {nuevaEnvio && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Costo de envío</label>
                  <div className={styles.costoWrap}>
                    <span className={styles.costoPrefix}>$</span>
                    <input type="number" min="0" step="0.50" placeholder="0.00"
                      className={`${styles.input} ${styles.costoInput}`}
                      value={nuevaCostoEnvio}
                      onChange={(e) => { setNuevaCostoEnvio(e.target.value); setNuevaFeedback(null); }} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Descripción de envío</label>
                  <input type="text" className={styles.input} value={nuevaDescEnvio}
                    placeholder="Ej: Colonias de Atitalaquia, costo adicional fuera del perímetro..."
                    onChange={(e) => { setNuevaDescEnvio(e.target.value); setNuevaFeedback(null); }} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Rango de envío</label>
                  <div className={styles.rangoWrap}>
                    <input
                      type="number"
                      min="0.1"
                      max="99.9"
                      step="0.1"
                      className={`${styles.input} ${styles.rangoInput}`}
                      value={nuevaRangoEnvio}
                      placeholder="Ejemplo: 2.5"
                      onChange={(e) => { setNuevaRangoEnvio(e.target.value); setNuevaFeedback(null); }}
                    />
                    <span className={styles.rangoSuffix}>Km</span>
                  </div>
                  <p className={styles.hint}>Ingresa el número de kilómetros.</p>
                </div>
              </>
            )}

            {nuevaFeedback && (
              <p className={nuevaFeedback.tipo === "ok" ? styles.feedbackOk : styles.feedbackError}>
                {nuevaFeedback.mensaje}
              </p>
            )}

            <div className={styles.actionsRow}>
              <button type="button" className={styles.cancelBtn} onClick={cancelarNuevaSucursal}>
                Cancelar
              </button>
              <button type="button" className={styles.saveBtn} disabled={nuevaPending} onClick={handleCrearSucursal}>
                {nuevaPending ? "Registrando..." : "Registrar sucursal"}
              </button>
            </div>
          </>
        ) : (
          /* ── FORMULARIO SUCURSAL EXISTENTE ── */
          <>
        {sucursales.length > 1 && (
          <div className={styles.field}>
            <label className={styles.label}>Sucursal</label>
            <select
              className={styles.select}
              value={sucursalActivaId}
              onChange={(e) => handleSucursalChange(e.target.value)}
            >
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre} — {s.calle} {s.numero}</option>
              ))}
            </select>
          </div>
        )}

        <p className={styles.seccionTitulo}>Datos de la sucursal</p>

        <div className={styles.field}>
          <label className={styles.label}>Nombre de la sucursal</label>
          <input type="text" className={styles.input} value={sucNombre}
            onChange={(e) => { setSucNombre(e.target.value); setSucFeedback(null); }} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Número de WhatsApp</label>
          <input type="tel" className={styles.input} value={sucTelefono} placeholder="10 dígitos"
            onChange={(e) => { setSucTelefono(e.target.value); setSucFeedback(null); }} />
          <p className={styles.hint}><strong>Nota: Importante</strong> — a este número llegará el pedido del cliente.</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Descripción</label>
          <textarea className={styles.textarea} rows={3} value={sucDescripcion}
            placeholder="Información adicional sobre esta sucursal..."
            onChange={(e) => { setSucDescripcion(e.target.value); setSucFeedback(null); }} />
        </div>

        <p className={styles.seccionTitulo}>Dirección</p>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>Calle</label>
            <input type="text" className={styles.input} value={sucCalle}
              onChange={(e) => { setSucCalle(e.target.value); setSucFeedback(null); }} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Número</label>
            <input type="text" className={styles.input} value={sucNumero}
              onChange={(e) => { setSucNumero(e.target.value); setSucFeedback(null); }} />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Municipio</label>
          <select className={styles.select} value={sucMunicipioId} onChange={(e) => handleMunicipioChange(e.target.value)}>
            {municipios.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Colonia</label>
          <select className={styles.select} value={sucColoniaId}
            disabled={loadingColonias || sucColonias.length === 0}
            onChange={(e) => { setSucColoniaId(e.target.value); setSucFeedback(null); }}>
            {loadingColonias
              ? <option value="">Cargando colonias...</option>
              : sucColonias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)
            }
          </select>
        </div>

        {/* Coordenadas + mapa */}
        <div className={styles.coordRow}>
          <div className={styles.field}>
            <label className={styles.label}>Latitud</label>
            <input type="text" className={`${styles.input} ${styles.inputReadonly}`}
              value={sucLatStr} readOnly placeholder="Se obtiene del mapa" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Longitud</label>
            <input type="text" className={`${styles.input} ${styles.inputReadonly}`}
              value={sucLngStr} readOnly placeholder="Se obtiene del mapa" />
          </div>
        </div>

        <button
          type="button"
          className={styles.mapToggle}
          onClick={() => setMapaAbierto((v) => !v)}
        >
          <MapIcon />
          Colocar ubicación del restaurante
          <ChevronIcon open={mapaAbierto} />
        </button>

        {mapaAbierto && (
          <div className={styles.mapContainer}>
            <MapaUbicacion
              latitud={latitud}
              longitud={longitud}
              onChange={handleMapPick}
            />
          </div>
        )}

        <p className={styles.seccionTitulo}>Envío a domicilio</p>

        <div className={styles.field}>
          <span className={styles.label}>Envío a domicilio</span>
          <label className={styles.toggleRow}>
            <span className={styles.toggleWrap}>
              <input type="checkbox" className={styles.toggleInput} checked={sucEnvio}
                onChange={(e) => { setSucEnvio(e.target.checked); setSucFeedback(null); }} />
              <span className={styles.toggleSlider} />
            </span>
            <span className={styles.toggleLabel}>{sucEnvio ? "Disponible" : "No disponible"}</span>
          </label>
        </div>

        {sucEnvio && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Costo de envío</label>
              <div className={styles.costoWrap}>
                <span className={styles.costoPrefix}>$</span>
                <input type="number" min="0" step="0.50" placeholder="0.00"
                  className={`${styles.input} ${styles.costoInput}`}
                  value={sucCostoEnvio}
                  onChange={(e) => { setSucCostoEnvio(e.target.value); setSucFeedback(null); }} />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Descripción de envío</label>
              <input type="text" className={styles.input} value={sucDescEnvio}
                placeholder="Ej: Colonias de Atitalaquia, costo adicional fuera del perímetro..."
                onChange={(e) => { setSucDescEnvio(e.target.value); setSucFeedback(null); }} />
            </div>
            <div className={styles.field}>
              <div className={styles.rangoLabelRow}>
                <label className={styles.label} htmlFor="suc-rango">Rango de envío</label>
                <button
                  type="button"
                  className={styles.verRangoBtn}
                  onClick={() => setModalRangoAbierto(true)}
                >
                  Ver rango
                </button>
              </div>
              <div className={styles.rangoWrap}>
                <input
                  id="suc-rango"
                  type="number"
                  min="0.1"
                  max="99.9"
                  step="0.1"
                  className={`${styles.input} ${styles.rangoInput}`}
                  value={sucRangoEnvio}
                  placeholder="Ejemplo: 2.5"
                  onChange={(e) => { setSucRangoEnvio(e.target.value); setSucFeedback(null); }}
                />
                <span className={styles.rangoSuffix}>Km</span>
              </div>
              <p className={styles.hint}>Ingresa el número de kilómetros.</p>
            </div>
          </>
        )}

        {sucFeedback && (
          <p className={sucFeedback.tipo === "ok" ? styles.feedbackOk : styles.feedbackError}>
            {sucFeedback.mensaje}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.saveBtn} disabled={sucPending} onClick={handleGuardarSucursal}>
            {sucPending ? "Actualizando..." : "Actualizar sucursal"}
          </button>
        </div>
          </>
        )}
      </section>

      {/* ===== MODAL VER RANGO ===== */}
      {modalRangoAbierto && (
        <div
          className={styles.avisoOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Ver rango de envío"
          onClick={(e) => { if (e.target === e.currentTarget) setModalRangoAbierto(false); }}
        >
          <div className={styles.avisoPanel}>
            <div className={styles.avisoHeader}>
              <h3 className={styles.avisoTitle}>Rango de envío</h3>
              <button
                type="button"
                className={styles.avisoCloseBtn}
                onClick={() => setModalRangoAbierto(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className={styles.avisoBody}>
              {latitud !== null && longitud !== null && sucRangoEnvio !== "" && parseFloat(sucRangoEnvio) > 0 ? (
                <MapaRangoEnvio
                  latitud={latitud}
                  longitud={longitud}
                  rangoKm={parseFloat(sucRangoEnvio)}
                />
              ) : (
                <p className={styles.rangoSinDatos}>
                  Para ver el rango de envío, ingresa la ubicación de la sucursal y el rango de envío en kilómetros.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL AVISO ===== */}
      {modalAvisoAbierto && (
        <div
          className={styles.avisoOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Crear aviso"
          onClick={(e) => { if (e.target === e.currentTarget) { setModalAvisoAbierto(false); setAvisoFeedback(null); } }}
        >
          <div className={styles.avisoPanel}>
            <div className={styles.avisoHeader}>
              <h3 className={styles.avisoTitle}>Nuevo aviso / promoción</h3>
              <button
                type="button"
                className={styles.avisoCloseBtn}
                onClick={() => { setModalAvisoAbierto(false); setAvisoFeedback(null); }}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className={styles.avisoBody}>
              <div className={styles.field}>
                <label className={styles.label}>Descripción</label>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={avisoDescripcion}
                  placeholder="Ej: 20% de descuento en pizzas todos los martes..."
                  onChange={(e) => { setAvisoDescripcion(e.target.value); setAvisoFeedback(null); }}
                />
              </div>

              {/* Imagen */}
              <div className={styles.field}>
                <span className={styles.label}>Imagen (opcional)</span>
                {avisoImagenPreview ? (
                  <div className={styles.avisoImagenPreviewWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avisoImagenPreview} alt="Vista previa" className={styles.avisoImagenPreview} />
                    <button
                      type="button"
                      className={styles.avisoImagenQuitarBtn}
                      onClick={quitarAvisoImagen}
                      aria-label="Quitar imagen"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label
                    className={`${styles.avisoDropZone} ${avisoArrastrando ? styles.avisoDropZoneActiva : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setAvisoArrastrando(true); }}
                    onDragLeave={() => setAvisoArrastrando(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setAvisoArrastrando(false);
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith("image/")) seleccionarAvisoImagen(file);
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span className={styles.avisoDropZoneTexto}>
                      {avisoArrastrando ? "Suelta aquí" : "Arrastra una imagen o toca para elegir"}
                    </span>
                    <span className={styles.avisoDropZoneHint}>JPG, PNG o WebP · máx. 5 MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className={styles.avisoFileInput}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) seleccionarAvisoImagen(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Fecha (opcional)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={avisoFecha}
                  placeholder="Ej: A partir del día 25 de Julio, hasta agotar existencias"
                  onChange={(e) => { setAvisoFecha(e.target.value); setAvisoFeedback(null); }}
                />
              </div>

              <div className={styles.field}>
                <span className={styles.label}>Estatus</span>
                <label className={styles.toggleRow}>
                  <span className={styles.toggleWrap}>
                    <input
                      type="checkbox"
                      className={styles.toggleInput}
                      checked={avisoEstatus}
                      onChange={(e) => setAvisoEstatus(e.target.checked)}
                    />
                    <span className={styles.toggleSlider} />
                  </span>
                  <span className={styles.toggleLabel}>{avisoEstatus ? "Activo" : "Inactivo"}</span>
                </label>
              </div>

              {sucursales.length > 1 && (
                <div className={styles.field}>
                  <span className={styles.label}>Sucursales</span>
                  <div className={styles.avisoSucursales}>
                    {sucursales.map((suc) => (
                      <label key={suc.id} className={styles.avisoSucursalRow}>
                        <input
                          type="checkbox"
                          className={styles.avisoCheckbox}
                          checked={avisoSucursalesIds.includes(suc.id)}
                          onChange={(e) => {
                            setAvisoSucursalesIds((prev) =>
                              e.target.checked ? [...prev, suc.id] : prev.filter((id) => id !== suc.id)
                            );
                            setAvisoFeedback(null);
                          }}
                        />
                        <span className={styles.avisoSucursalNombre}>{suc.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {avisoFeedback && (
                <p className={avisoFeedback.tipo === "ok" ? styles.feedbackOk : styles.feedbackError}>
                  {avisoFeedback.mensaje}
                </p>
              )}
            </div>

            <div className={styles.avisoFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => { setModalAvisoAbierto(false); setAvisoFeedback(null); }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.saveBtn}
                disabled={avisoPending}
                onClick={handleGuardarAviso}
              >
                {avisoPending ? "Guardando..." : "Guardar aviso"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL EDITAR AVISO ===== */}
      {modalEditarAbierto && avisoEditando && (
        <div
          className={styles.avisoOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Editar aviso"
          onClick={(e) => { if (e.target === e.currentTarget) cerrarEditarAviso(); }}
        >
          <div className={styles.avisoPanel}>
            <div className={styles.avisoHeader}>
              <h3 className={styles.avisoTitle}>Editar aviso</h3>
              <button type="button" className={styles.avisoCloseBtn} onClick={cerrarEditarAviso} aria-label="Cerrar">×</button>
            </div>

            <div className={styles.avisoBody}>
              <div className={styles.field}>
                <label className={styles.label}>Descripción</label>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={editDesc}
                  placeholder="Ej: 20% de descuento en pizzas todos los martes..."
                  onChange={(e) => { setEditDesc(e.target.value); setEditFeedback(null); }}
                />
              </div>

              <div className={styles.field}>
                <span className={styles.label}>Imagen (opcional)</span>
                {editImagenPreview ? (
                  <div className={styles.avisoImagenPreviewWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editImagenPreview} alt="Vista previa" className={styles.avisoImagenPreview} />
                    <button type="button" className={styles.avisoImagenQuitarBtn} onClick={quitarEditImagen} aria-label="Quitar imagen">×</button>
                  </div>
                ) : (
                  <label
                    className={`${styles.avisoDropZone} ${editArrastrando ? styles.avisoDropZoneActiva : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setEditArrastrando(true); }}
                    onDragLeave={() => setEditArrastrando(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setEditArrastrando(false);
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith("image/")) seleccionarEditImagen(file);
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span className={styles.avisoDropZoneTexto}>
                      {editArrastrando ? "Suelta aquí" : "Arrastra una imagen o toca para elegir"}
                    </span>
                    <span className={styles.avisoDropZoneHint}>JPG, PNG o WebP · máx. 5 MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className={styles.avisoFileInput}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) seleccionarEditImagen(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Fecha (opcional)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editFecha}
                  placeholder="Ej: A partir del día 25 de Julio, hasta agotar existencias"
                  onChange={(e) => { setEditFecha(e.target.value); setEditFeedback(null); }}
                />
              </div>

              <div className={styles.field}>
                <span className={styles.label}>Estatus</span>
                <label className={styles.toggleRow}>
                  <span className={styles.toggleWrap}>
                    <input
                      type="checkbox"
                      className={styles.toggleInput}
                      checked={editEstatus}
                      onChange={(e) => setEditEstatus(e.target.checked)}
                    />
                    <span className={styles.toggleSlider} />
                  </span>
                  <span className={styles.toggleLabel}>{editEstatus ? "Activo" : "Inactivo"}</span>
                </label>
              </div>

              {editFeedback && (
                <p className={editFeedback.tipo === "ok" ? styles.feedbackOk : styles.feedbackError}>
                  {editFeedback.mensaje}
                </p>
              )}
            </div>

            <div className={styles.avisoFooter}>
              <button type="button" className={styles.cancelBtn} onClick={cerrarEditarAviso}>Cancelar</button>
              <button type="button" className={styles.saveBtn} disabled={editPending} onClick={handleGuardarEdicion}>
                {editPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL CONFIRMAR ELIMINAR ===== */}
      {avisoAEliminar && (
        <div
          className={styles.deleteModal}
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación"
          onClick={(e) => { if (e.target === e.currentTarget && !eliminarPending) setAvisoAEliminar(null); }}
        >
          <div className={styles.deletePanel}>
            <p className={styles.deleteTitle}>¿Eliminar este aviso?</p>
            <p className={styles.deleteDesc}>Se eliminará el aviso y su imagen de forma permanente. Esta acción no se puede deshacer.</p>
            <div className={styles.deleteActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                disabled={eliminarPending}
                onClick={() => setAvisoAEliminar(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.deleteBtn}
                disabled={eliminarPending}
                onClick={handleEliminarAviso}
              >
                {eliminarPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mensajeSuscribete && (
        <SuscribeteModal mensaje={mensajeSuscribete} onClose={() => setMensajeSuscribete(null)} />
      )}
    </div>
  );
}
