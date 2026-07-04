"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { obtenerSesionRestauranteId } from "@/app/lib/session";
import { subirImagen, eliminarImagen } from "@/app/lib/cloudinary";
import { puedeAgregarAvisos, puedeAgregarSucursal } from "@/app/lib/planes";

function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generarSlugUnicoSucursal(nombre: string, restauranteId: string, excludeId?: string) {
  const base = slugify(nombre) || "sucursal";
  let slug = base;
  let intento = 1;

  while (await prisma.sucursal.findFirst({
    where: { slug, restauranteId, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  })) {
    intento += 1;
    slug = `${base}-${intento}`;
  }

  return slug;
}

const MENSAJE_SIN_PLAN_AVISOS =
  "Tu plan actual no permite agregar avisos, promociones o eventos. Suscríbete a un plan superior para desbloquear esta función.";
const MENSAJE_SIN_PLAN_SUCURSAL =
  "Tu plan actual no permite agregar más sucursales. Suscríbete a un plan superior para desbloquear esta función.";

export async function actualizarRestaurante(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) return { error: "Sesión no válida." };

  const restaurante = await prisma.restaurante.findUnique({
    where: { cuentaId },
    select: { id: true, logoPublicId: true, portadaPublicId: true },
  });
  if (!restaurante) return { error: "Restaurante no encontrado." };

  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const imagenRaw = formData.get("logo");
  const portadaRaw = formData.get("portada");
  const categoriasIds = formData.getAll("categoriasIds").map(String).filter(Boolean);

  let logoUrl: string | undefined;
  let logoPublicId: string | undefined;

  if (imagenRaw instanceof File && imagenRaw.size > 0) {
    try {
      const resultado = await subirImagen(imagenRaw, "menu_regional/restaurantes");
      logoUrl = resultado.url;
      logoPublicId = resultado.publicId;

      if (restaurante.logoPublicId) {
        await eliminarImagen(restaurante.logoPublicId).catch(() => {});
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : "No se pudo subir la imagen." };
    }
  }

  let portadaUrl: string | undefined;
  let portadaPublicId: string | undefined;

  if (portadaRaw instanceof File && portadaRaw.size > 0) {
    try {
      const resultado = await subirImagen(portadaRaw, "menu_regional/portadas");
      portadaUrl = resultado.url;
      portadaPublicId = resultado.publicId;

      if (restaurante.portadaPublicId) {
        await eliminarImagen(restaurante.portadaPublicId).catch(() => {});
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : "No se pudo subir la imagen de portada." };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.restaurante.update({
      where: { id: restaurante.id },
      data: {
        descripcion,
        ...(logoUrl !== undefined ? { logoUrl, logoPublicId } : {}),
        ...(portadaUrl !== undefined ? { portadaUrl, portadaPublicId } : {}),
      },
    });
    await tx.restauranteCategoria.deleteMany({ where: { restauranteId: restaurante.id } });
    if (categoriasIds.length > 0) {
      await tx.restauranteCategoria.createMany({
        data: categoriasIds.map((categoriaId) => ({ restauranteId: restaurante.id, categoriaId })),
      });
    }
  });

  revalidatePath("/panel", "layout");
  return { ok: true };
}

