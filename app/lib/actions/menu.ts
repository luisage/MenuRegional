"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { obtenerSesionRestauranteId } from "@/app/lib/session";
import { subirImagen, eliminarImagen } from "@/app/lib/cloudinary";
import { puedeAgregarPlatillo } from "@/app/lib/planes";

const MENSAJE_SIN_PLAN_PLATILLOS =
  "Con el plan Gratis solo puedes agregar 10 platillos. Suscríbete a un plan superior para agregar tu menú completo.";

const RUTA = "/panel/platillos/nuevo";

async function obtenerRestauranteId(): Promise<string | null> {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) return null;
  const r = await prisma.restaurante.findUnique({ where: { cuentaId }, select: { id: true } });
  return r?.id ?? null;
}

// ─── Categorías ────────────────────────────────────────────────────────────

export async function crearCategoria(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const restauranteId = await obtenerRestauranteId();
  if (!restauranteId) return { error: "Sesión no válida." };

  const nombre = String(formData.get("nombre") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const orden = parseInt(String(formData.get("orden") || "0"), 10);

  if (!nombre) return { error: "El nombre de la categoría es requerido." };
  if (isNaN(orden)) return { error: "El orden debe ser un número." };

  await prisma.categoriaComida.create({ data: { nombre, descripcion, orden, restauranteId } });
  revalidatePath(RUTA);
  return { ok: true };
}

export async function editarCategoria(
  categoriaId: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const restauranteId = await obtenerRestauranteId();
  if (!restauranteId) return { error: "Sesión no válida." };

  const cat = await prisma.categoriaComida.findFirst({ where: { id: categoriaId, restauranteId } });
  if (!cat) return { error: "Categoría no encontrada." };

  const nombre = String(formData.get("nombre") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const orden = parseInt(String(formData.get("orden") || "0"), 10);

  if (!nombre) return { error: "El nombre de la categoría es requerido." };
  if (isNaN(orden)) return { error: "El orden debe ser un número." };

  await prisma.categoriaComida.update({ where: { id: categoriaId }, data: { nombre, descripcion, orden } });
  revalidatePath(RUTA);
  return { ok: true };
}

export async function desactivarCategoria(
  categoriaId: string
): Promise<{ ok: true } | { error: string }> {
  const restauranteId = await obtenerRestauranteId();
  if (!restauranteId) return { error: "Sesión no válida." };

  const cat = await prisma.categoriaComida.findFirst({ where: { id: categoriaId, restauranteId } });
  if (!cat) return { error: "Categoría no encontrada." };

  await prisma.categoriaComida.update({ where: { id: categoriaId }, data: { activa: false } });
  revalidatePath(RUTA);
  return { ok: true };
}

// ─── Ingredientes ──────────────────────────────────────────────────────────

export async function buscarIngredientes(
  query: string
): Promise<{ id: string; nombre: string }[]> {
  if (!query || query.trim().length < 1) return [];
  return prisma.ingrediente.findMany({
    where: { nombre: { contains: query.trim(), mode: "insensitive" } },
    orderBy: { nombre: "asc" },
    take: 8,
    select: { id: true, nombre: true },
  });
}

export async function crearIngrediente(
  nombre: string
): Promise<{ ok: true; id: string; nombre: string } | { error: string }> {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) return { error: "Sesión no válida." };
  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) return { error: "El nombre del ingrediente es requerido." };
  const ingrediente = await prisma.ingrediente.upsert({
    where: { nombre: nombreLimpio },
    update: {},
    create: { nombre: nombreLimpio },
    select: { id: true, nombre: true },
  });
  return { ok: true, id: ingrediente.id, nombre: ingrediente.nombre };
}

// ─── Extras ────────────────────────────────────────────────────────────────

