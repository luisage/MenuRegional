import { cookies } from "next/headers";

const SESSION_COOKIE_RESTAURANTE = "session_restaurante";
const SESSION_COOKIE_CLIENTE = "session_cliente";
const SESSION_COOKIE_ADMIN = "session_admin";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export async function crearSesionRestaurante(cuentaId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_RESTAURANTE, cuentaId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function obtenerSesionRestauranteId() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_RESTAURANTE)?.value ?? null;
}

export async function eliminarSesionRestaurante() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_RESTAURANTE);
}

export async function crearSesionCliente(cuentaId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_CLIENTE, cuentaId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function obtenerSesionClienteId() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_CLIENTE)?.value ?? null;
}

export async function eliminarSesionCliente() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_CLIENTE);
}

export async function crearSesionAdmin(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_ADMIN, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function obtenerSesionAdminId() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_ADMIN)?.value ?? null;
}

export async function eliminarSesionAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_ADMIN);
}
