"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { crearSesionAdmin, eliminarSesionAdmin, obtenerSesionAdminId } from "@/app/lib/session";

export async function iniciarSesionAdmin(
  formData: FormData
): Promise<{ error: string } | void> {
  const usuario = String(formData.get("usuario") || "").trim();
  const password = String(formData.get("password") || "");

  if (!usuario || !password) {
    return { error: "Ingresa tu usuario y contraseña." };
  }

  const user = await prisma.user.findUnique({ where: { usuario } });

  if (!user || !user.estatus || !(await bcrypt.compare(password, user.password))) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await crearSesionAdmin(user.id);
  redirect("/configuracion/restaurantes");
}

export async function cerrarSesionAdmin() {
  await eliminarSesionAdmin();
  redirect("/configuracion");
}

export async function actualizarPasswordAdmin(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const userId = await obtenerSesionAdminId();
  if (!userId) return { error: "Sesión no válida." };

  const passwordActual = String(formData.get("passwordActual") || "");
  const passwordNueva = String(formData.get("passwordNueva") || "");
  const passwordConfirmar = String(formData.get("passwordConfirmar") || "");

  if (!passwordActual || !passwordNueva || !passwordConfirmar) {
    return { error: "Completa todos los campos." };
  }
  if (passwordNueva.length < 6) {
    return { error: "La nueva contraseña debe tener al menos 6 caracteres." };
  }
  if (passwordNueva !== passwordConfirmar) {
    return { error: "Las contraseñas nuevas no coinciden." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Sesión no válida." };

  if (!(await bcrypt.compare(passwordActual, user.password))) {
    return { error: "La contraseña actual es incorrecta." };
  }

  const passwordHash = await bcrypt.hash(passwordNueva, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: passwordHash } });

  return { ok: true };
}

export async function toggleRestauranteActivo(
  restauranteId: string
): Promise<{ ok: true } | { error: string }> {
  const userId = await obtenerSesionAdminId();
  if (!userId) return { error: "Sesión no válida." };

  const restaurante = await prisma.restaurante.findUnique({
    where: { id: restauranteId },
    select: { activo: true },
  });
  if (!restaurante) return { error: "Restaurante no encontrado." };

  await prisma.restaurante.update({
    where: { id: restauranteId },
    data: { activo: !restaurante.activo },
  });

  revalidatePath("/configuracion/restaurantes");
  return { ok: true };
}

export async function actualizarPlanRestaurante(
  restauranteId: string,
  planId: string | null
): Promise<{ ok: true } | { error: string }> {
  const userId = await obtenerSesionAdminId();
  if (!userId) return { error: "Sesión no válida." };

  const restaurante = await prisma.restaurante.findUnique({
    where: { id: restauranteId },
    select: { id: true, planId: true },
  });
  if (!restaurante) return { error: "Restaurante no encontrado." };

  if (planId) {
    const plan = await prisma.plan.findUnique({ where: { id: planId }, select: { id: true } });
    if (!plan) return { error: "Plan no válido." };
  }

  const seModificoElPlan = planId !== restaurante.planId;

  await prisma.$transaction(async (tx) => {
    await tx.restaurante.update({
      where: { id: restauranteId },
      data: { planId },
    });

    if (seModificoElPlan && planId) {
      await tx.suscripcion.create({
        data: { restauranteId, planId },
      });
    }
  });

  revalidatePath("/configuracion/restaurantes");
  return { ok: true };
}

export async function registrarPago(
  restauranteId: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const userId = await obtenerSesionAdminId();
  if (!userId) return { error: "Sesión no válida." };

  const montoStr = String(formData.get("monto") || "").trim();
  const metodoPago = String(formData.get("metodoPago") || "").trim() || null;

  const monto = parseFloat(montoStr);
  if (!montoStr || isNaN(monto) || monto <= 0) {
    return { error: "Ingresa un monto válido." };
  }

  const suscripcion = await prisma.suscripcion.findFirst({
    where: { restauranteId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!suscripcion) {
    return { error: "Este restaurante no tiene un plan asignado. Asigna un plan antes de registrar un pago." };
  }

  const fechaPago = new Date();
  const fechaVence = new Date(fechaPago);
  fechaVence.setMonth(fechaVence.getMonth() + 1);

  await prisma.pago.create({
    data: {
      suscripcionId: suscripcion.id,
      monto,
      fechaPago,
      fechaVence,
      metodoPago,
    },
  });

  revalidatePath("/configuracion/restaurantes");
  return { ok: true };
}