export async function buscarExtras(
  query: string
): Promise<{ nombre: string; costo: string }[]> {
  if (!query || query.trim().length < 1) return [];
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) return [];
  const restaurante = await prisma.restaurante.findUnique({
    where: { cuentaId },
    select: { id: true },
  });
  if (!restaurante) return [];

  const raw = await prisma.extra.findMany({
    where: {
      nombre: { contains: query.trim(), mode: "insensitive" },
      platillo: { restauranteId: restaurante.id },
    },
    orderBy: { nombre: "asc" },
    take: 30,
    select: { nombre: true, costo: true },
  });

  // Deduplica por nombre (case-insensitive), toma el primero encontrado
  const seen = new Set<string>();
  const result: { nombre: string; costo: string }[] = [];
  for (const e of raw) {
    const key = e.nombre.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ nombre: e.nombre, costo: String(e.costo) });
    }
    if (result.length >= 8) break;
  }
  return result;
}

// ─── Platillos ─────────────────────────────────────────────────────────────

export async function crearPlatillo(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) return { error: "Sesión no válida." };

  const restaurante = await prisma.restaurante.findUnique({
    where: { cuentaId },
    select: {
      id: true,
      sucursales: { where: { activa: true }, select: { id: true } },
      plan: { select: { precio: true, limiteSucursales: true, limitePlatillos: true } },
      _count: { select: { platillos: true } },
    },
  });
  if (!restaurante) return { error: "Restaurante no encontrado." };

  const planLimites = restaurante.plan
    ? {
        precio: Number(restaurante.plan.precio),
        limiteSucursales: restaurante.plan.limiteSucursales,
        limitePlatillos: restaurante.plan.limitePlatillos,
      }
    : null;
  if (!puedeAgregarPlatillo(planLimites, restaurante._count.platillos)) {
    return { error: MENSAJE_SIN_PLAN_PLATILLOS };
  }

  const nombre = String(formData.get("nombre") || "").trim();
  const categoriaId = String(formData.get("categoriaId") || "").trim();
  const tamano = String(formData.get("tamano") || "").trim() || null;
  const tipo = String(formData.get("tipo") || "").trim() || null;
  const costoStr = String(formData.get("costo") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const sucursalIds = formData.getAll("sucursales").map(String).filter(Boolean);
  const imagenRaw = formData.get("imagen");

  if (!nombre) return { error: "El nombre del platillo es requerido." };
  if (!categoriaId) return { error: "Selecciona una categoría." };

  const costo = parseFloat(costoStr);
  if (isNaN(costo) || costo < 0) return { error: "El costo debe ser un número positivo." };

  const cat = await prisma.categoriaComida.findFirst({
    where: { id: categoriaId, restauranteId: restaurante.id, activa: true },
  });
  if (!cat) return { error: "Categoría no válida." };

  let imagenUrl: string | null = null;
  let imagenPublicId: string | null = null;
  if (imagenRaw instanceof File && imagenRaw.size > 0) {
    try {
      const res = await subirImagen(imagenRaw, "menu_regional/platillos");
      imagenUrl = res.url;
      imagenPublicId = res.publicId;
    } catch (err) {
      return { error: err instanceof Error ? err.message : "No se pudo subir la imagen." };
    }
  }

  const todasSucursales = restaurante.sucursales.map((s) => s.id);
  const sucursalesAsignar =
    sucursalIds.length > 0 ? sucursalIds.filter((id) => todasSucursales.includes(id)) : todasSucursales;

  if (sucursalesAsignar.length === 0) return { error: "No hay sucursales disponibles." };

  const ingredienteIds = formData.getAll("ingredientes").map(String).filter(Boolean);

  type ExtraInput = { nombre: string; costo: string };
  let extrasData: ExtraInput[] = [];
  try {
    const raw = formData.get("extras");
    if (raw) extrasData = JSON.parse(String(raw)) as ExtraInput[];
  } catch { /* ignorar JSON inválido */ }

  await prisma.$transaction(async (tx) => {
    const platillo = await tx.platillo.create({
      data: {
        nombre, tamano, tipo,
        costo: costo.toFixed(2),
        descripcion, imagenUrl, imagenPublicId,
        restauranteId: restaurante.id,
        categoriaId,
      },
    });
    await tx.platilloSucursal.createMany({
      data: sucursalesAsignar.map((sucursalId) => ({ platilloId: platillo.id, sucursalId, disponible: true })),
    });
    if (ingredienteIds.length > 0) {
      await tx.platilloIngrediente.createMany({
        data: ingredienteIds.map((ingredienteId) => ({
          platilloId: platillo.id,
          ingredienteId,
          opcional: true,
        })),
      });
    }
    if (extrasData.length > 0) {
      await tx.extra.createMany({
        data: extrasData.map((e) => ({
          nombre: e.nombre.trim(),
          costo: (parseFloat(e.costo || "0") || 0).toFixed(2),
          platilloId: platillo.id,
          disponible: true,
        })),
      });
    }
  });

  revalidatePath(RUTA);
  return { ok: true };
}

