"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { obtenerSesionAdminId } from "@/app/lib/session";

const REVALIDAR = "/configuracion/catalogo";

async function verificarAdmin() {
  const id = await obtenerSesionAdminId();
  if (!id) throw new Error("Sesión no válida.");
}

function txt(raw: unknown) {
  return String(raw ?? "").trim();
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

// ── Categoría de menú (CategoriaComida) ──────────────────────────────────────

export async function crearCategoriaComida(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const nombre = txt(formData.get("nombre"));
    const descripcion = txt(formData.get("descripcion")) || null;
    const orden = parseInt(txt(formData.get("orden")) || "0", 10);
    const restauranteId = txt(formData.get("restauranteId"));
    if (!nombre) return { error: "El nombre no puede estar vacío." };
    if (!restauranteId) return { error: "Selecciona un restaurante." };

    const rest = await prisma.restaurante.findUnique({ where: { id: restauranteId }, select: { id: true } });
    if (!rest) return { error: "Restaurante no válido." };

    await prisma.categoriaComida.create({
      data: { nombre, descripcion, orden: isNaN(orden) ? 0 : orden, restauranteId },
    });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al crear la categoría." };
  }
}

export async function editarCategoriaComida(
  id: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const nombre = txt(formData.get("nombre"));
    const descripcion = txt(formData.get("descripcion")) || null;
    const orden = parseInt(txt(formData.get("orden")) || "0", 10);
    if (!nombre) return { error: "El nombre no puede estar vacío." };

    await prisma.categoriaComida.update({
      where: { id },
      data: { nombre, descripcion, orden: isNaN(orden) ? 0 : orden },
    });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al editar la categoría." };
  }
}

export async function toggleCategoriaComida(
  id: string
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const cat = await prisma.categoriaComida.findUnique({ where: { id }, select: { activa: true } });
    if (!cat) return { error: "Categoría no encontrada." };
    await prisma.categoriaComida.update({ where: { id }, data: { activa: !cat.activa } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al cambiar el estatus." };
  }
}

// ── Categoría de tipo de restaurante (CategoriaTipoComida) ───────────────────

export async function crearCategoriaTipo(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const nombre = txt(formData.get("nombre"));
    const Tipo = txt(formData.get("tipo"));
    const icono = txt(formData.get("icono")) || null;
    if (!nombre) return { error: "El nombre no puede estar vacío." };
    if (!Tipo) return { error: "El tipo no puede estar vacío." };

    const slug = slugify(nombre);
    if (!slug) return { error: "El nombre no generó un slug válido." };

    const existe = await prisma.categoriaTipoComida.findUnique({ where: { slug }, select: { id: true } });
    if (existe) return { error: "Ya existe una categoría con un nombre similar (slug duplicado)." };

    const existeNombre = await prisma.categoriaTipoComida.findUnique({ where: { nombre }, select: { id: true } });
    if (existeNombre) return { error: "Ya existe una categoría con ese nombre." };

    await prisma.categoriaTipoComida.create({ data: { nombre, Tipo, slug, icono } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al crear la categoría." };
  }
}

export async function editarCategoriaTipo(
  id: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const nombre = txt(formData.get("nombre"));
    const Tipo = txt(formData.get("tipo"));
    const icono = txt(formData.get("icono")) || null;
    if (!nombre) return { error: "El nombre no puede estar vacío." };
    if (!Tipo) return { error: "El tipo no puede estar vacío." };

    const existeNombre = await prisma.categoriaTipoComida.findFirst({
      where: { nombre, NOT: { id } },
      select: { id: true },
    });
    if (existeNombre) return { error: "Ya existe una categoría con ese nombre." };

    await prisma.categoriaTipoComida.update({ where: { id }, data: { nombre, Tipo, icono } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al editar la categoría." };
  }
}

export async function toggleCategoriaTipo(
  id: string
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const cat = await prisma.categoriaTipoComida.findUnique({ where: { id }, select: { activo: true } });
    if (!cat) return { error: "Categoría no encontrada." };
    await prisma.categoriaTipoComida.update({ where: { id }, data: { activo: !cat.activo } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al cambiar el estatus." };
  }
}

// ── Ingredientes ─────────────────────────────────────────────────────────────

export async function crearIngrediente(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const nombre = txt(formData.get("nombre"));
    if (!nombre) return { error: "El nombre no puede estar vacío." };

    const existe = await prisma.ingrediente.findUnique({ where: { nombre }, select: { id: true } });
    if (existe) return { error: "Ya existe un ingrediente con ese nombre." };

    await prisma.ingrediente.create({ data: { nombre } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al crear el ingrediente." };
  }
}

export async function editarIngrediente(
  id: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const nombre = txt(formData.get("nombre"));
    if (!nombre) return { error: "El nombre no puede estar vacío." };

    const existe = await prisma.ingrediente.findFirst({
      where: { nombre, NOT: { id } },
      select: { id: true },
    });
    if (existe) return { error: "Ya existe un ingrediente con ese nombre." };

    await prisma.ingrediente.update({ where: { id }, data: { nombre } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al editar el ingrediente." };
  }
}

export async function toggleIngrediente(
  id: string
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const ing = await prisma.ingrediente.findUnique({ where: { id }, select: { activo: true } });
    if (!ing) return { error: "Ingrediente no encontrado." };
    await prisma.ingrediente.update({ where: { id }, data: { activo: !ing.activo } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al cambiar el estatus." };
  }
}

// ── Extras ───────────────────────────────────────────────────────────────────

export async function crearExtra(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const nombre = txt(formData.get("nombre"));
    const costoStr = txt(formData.get("costo"));
    const descripcion = txt(formData.get("descripcion")) || null;
    const platilloId = txt(formData.get("platilloId"));
    if (!nombre) return { error: "El nombre no puede estar vacío." };
    if (!platilloId) return { error: "Selecciona un platillo." };
    const costo = parseFloat(costoStr);
    if (isNaN(costo) || costo < 0) return { error: "Ingresa un costo válido." };

    const platillo = await prisma.platillo.findUnique({ where: { id: platilloId }, select: { id: true } });
    if (!platillo) return { error: "Platillo no válido." };

    await prisma.extra.create({ data: { nombre, costo, descripcion, platilloId } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al crear el extra." };
  }
}

export async function editarExtra(
  id: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const nombre = txt(formData.get("nombre"));
    const costoStr = txt(formData.get("costo"));
    const descripcion = txt(formData.get("descripcion")) || null;
    if (!nombre) return { error: "El nombre no puede estar vacío." };
    const costo = parseFloat(costoStr);
    if (isNaN(costo) || costo < 0) return { error: "Ingresa un costo válido." };

    await prisma.extra.update({ where: { id }, data: { nombre, costo, descripcion } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al editar el extra." };
  }
}

export async function toggleExtra(
  id: string
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const extra = await prisma.extra.findUnique({ where: { id }, select: { disponible: true } });
    if (!extra) return { error: "Extra no encontrado." };
    await prisma.extra.update({ where: { id }, data: { disponible: !extra.disponible } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al cambiar el estatus." };
  }
}