export async function crearSucursal(
  formData: FormData
): Promise<{ ok: true; id: string } | { error: string }> {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) return { error: "Sesión no válida." };

  const restaurante = await prisma.restaurante.findUnique({
    where: { cuentaId },
    select: {
      id: true,
      plan: { select: { precio: true, limiteSucursales: true, limitePlatillos: true } },
      _count: { select: { sucursales: true } },
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
  if (!puedeAgregarSucursal(planLimites, restaurante._count.sucursales)) {
    return { error: MENSAJE_SIN_PLAN_SUCURSAL };
  }

  const nombre = String(formData.get("nombre") || "").trim();
  const telefonoWhatsApp = String(formData.get("telefonoWhatsApp") || "").replace(/\D/g, "");
  const envioDomicilio = formData.get("envioDomicilio") === "true";
  const costoEnvioStr = String(formData.get("costoEnvio") || "").trim();
  const descripcionEnvio = String(formData.get("descripcionEnvio") || "").trim() || null;
  const rangoEnvioStr = String(formData.get("rangoEnvio") || "").trim();
  const calle = String(formData.get("calle") || "").trim();
  const numero = String(formData.get("numero") || "").trim();
  const coloniaId = String(formData.get("coloniaId") || "").trim();
  const latitudStr = String(formData.get("latitud") || "").trim();
  const longitudStr = String(formData.get("longitud") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim() || null;

  if (!nombre) return { error: "El nombre de la sucursal es requerido." };
  if (telefonoWhatsApp.length < 10) return { error: "Ingresa un número de WhatsApp válido (mínimo 10 dígitos)." };
  if (!calle || !numero || !coloniaId) return { error: "Completa la dirección de la sucursal." };

  let costoEnvio: string | null = null;
  if (envioDomicilio && costoEnvioStr !== "") {
    const parsed = parseFloat(costoEnvioStr);
    if (isNaN(parsed) || parsed < 0) return { error: "El costo de envío debe ser un número positivo." };
    costoEnvio = parsed.toFixed(2);
  }

  let rangoEnvio: string | null = null;
  if (rangoEnvioStr !== "") {
    const parsed = parseFloat(rangoEnvioStr);
    if (isNaN(parsed) || parsed <= 0 || parsed >= 100) return { error: "El rango de envío debe ser un número positivo menor a 100." };
    rangoEnvio = parsed.toFixed(1);
  }

  let latitud: string | null = null;
  let longitud: string | null = null;
  if (latitudStr !== "" && longitudStr !== "") {
    const lat = parseFloat(latitudStr);
    const lng = parseFloat(longitudStr);
    if (isNaN(lat) || lat < -90 || lat > 90) return { error: "Latitud inválida (debe estar entre -90 y 90)." };
    if (isNaN(lng) || lng < -180 || lng > 180) return { error: "Longitud inválida (debe estar entre -180 y 180)." };
    latitud = lat.toFixed(8);
    longitud = lng.toFixed(8);
  }

  const colonia = await prisma.colonia.findUnique({ where: { id: coloniaId }, select: { id: true } });
  if (!colonia) return { error: "Colonia no válida." };

  const slugSucursal = await generarSlugUnicoSucursal(nombre, restaurante.id);

  const sucursal = await prisma.sucursal.create({
    data: {
      nombre, telefonoWhatsApp, envioDomicilio, costoEnvio, descripcionEnvio,
      rangoEnvio, calle, numero, coloniaId, latitud, longitud, descripcion,
      restauranteId: restaurante.id,
      slug: slugSucursal,
      activa: true,
    },
    select: { id: true },
  });

  revalidatePath("/panel/datos");
  revalidatePath("/panel/platillos/nuevo");
  return { ok: true, id: sucursal.id };
}

export async function actualizarSucursal(
  sucursalId: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) return { error: "Sesión no válida." };

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: sucursalId },
    select: { nombre: true, restauranteId: true, restaurante: { select: { cuentaId: true } } },
  });
  if (!sucursal || sucursal.restaurante.cuentaId !== cuentaId) {
    return { error: "No tienes permiso para editar esta sucursal." };
  }

  const nombre = String(formData.get("nombre") || "").trim();
  const telefonoWhatsApp = String(formData.get("telefonoWhatsApp") || "").replace(/\D/g, "");
  const envioDomicilio = formData.get("envioDomicilio") === "true";
  const costoEnvioStr = String(formData.get("costoEnvio") || "").trim();
  const descripcionEnvio = String(formData.get("descripcionEnvio") || "").trim() || null;
  const rangoEnvioStr = String(formData.get("rangoEnvio") || "").trim();
  const calle = String(formData.get("calle") || "").trim();
  const numero = String(formData.get("numero") || "").trim();
  const coloniaId = String(formData.get("coloniaId") || "").trim();
  const latitudStr = String(formData.get("latitud") || "").trim();
  const longitudStr = String(formData.get("longitud") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim() || null;

  if (!nombre) return { error: "El nombre de la sucursal es requerido." };
  if (telefonoWhatsApp.length < 10) {
    return { error: "Ingresa un número de WhatsApp válido (mínimo 10 dígitos)." };
  }
  if (!calle || !numero || !coloniaId) {
    return { error: "Completa la dirección de la sucursal." };
  }

  let costoEnvio: string | null = null;
  if (envioDomicilio && costoEnvioStr !== "") {
    const parsed = parseFloat(costoEnvioStr);
    if (isNaN(parsed) || parsed < 0) {
      return { error: "El costo de envío debe ser un número positivo." };
    }
    costoEnvio = parsed.toFixed(2);
  }

  let rangoEnvio: string | null = null;
  if (rangoEnvioStr !== "") {
    const parsed = parseFloat(rangoEnvioStr);
    if (isNaN(parsed) || parsed <= 0 || parsed >= 100) {
      return { error: "El rango de envío debe ser un número positivo menor a 100." };
    }
    rangoEnvio = parsed.toFixed(1);
  }

  let latitud: string | null = null;
  let longitud: string | null = null;
  if (latitudStr !== "" && longitudStr !== "") {
    const lat = parseFloat(latitudStr);
    const lng = parseFloat(longitudStr);
    if (isNaN(lat) || lat < -90 || lat > 90) return { error: "Latitud inválida (debe estar entre -90 y 90)." };
    if (isNaN(lng) || lng < -180 || lng > 180) return { error: "Longitud inválida (debe estar entre -180 y 180)." };
    latitud = lat.toFixed(8);
    longitud = lng.toFixed(8);
  }

  const slugData =
    nombre !== sucursal.nombre
      ? { slug: await generarSlugUnicoSucursal(nombre, sucursal.restauranteId, sucursalId) }
      : {};

  await prisma.sucursal.update({
    where: { id: sucursalId },
    data: {
      nombre,
      telefonoWhatsApp,
      envioDomicilio,
      costoEnvio,
      descripcionEnvio,
      rangoEnvio,
      calle,
      numero,
      coloniaId,
      latitud,
      longitud,
      descripcion,
      ...slugData,
    },
  });

  return { ok: true };
}

