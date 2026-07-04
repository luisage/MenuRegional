"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { crearSesionRestaurante } from "@/app/lib/session";
import { subirImagen } from "@/app/lib/cloudinary";

function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generarSlugUnico(nombre: string) {
  const base = slugify(nombre) || "restaurante";
  let slug = base;
  let intento = 1;

  while (await prisma.restaurante.findUnique({ where: { slug } })) {
    intento += 1;
    slug = `${base}-${intento}`;
  }

  return slug;
}

async function generarSlugUnicoSucursal(nombre: string, restauranteId: string) {
  const base = slugify(nombre) || "sucursal";
  let slug = base;
  let intento = 1;

  while (await prisma.sucursal.findFirst({ where: { slug, restauranteId } })) {
    intento += 1;
    slug = `${base}-${intento}`;
  }

  return slug;
}

export async function registrarRestaurante(
  formData: FormData
): Promise<{ error: string } | void> {
  const nombreRestaurante = String(formData.get("nombreRestaurante") || "").trim();
  const tipoComida = String(formData.get("tipoComida") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmarPassword = String(formData.get("confirmarPassword") || "");
  const nombreDueno = String(formData.get("nombreDueno") || "").trim();
  const celularRaw = String(formData.get("celular") || "");
  const calle = String(formData.get("calle") || "").trim();
  const numero = String(formData.get("numero") || "").trim();
  const coloniaId = String(formData.get("coloniaId") || "").trim();
  const imagen = formData.get("imagen");

  if (!nombreRestaurante || !tipoComida || !nombreDueno || !celularRaw) {
    return { error: "Por favor completa todos los campos." };
  }

  if (!calle || !numero || !coloniaId) {
    return { error: "Ingresa la dirección completa de la sucursal." };
  }

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  if (password !== confirmarPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const celular = celularRaw.replace(/\D/g, "");
  if (celular.length < 10) {
    return { error: "Ingresa un número de celular válido (10 dígitos)." };
  }

  let logoUrl: string | null = null;
  let logoPublicId: string | null = null;
  if (imagen instanceof File && imagen.size > 0) {
    try {
      const resultado = await subirImagen(imagen, "menu_regional/restaurantes");
      logoUrl = resultado.url;
      logoPublicId = resultado.publicId;
    } catch (err) {
      return { error: err instanceof Error ? err.message : "No se pudo subir la imagen." };
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const slug = await generarSlugUnico(nombreRestaurante);

  let cuentaId: string;
  try {
    const cuenta = await prisma.$transaction(async (tx) => {
      const cuenta = await tx.cuentaRestaurante.create({
        data: {
          usuario: celular,
          password: passwordHash,
          nombreDueno,
          celular,
        },
      });

      const restaurante = await tx.restaurante.create({
        data: {
          nombre: nombreRestaurante,
          descripcion: tipoComida,
          logoUrl,
          logoPublicId,
          slug,
          cuentaId: cuenta.id,
        },
      });

      const slugSucursal = await generarSlugUnicoSucursal(nombreRestaurante, restaurante.id);

      await tx.sucursal.create({
        data: {
          nombre: nombreRestaurante,
          calle,
          numero,
          coloniaId,
          telefonoWhatsApp: celular,
          restauranteId: restaurante.id,
          slug: slugSucursal,
        },
      });

      return cuenta;
    });

    cuentaId = cuenta.id;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "Ya existe una cuenta registrada con este número de celular." };
    }
    throw err;
  }

  await crearSesionRestaurante(cuentaId);
  redirect("/panel");
}