// ─── Obtener platillo completo (para edición) ──────────────────────────────

export type PlatilloCompleto = {
  id: string;
  nombre: string;
  costo: string;
  tamano: string;
  tipo: string;
  descripcion: string;
  imagenUrl: string | null;
  imagenPublicId: string | null;
  categoriaId: string;
  ingredientes: { id: string; nombre: string }[];
  extras: { nombre: string; costo: string }[];
  sucursalIds: string[];
};

export async function obtenerPlatillo(
  platilloId: string
): Promise<{ ok: true; platillo: PlatilloCompleto } | { error: string }> {
  const restauranteId = await obtenerRestauranteId();
  if (!restauranteId) return { error: "Sesión no válida." };

  const p = await prisma.platillo.findFirst({
    where: { id: platilloId, restauranteId },
    select: {
      id: true, nombre: true, costo: true, tamano: true, tipo: true,
      descripcion: true, imagenUrl: true, imagenPublicId: true, categoriaId: true,
      ingredientes: { select: { ingrediente: { select: { id: true, nombre: true } } } },
      extras: { where: { disponible: true }, select: { nombre: true, costo: true } },
      sucursales: { where: { disponible: true }, select: { sucursalId: true } },
    },
  });

  if (!p) return { error: "Platillo no encontrado." };

  return {
    ok: true,
    platillo: {
      id: p.id,
      nombre: p.nombre,
      costo: String(p.costo),
      tamano: p.tamano ?? "",
      tipo: p.tipo ?? "",
      descripcion: p.descripcion ?? "",
      imagenUrl: p.imagenUrl,
      imagenPublicId: p.imagenPublicId,
      categoriaId: p.categoriaId,
      ingredientes: p.ingredientes.map((i) => i.ingrediente),
      extras: p.extras.map((e) => ({ nombre: e.nombre, costo: String(e.costo) })),
      sucursalIds: p.sucursales.map((s) => s.sucursalId),
    },
  };
}

// ─── Activar / desactivar platillo ────────────────────────────────────────

export async function activarPlatillo(
  platilloId: string
): Promise<{ ok: true } | { error: string }> {
  const restauranteId = await obtenerRestauranteId();
  if (!restauranteId) return { error: "Sesión no válida." };

  const platillo = await prisma.platillo.findFirst({
    where: { id: platilloId, restauranteId },
    select: { id: true },
  });
  if (!platillo) return { error: "Platillo no encontrado." };

  await prisma.platillo.update({ where: { id: platilloId }, data: { disponible: true } });
  revalidatePath(RUTA);
  return { ok: true };
}

// ─── Desactivar platillo ──────────────────────────────────────────────────

export async function desactivarPlatillo(
  platilloId: string
): Promise<{ ok: true } | { error: string }> {
  const restauranteId = await obtenerRestauranteId();
  if (!restauranteId) return { error: "Sesión no válida." };

  const platillo = await prisma.platillo.findFirst({
    where: { id: platilloId, restauranteId },
    select: { id: true },
  });
  if (!platillo) return { error: "Platillo no encontrado." };

  await prisma.platillo.update({ where: { id: platilloId }, data: { disponible: false } });
  revalidatePath(RUTA);
  return { ok: true };
}

// ─── Editar platillo ───────────────────────────────────────────────────────

