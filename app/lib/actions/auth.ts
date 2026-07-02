"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { crearSesionCliente, crearSesionRestaurante } from "@/app/lib/session";

export async function iniciarSesion(
  formData: FormData
): Promise<{ error: string } | void> {
  const tipoCuenta = String(formData.get("tipoCuenta") || "restaurante");
  const usuario = String(formData.get("usuario") || "").trim();
  const password = String(formData.get("password") || "");

  if (!usuario || !password) {
    return { error: "Ingresa tu usuario y contraseña." };
  }

  if (tipoCuenta === "usuario") {
    const cuenta = await prisma.cuentaCliente.findUnique({ where: { usuario } });

    if (!cuenta || !cuenta.activa || !(await bcrypt.compare(password, cuenta.password))) {
      return { error: "Usuario o contraseña incorrectos." };
    }

    await crearSesionCliente(cuenta.id);
    redirect("/explorar");
  }

  const cuenta = await prisma.cuentaRestaurante.findUnique({ where: { usuario } });

  if (!cuenta || !cuenta.activa || !(await bcrypt.compare(password, cuenta.password))) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await crearSesionRestaurante(cuenta.id);
  redirect("/panel");
}
