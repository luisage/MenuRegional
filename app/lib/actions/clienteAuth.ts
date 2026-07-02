"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { crearSesionCliente, obtenerSesionClienteId, eliminarSesionCliente } from "@/app/lib/session";
import { calcularSucursalAbierta } from "@/app/lib/horario";

export async function loginCliente(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const usuario = String(formData.get("usuario") || "").trim();
  const password = String(formData.get("password") || "");

  if (!usuario || !password) return { error: "Ingresa tu usuario y contraseña." };

  const cuenta = await prisma.cuentaCliente.findUnique({ where: { usuario } });
  if (!cuenta || !cuenta.activa || !(await bcrypt.compare(password, cuenta.password))) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await crearSesionCliente(cuenta.id);
  return { ok: true };
}

export async function cerrarSesionCliente(): Promise<void> {
  await eliminarSesionCliente();
}

export async function obtenerMunicipios(): Promise<{ id: string; nombre: string }[]> {
  return prisma.municipio.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });
}

export async function obtenerColoniasPorMunicipio(
  municipioId: string
): Promise<{ id: string; nombre: string }[]> {
  return prisma.colonia.findMany({
    where: { municipioId },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });
}

export async function registrarCliente(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const nombre = String(formData.get("nombre") || "").trim();
  const usuario = String(formData.get("usuario") || "").trim();
  const password = String(formData.get("password") || "");
  const celular = String(formData.get("celular") || "").trim();
  const calle = String(formData.get("calle") || "").trim();
  const numero = String(formData.get("numero") || "").trim();
  const coloniaId = String(formData.get("coloniaId") || "").trim();
  const referencias = String(formData.get("referencias") || "").trim() || null;
  const latStr = String(formData.get("latitud") || "").trim();
  const lngStr = String(formData.get("longitud") || "").trim();

  if (!nombre) return { error: "El nombre es requerido." };
  if (!usuario) return { error: "El usuario es requerido." };
  if (!password || password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };
  if (!celular) return { error: "El número de celular es requerido." };
  if (!calle) return { error: "La calle es requerida." };
  if (!numero) return { error: "El número es requerido." };
  if (!coloniaId) return { error: "Selecciona una colonia." };
  if (!latStr || !lngStr) return { error: "Debes marcar tu ubicación en el mapa." };

  const existeUsuario = await prisma.cuentaCliente.findUnique({ where: { usuario } });
  if (existeUsuario) return { error: "Ese nombre de usuario ya está en uso." };

  const existeCelular = await prisma.cuentaCliente.findUnique({ where: { celular } });
  if (existeCelular) return { error: "Ese número de celular ya está registrado." };

  const coloniaValida = await prisma.colonia.findUnique({ where: { id: coloniaId }, select: { id: true } });
  if (!coloniaValida) return { error: "La colonia seleccionada no es válida." };

  const latitud = parseFloat(latStr);
  const longitud = parseFloat(lngStr);

  const hash = await bcrypt.hash(password, 10);

  const cuenta = await prisma.cuentaCliente.create({
    data: {
      nombre,
      usuario,
      password: hash,
      celular,
      calle,
      numero,
      coloniaId,
      referencias,
      latitud,
      longitud,
    },
    select: { id: true },
  });

  await crearSesionCliente(cuenta.id);
  return { ok: true };
}

// ── Pedidos del cliente ──────────────────────────────────────────────────

export type DetalleExtraVista = {
  nombre: string;
  costo: string;
};

export type DetallePedidoVista = {
  id: string;
  cantidad: number;
  nombrePlatillo: string;
  precioUnitario: string;
  costoTotal: string;
  descripcion: string | null;
  extras: DetalleExtraVista[];
};

export type PedidoVista = {
  id: string;
  folio: number;
  estado: string;
  tipoEnvio: string;
  tipoPago: string;
  subtotal: string;
  costoEnvio: string;
  propina: string;
  costoTotal: string;
  descripcion: string | null;
  restauranteNombre: string;
  sucursalNombre: string;
  createdAt: string;
  detalles: DetallePedidoVista[];
};

export async function obtenerPedidosCliente(): Promise<
  { ok: true; pedidos: PedidoVista[] } | { error: string }
