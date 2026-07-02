"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { obtenerSesionAdminId } from "@/app/lib/session";

const REVALIDAR = "/configuracion/municipios";

// ── Helpers ─────────────────────────────────────────────────────────────────

async function verificarAdmin() {
  const id = await obtenerSesionAdminId();
  if (!id) throw new Error("Sesión no válida.");
}

function nombre(raw: unknown) {
  return String(raw ?? "").trim();
}

// ── Estados ──────────────────────────────────────────────────────────────────

export async function crearEstado(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const n = nombre(formData.get("nombre"));
    if (!n) return { error: "El nombre no puede estar vacío." };

    const existe = await prisma.estado.findUnique({ where: { nombre: n }, select: { id: true } });
    if (existe) return { error: "Ya existe un estado con ese nombre." };

    await prisma.estado.create({ data: { nombre: n } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al crear el estado." };
  }
}

export async function editarEstado(
  id: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const n = nombre(formData.get("nombre"));
    if (!n) return { error: "El nombre no puede estar vacío." };

    const existe = await prisma.estado.findFirst({
      where: { nombre: n, NOT: { id } },
      select: { id: true },
    });
    if (existe) return { error: "Ya existe un estado con ese nombre." };

    await prisma.estado.update({ where: { id }, data: { nombre: n } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al editar el estado." };
  }
}

export async function toggleEstadoActivo(
  id: string
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const estado = await prisma.estado.findUnique({ where: { id }, select: { activo: true } });
    if (!estado) return { error: "Estado no encontrado." };

    await prisma.estado.update({ where: { id }, data: { activo: !estado.activo } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al cambiar el estatus del estado." };
  }
}

// ── Municipios ───────────────────────────────────────────────────────────────

export async function crearMunicipio(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const n = nombre(formData.get("nombre"));
    const estadoId = nombre(formData.get("estadoId"));
    if (!n) return { error: "El nombre no puede estar vacío." };
    if (!estadoId) return { error: "Selecciona un estado." };

    const existe = await prisma.municipio.findUnique({
      where: { nombre_estadoId: { nombre: n, estadoId } },
      select: { id: true },
    });
    if (existe) return { error: "Ya existe ese municipio en el estado seleccionado." };

    await prisma.municipio.create({ data: { nombre: n, estadoId } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al crear el municipio." };
  }
}

export async function editarMunicipio(
  id: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const n = nombre(formData.get("nombre"));
    const estadoId = nombre(formData.get("estadoId"));
    if (!n) return { error: "El nombre no puede estar vacío." };
    if (!estadoId) return { error: "Selecciona un estado." };

    const existe = await prisma.municipio.findFirst({
      where: { nombre: n, estadoId, NOT: { id } },
      select: { id: true },
    });
    if (existe) return { error: "Ya existe ese municipio en el estado seleccionado." };

    await prisma.municipio.update({ where: { id }, data: { nombre: n, estadoId } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al editar el municipio." };
  }
}

export async function toggleMunicipioActivo(
  id: string
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const municipio = await prisma.municipio.findUnique({ where: { id }, select: { activo: true } });
    if (!municipio) return { error: "Municipio no encontrado." };

    await prisma.municipio.update({ where: { id }, data: { activo: !municipio.activo } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al cambiar el estatus del municipio." };
  }
}

// ── Colonias ─────────────────────────────────────────────────────────────────

export async function crearColonia(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const n = nombre(formData.get("nombre"));
    const municipioId = nombre(formData.get("municipioId"));
    if (!n) return { error: "El nombre no puede estar vacío." };
    if (!municipioId) return { error: "Selecciona un municipio." };

    const existe = await prisma.colonia.findUnique({
      where: { nombre_municipioId: { nombre: n, municipioId } },
      select: { id: true },
    });
    if (existe) return { error: "Ya existe esa colonia en el municipio seleccionado." };

    await prisma.colonia.create({ data: { nombre: n, municipioId } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al crear la colonia." };
  }
}

export async function editarColonia(
  id: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const n = nombre(formData.get("nombre"));
    const municipioId = nombre(formData.get("municipioId"));
    if (!n) return { error: "El nombre no puede estar vacío." };
    if (!municipioId) return { error: "Selecciona un municipio." };

    const existe = await prisma.colonia.findFirst({
      where: { nombre: n, municipioId, NOT: { id } },
      select: { id: true },
    });
    if (existe) return { error: "Ya existe esa colonia en el municipio seleccionado." };

    await prisma.colonia.update({ where: { id }, data: { nombre: n, municipioId } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al editar la colonia." };
  }
}

export async function toggleColoniaActivo(
  id: string
): Promise<{ ok: true } | { error: string }> {
  try {
    await verificarAdmin();
    const colonia = await prisma.colonia.findUnique({ where: { id }, select: { activo: true } });
    if (!colonia) return { error: "Colonia no encontrada." };

    await prisma.colonia.update({ where: { id }, data: { activo: !colonia.activo } });
    revalidatePath(REVALIDAR);
    return { ok: true };
  } catch {
    return { error: "Error al cambiar el estatus de la colonia." };
  }
}