export async function crearAviso(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) return { error: "Sesión no válida." };

  const restaurante = await prisma.restaurante.findUnique({
    where: { cuentaId },
    select: {
      id: true,
      sucursales: { select: { id: true } },
      plan: { select: { precio: true } },
    },
  });
  if (!restaurante) return { error: "Restaurante no encontrado." };

  if (!puedeAgregarAvisos(restaurante.plan ? { precio: Number(restaurante.plan.precio), limiteSucursales: null, limitePlatillos: null } : null)) {
    return { error: MENSAJE_SIN_PLAN_AVISOS };
  }

  const descripcion = String(formData.get("descripcion") || "").trim();
  if (!descripcion) return { error: "La descripción del aviso es requerida." };

  const estatus = formData.get("estatus") === "true";
  const fecha = String(formData.get("fecha") || "").trim() || null;
  const sucursalIds = formData.getAll("sucursalIds").map(String).filter(Boolean);

  const validIds = new Set(restaurante.sucursales.map((s) => s.id));
  const idsValidos = sucursalIds.filter((id) => validIds.has(id));
  if (idsValidos.length === 0) return { error: "Selecciona al menos una sucursal." };

  let imagenUrl: string | undefined;
  let imagenPublicId: string | undefined;

  const imagenRaw = formData.get("imagen");
  if (imagenRaw instanceof File && imagenRaw.size > 0) {
    try {
      const resultado = await subirImagen(imagenRaw, "menu_regional/avisos");
      imagenUrl = resultado.url;
      imagenPublicId = resultado.publicId;
    } catch (err) {
      return { error: err instanceof Error ? err.message : "No se pudo subir la imagen." };
    }
  }

  await prisma.aviso.createMany({
    data: idsValidos.map((sucursalId) => ({
      descripcion,
      estatus,
      fecha,
      imagenUrl,
      imagenPublicId,
      sucursalId,
    })),
  });

  revalidatePath("/panel/datos");
  return { ok: true };
}

