"use server";

import { prisma } from "@/app/lib/prisma";
import { obtenerSesionClienteId } from "@/app/lib/session";
import type { TipoEnvio, TipoPago } from "@/app/generated/prisma/enums";

export type ItemPedidoInput = {
  platilloId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  costoTotal: number;
  descripcion: string | null;
  extras: { extraId: string; nombre: string; costo: number }[];
};

export type CrearPedidoInput = {
  sucursalId: string;
  tipoPago: TipoPago;
  tipoEnvio: TipoEnvio;
  subtotal: number;
  costoEnvio: number;
  propina: number;
  costoTotal: number;
  descripcion: string | null;
  latitud: number | null;
  longitud: number | null;
  telefonoContacto: string | null;
  nombreCliente: string | null;
  items: ItemPedidoInput[];
};

export async function crearPedido(
  input: CrearPedidoInput
): Promise<{ ok: true; pedidoId: string } | { error: string }> {
  const clienteId = await obtenerSesionClienteId();

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: input.sucursalId },
    select: { restauranteId: true },
  });
  if (!sucursal) return { error: "Sucursal no encontrada." };

  try {
    const pedido = await prisma.$transaction(async (tx) => {
      const p = await tx.pedido.create({
        data: {
          estado: "PENDIENTE",
          tipoEnvio: input.tipoEnvio,
          tipoPago: input.tipoPago,
          subtotal: input.subtotal.toFixed(2),
          costoEnvio: input.costoEnvio.toFixed(2),
          propina: input.propina.toFixed(2),
          costoTotal: input.costoTotal.toFixed(2),
          descripcion: input.descripcion || null,
          latitud: input.latitud,
          longitud: input.longitud,
          telefonoContacto: input.telefonoContacto || null,
          nombreCliente: input.nombreCliente || null,
          whatsappEnviado: true,
          clienteId: clienteId ?? undefined,
          restauranteId: sucursal.restauranteId,
          sucursalId: input.sucursalId,
        },
      });

      for (const item of input.items) {
        const detalle = await tx.detallePedido.create({
          data: {
            pedidoId: p.id,
            platilloId: item.platilloId || null,
            nombrePlatillo: item.nombre,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario.toFixed(2),
            costoTotal: item.costoTotal.toFixed(2),
            descripcion: item.descripcion,
          },
        });

        if (item.extras.length > 0) {
          await tx.detallePedidoExtra.createMany({
            data: item.extras.map((e) => ({
              detalleId: detalle.id,
              extraId: e.extraId || null,
              nombreExtra: e.nombre,
              costoExtra: e.costo.toFixed(2),
            })),
          });
        }
      }

      return p;
    });

    return { ok: true, pedidoId: pedido.id };
  } catch (err) {
    console.error("Error al guardar pedido:", err);
    return { error: "No se pudo guardar el pedido. Intenta de nuevo." };
  }
}