export async function editarPlatillo(
  platilloId: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) return { error: "Sesión no válida." };

  const restaurante = await prisma.restaurante.findUnique({
    where: { cuentaId },
    select: { id: true, sucursales: { where: { activa: true }, select: { id: true } } },
  });
  if (!restaurante) return { error: "Restaurante no encontrado." };

  const platilloActual = await prisma.platillo.findFirst({
    where: { id: platilloId, restauranteId: restaurante.id },
    select: { id: true, imagenUrl: true, imagenPublicId: true },
  });
  if (!platilloActual) return { error: "Platillo no encontrado." };

  const nombre = String(formData.get("nombre") || "").trim();
  const categoriaId = String(formData.get("categoriaId") || "").trim();
  const tamano = String(formData.get("tamano") || "").trim() || null;
  const tipo = String(formData.get("tipo") || "").trim() || null;
  const costoStr = String(formData.get("costo") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const sucursalIds = formData.getAll("sucursales").map(String).filter(Boolean);
  const imagenRaw = formData.get("imagen");

  if (!nombre) return { error: "El nombre del platillo es requerido." };
  if (!categoriaId) return { error: "Selecciona una categoría." };

  const costo = parseFloat(costoStr);
  if (isNaN(costo) || costo < 0) return { error: "El costo debe ser un número positivo." };

  const cat = await prisma.categoriaComida.findFirst({
    where: { id: categoriaId, restauranteId: restaurante.id, activa: true },
  });
  if (!cat) return { error: "Categoría no válida." };

  const todasSucursales = restaurante.sucursales.map((s) => s.id);
  const sucursalesAsignar =
    sucursalIds.length > 0 ? sucursalIds.filter((id) => todasSucursales.includes(id)) : todasSucursales;
  if (sucursalesAsignar.length === 0) return { error: "No hay sucursales disponibles." };

  let imagenUrl = platilloActual.imagenUrl;
  let imagenPublicId = platilloActual.imagenPublicId;

  if (imagenRaw instanceof File && imagenRaw.size > 0) {
    try {
      const res = await subirImagen(imagenRaw, "menu_regional/platillos");
      if (imagenPublicId) await eliminarImagen(imagenPublicId).catch(() => {});
      imagenUrl = res.url;
      imagenPublicId = res.publicId;
    } catch (err) {
      return { error: err instanceof Error ? err.message : "No se pudo subir la imagen." };
    }
  }

  const ingredienteIds = formData.getAll("ingredientes").map(String).filter(Boolean);

  type ExtraInput = { nombre: string; costo: string };
  let extrasData: ExtraInput[] = [];
  try {
    const raw = formData.get("extras");
    if (raw) extrasData = JSON.parse(String(raw)) as ExtraInput[];
  } catch { /* ignorar */ }

  await prisma.$transaction(async (tx) => {
    await tx.platillo.update({
      where: { id: platilloId },
      data: { nombre, tamano, tipo, costo: costo.toFixed(2), descripcion, imagenUrl, imagenPublicId, categoriaId },
    });
    await tx.platilloIngrediente.deleteMany({ where: { platilloId } });
    if (ingredienteIds.length > 0) {
      await tx.platilloIngrediente.createMany({
        data: ingredienteIds.map((ingredienteId) => ({ platilloId, ingredienteId, opcional: true })),
      });
    }
    await tx.extra.deleteMany({ where: { platilloId } });
    if (extrasData.length > 0) {
      await tx.extra.createMany({
        data: extrasData.map((e) => ({
          nombre: e.nombre.trim(),
          costo: (parseFloat(e.costo || "0") || 0).toFixed(2),
          platilloId,
          disponible: true,
        })),
      });
    }
    await tx.platilloSucursal.deleteMany({ where: { platilloId } });
    await tx.platilloSucursal.createMany({
      data: sucursalesAsignar.map((sucursalId) => ({ platilloId, sucursalId, disponible: true })),
    });
  });

  revalidatePath(RUTA);
  return { ok: true };
}
