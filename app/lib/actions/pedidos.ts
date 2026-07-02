"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { obtenerSesionRestauranteId } from "@/app/lib/session";
import { rangoFechaMexico } from "@/app/lib/fechas";
import type { EstadoPedido } from "@/app/generated/prisma/enums";

async function obtenerRestauranteId(): Promise<string | null> {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) return null;
  const r = await prisma.restaurante.findUnique({ where: { cuentaId }, select: { id: true } });
  return r?.id ?? null;
}

export type PedidoResumen = {
  id: string;
  folio: number;
  estado: EstadoPedido;
  tipoEnvio: string;
  tipoPago: string;
  costoTotal: string;
  createdAt: string;
  clienteNombre: string;
  clienteCelular: string;
  sucursalNombre: string;
  totalItems: number;
};

export type DetallePedidoVista = {
  id: string;
  nombrePlatillo: string;
  cantidad: number;
  precioUnitario: string;
  costoTotal: string;
  descripcion: string | null;
  extras: { nombreExtra: string; costoExtra: string }[];
};

export type PedidoDetalle = {
  id: string;
  folio: number;
  estado: EstadoPedido;
  tipoEnvio: string;
  tipoPago: string;
  subtotal: string;
  costoEnvio: string;
  propina: string;
  costoTotal: string;
  descripcion: string | null;
  direccionEntrega: string | null;
  telefonoContacto: string | null;
  latitud: number | null;
  longitud: number | null;
  whatsappEnviado: boolean;
  createdAt: string;
  clienteNombre: string;
  clienteCelular: string;
  sucursalNombre: string;
  sucursalWhatsApp: string;
  detalles: DetallePedidoVista[];
};

export async function obtenerPedidos(
  fecha: string,
  estado?: EstadoPedido | "TODOS"
): Promise<{ ok: true; pedidos: PedidoResumen[] } | { error: string }> {
  const restauranteId = await obtenerRestauranteId();
  if (!restauranteId) return { error: "Sesión no válida." };

  const { inicio, fin } = rangoFechaMexico(fecha);

  const pedidos = await prisma.pedido.findMany({
    where: {
      restauranteId,
      createdAt: { gte: inicio, lte: fin },
      ...(estado && estado !== "TODOS" ? { estado } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      folio: true,
      estado: true,
      tipoEnvio: true,
      tipoPago: true,
      costoTotal: true,
      createdAt: true,
      nombreCliente: true,
      cliente: { select: { nombre: true, celular: true } },
      sucursal: { select: { nombre: true } },
      _count: { select: { detalles: true } },
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
      costoTotal: String(p.costoTotal),
      createdAt: p.createdAt.toISOString(),
      clienteNombre: p.nombreCliente ?? p.cliente?.nombre ?? "Cliente invitado",
      clienteCelular: p.cliente?.celular ?? "—",
      sucursalNombre: p.sucursal.nombre,
      totalItems: p._count.detalles,
    })),
  };
}

export async function obtenerDetallePedido(
  pedidoId: string
): Promise<{ ok: true; pedido: PedidoDetalle } | { error: string }> {
  const restauranteId = await obtenerRestauranteId();
  if (!restauranteId) return { error: "Sesión no válida." };

  const p = await prisma.pedido.findFirst({
    where: { id: pedidoId, restauranteId },
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
      direccionEntrega: true,
      telefonoContacto: true,
      latitud: true,
      longitud: true,
      nombreCliente: true,
      whatsappEnviado: true,
      createdAt: true,
      cliente: { select: { nombre: true, celular: true } },
      sucursal: { select: { nombre: true, telefonoWhatsApp: true } },
      detalles: {
        select: {
          id: true,
          nombrePlatillo: true,
          cantidad: true,
          precioUnitario: true,
          costoTotal: true,
          descripcion: true,
          extras: { select: { nombreExtra: true, costoExtra: true } },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!p) return { error: "Pedido no encontrado." };

  return {
    ok: true,
    pedido: {
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
      direccionEntrega: p.direccionEntrega,
      telefonoContacto: p.telefonoContacto,
      latitud: p.latitud !== null ? Number(p.latitud) : null,
      longitud: p.longitud !== null ? Number(p.longitud) : null,
      whatsappEnviado: p.whatsappEnviado,
      createdAt: p.createdAt.toISOString(),
      clienteNombre: p.nombreCliente ?? p.cliente?.nombre ?? "Cliente invitado",
      clienteCelular: p.cliente?.celular ?? "—",
      sucursalNombre: p.sucursal.nombre,
      sucursalWhatsApp: p.sucursal.telefonoWhatsApp,
      detalles: p.detalles.map((d) => ({
        id: d.id,
        nombrePlatillo: d.nombrePlatillo,
        cantidad: d.cantidad,
        precioUnitario: String(d.precioUnitario),
        costoTotal: String(d.costoTotal),
        descripcion: d.descripcion,
        extras: d.extras.map((e) => ({
          nombreExtra: e.nombreExtra,
          costoExtra: String(e.costoExtra),
        })),
      })),
    },
  };
}

export async function cambiarEstadoPedido(
  pedidoId: string,
  nuevoEstado: EstadoPedido
): Promise<{ ok: true } | { error: string }> {
  const restauranteId = await obtenerRestauranteId();
  if (!restauranteId) return { error: "Sesión no válida." };

  const pedido = await prisma.pedido.findFirst({
    where: { id: pedidoId, restauranteId },
    select: { id: true },
  });
  if (!pedido) return { error: "Pedido no encontrado." };

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { estado: nuevoEstado },
  });

  revalidatePath("/panel/pedidos");
  return { ok: true };
}