export async function editarAviso(
  avisoIds: string[],
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) return { error: "Sesión no válida." };
  if (!avisoIds.length) return { error: "No se especificaron avisos." };

  const restaurante = await prisma.restaurante.findUnique({
    where: { cuentaId },
    select: { sucursales: { select: { id: true } } },
  });
  if (!restaurante) return { error: "Restaurante no encontrado." };

  const avisosExistentes = await prisma.aviso.findMany({
    where: { id: { in: avisoIds } },
    select: { id: true, imagenPublicId: true, sucursalId: true },
  });

  const sucursalIdsValidas = new Set(restaurante.sucursales.map((s) => s.id));
  if (
    avisosExistentes.length !== avisoIds.length ||
    !avisosExistentes.every((a) => sucursalIdsValidas.has(a.sucursalId))
  ) {
    return { error: "No tienes permiso para editar estos avisos." };
  }

  const descripcion = String(formData.get("descripcion") || "").trim();
  if (!descripcion) return { error: "La descripción es requerida." };

  const estatus = formData.get("estatus") === "true";
  const fecha = String(formData.get("fecha") || "").trim() || null;
  const quitarImagen = formData.get("quitarImagen") === "true";
  const oldPublicId = avisosExistentes[0]?.imagenPublicId ?? null;

  const imageUpdate: { imagenUrl?: string | null; imagenPublicId?: string | null } = {};

  const imagenRaw = formData.get("imagen");
  if (imagenRaw instanceof File && imagenRaw.size > 0) {
    try {
      const resultado = await subirImagen(imagenRaw, "menu_regional/avisos");
      imageUpdate.imagenUrl = resultado.url;
      imageUpdate.imagenPublicId = resultado.publicId;
      if (oldPublicId) await eliminarImagen(oldPublicId).catch(() => {});
    } catch (err) {
      return { error: err instanceof Error ? err.message : "No se pudo subir la imagen." };
    }
  } else if (quitarImagen) {
    if (oldPublicId) await eliminarImagen(oldPublicId).catch(() => {});
    imageUpdate.imagenUrl = null;
    imageUpdate.imagenPublicId = null;
  }

  await prisma.aviso.updateMany({
    where: { id: { in: avisoIds } },
    data: { descripcion, estatus, fecha, ...imageUpdate },
  });

  revalidatePath("/panel/datos");
  return { ok: true };
}

export async function eliminarAviso(
  avisoIds: string[]
): Promise<{ ok: true } | { error: string }> {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) return { error: "Sesión no válida." };
  if (!avisoIds.length) return { error: "No se especificaron avisos." };

  const restaurante = await prisma.restaurante.findUnique({
    where: { cuentaId },
    select: { sucursales: { select: { id: true } } },
  });
  if (!restaurante) return { error: "Restaurante no encontrado." };

  const avisos = await prisma.aviso.findMany({
    where: { id: { in: avisoIds } },
    select: { imagenPublicId: true, sucursalId: true },
  });

  const sucursalIdsValidas = new Set(restaurante.sucursales.map((s) => s.id));
  if (!avisos.every((a) => sucursalIdsValidas.has(a.sucursalId))) {
    return { error: "No tienes permiso para eliminar estos avisos." };
  }

  const publicIds = [
    ...new Set(avisos.map((a) => a.imagenPublicId).filter((p): p is string => !!p)),
  ];
  for (const publicId of publicIds) {
    await eliminarImagen(publicId).catch(() => {});
  }

  await prisma.aviso.deleteMany({ where: { id: { in: avisoIds } } });

  revalidatePath("/panel/datos");
  return { ok: true };
}