> {
  const clienteId = await obtenerSesionClienteId();
  if (!clienteId) return { error: "No hay sesión activa." };

  const pedidos = await prisma.pedido.findMany({
    where: { clienteId },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: {
      id: true,
      folio: true,
      estado: true,
      tipoEnvio: true,
      tipoPago: true,
      subtotal: true,
      costoEnvio: true,
      propina: true,
      costoTotal: true,
      descripcion: true,
      createdAt: true,
      restaurante: { select: { nombre: true } },
      sucursal: { select: { nombre: true } },
      detalles: {
        select: {
          id: true,
          cantidad: true,
          nombrePlatillo: true,
          precioUnitario: true,
          costoTotal: true,
          descripcion: true,
          extras: { select: { nombreExtra: true, costoExtra: true } },
        },
      },
    },
  });

  return {
    ok: true,
    pedidos: pedidos.map((p) => ({
      id: p.id,
      folio: p.folio,
      estado: p.estado,
      tipoEnvio: p.tipoEnvio,
      tipoPago: p.tipoPago,
      subtotal: String(p.subtotal),
      costoEnvio: String(p.costoEnvio),
      propina: String(p.propina),
      costoTotal: String(p.costoTotal),
      descripcion: p.descripcion,
      restauranteNombre: p.restaurante.nombre,
      sucursalNombre: p.sucursal.nombre,
      createdAt: p.createdAt.toISOString(),
      detalles: p.detalles.map((d) => ({
        id: d.id,
        cantidad: d.cantidad,
        nombrePlatillo: d.nombrePlatillo,
        precioUnitario: String(d.precioUnitario),
        costoTotal: String(d.costoTotal),
        descripcion: d.descripcion,
        extras: d.extras.map((e) => ({
          nombre: e.nombreExtra,
          costo: String(e.costoExtra),
        })),
      })),
    })),
  };
}

// ── Sucursales con ubicación (para mapa "Cerca de ti") ───────────────────

export type SucursalUbicacion = {
  restauranteNombre: string;
  restauranteSlug: string;
  sucursalNombre: string;
  lat: number;
  lng: number;
};

export async function obtenerSucursalesConUbicacion(): Promise<SucursalUbicacion[]> {
  const sucursales = await prisma.sucursal.findMany({
    where: {
      activa: true,
      latitud: { not: null },
      longitud: { not: null },
      restaurante: { activo: true },
    },
    select: {
      nombre: true,
      latitud: true,
      longitud: true,
      restaurante: { select: { nombre: true, slug: true } },
    },
  });

  return sucursales
    .filter((s) => s.latitud !== null && s.longitud !== null)
    .map((s) => ({
      restauranteNombre: s.restaurante.nombre,
      restauranteSlug: s.restaurante.slug,
      sucursalNombre: s.nombre,
      lat: Number(s.latitud),
      lng: Number(s.longitud),
    }));
}

// ── Restaurantes recientes del cliente ────────────────────────────────────

export type RestauranteReciente = {
  id: string;
  nombre: string;
  logoUrl: string | null;
  slug: string;
  tiposComida: string[];
  colonia: string | null;
  envioDomicilio: boolean;
  abierto: boolean;
};

export async function obtenerRestaurantesRecientes(): Promise<
  { ok: true; restaurantes: RestauranteReciente[] } | { error: string }
> {
  const clienteId = await obtenerSesionClienteId();
  if (!clienteId) return { error: "No hay sesión activa." };

  // Últimos 5 restaurantes distintos con pedido del cliente (orden por pedido más reciente)
  const pedidosRaw = await prisma.pedido.findMany({
    where: { clienteId },
    orderBy: { createdAt: "desc" },
    select: { restauranteId: true },
  });

  const idsVistos = new Set<string>();
  const restauranteIds: string[] = [];
  for (const p of pedidosRaw) {
    if (!idsVistos.has(p.restauranteId)) {
      idsVistos.add(p.restauranteId);
      restauranteIds.push(p.restauranteId);
      if (restauranteIds.length === 5) break;
    }
  }

  if (restauranteIds.length === 0) return { ok: true, restaurantes: [] };

  const restaurantesRaw = await prisma.restaurante.findMany({
    where: { id: { in: restauranteIds }, activo: true },
    select: {
      id: true,
      nombre: true,
      logoUrl: true,
      slug: true,
      categoriasTipo: {
        select: { categoria: { select: { nombre: true } } },
      },
      sucursales: {
        where: { activa: true },
        select: {
          envioDomicilio: true,
          colonia: { select: { nombre: true } },
          horarios: { select: { dia: true, apertura: true, cierre: true, abierto: true } },
        },
      },
    },
  });

  // Reordenar según el orden de pedido original (más reciente primero)
  const porId = new Map(restaurantesRaw.map((r) => [r.id, r]));
  const restaurantes: RestauranteReciente[] = restauranteIds.flatMap((id) => {
    const r = porId.get(id);
    if (!r) return [];
    const colonia: string | null = r.sucursales[0]?.colonia.nombre ?? null;
    const item: RestauranteReciente = {
      id: r.id,
      nombre: r.nombre,
      logoUrl: r.logoUrl,
      slug: r.slug,
      tiposComida: r.categoriasTipo.map((ct) => ct.categoria.nombre),
      colonia,
      envioDomicilio: r.sucursales.some((s) => s.envioDomicilio),
      abierto: r.sucursales.some((s) => calcularSucursalAbierta(s.horarios)),
    };
    return [item];
  });

  return { ok: true, restaurantes };
}
