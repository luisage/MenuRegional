"use server";

import { redirect } from "next/navigation";
import { eliminarSesionCliente, eliminarSesionRestaurante } from "@/app/lib/session";

export async function cerrarSesion() {
  await eliminarSesionRestaurante();
  redirect("/");
}

export async function cerrarSesionCliente() {
  await eliminarSesionCliente();
  redirect("/");
}
