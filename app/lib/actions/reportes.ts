"use server";

import { prisma } from "@/app/lib/prisma";
import { obtenerSesionRestauranteId } from "@/app/lib/session";

async function getRestauranteId(): Promise<string | null> {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) return null;
  const r = await prisma.restaurante.findUnique({ where: { cuentaId }, select: { id: true } });
  return r?.id ?? null;
}

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function buildRango(n: number): { inicio: Date; dias: { key: string; label: string }[] } {
  const inicio = new Date();
  inicio.setUTCDate(inicio.getUTCDate() - (n - 1));
  inicio.setUTCHours(0, 0, 0, 0);

  const dias: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label =
      n === 7
        ? `${DIAS_SEMANA[d.getUTCDay()]} ${d.getUTCDate()}`
        : `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    dias.push({ key, label });
  }

  return { inicio, dias };
}

export type DatoPedidos = { fecha: string; pedidos: number };
export type DatoVentas = { fecha: string; monto: number };
export type DatoPlatillo = { nombre: string; cantidad: number };

export async function obtenerReportePedidos(
  periodo: 7 | 30
): Promise<{ ok: true; datos: DatoPedidos[] } | { error: string }> {
  const restauranteId = await getRestauranteId();
  if (!restauranteId) return { error: "Sesión no válida." };

  const { inicio, dias } = buildRango(periodo);

  const pedidos = await prisma.pedido.findMany({
    where: { restauranteId, createdAt: { gte: inicio } },
    select: { createdAt: true },
  });

  const datos: DatoPedidos[] = dias.map(({ key, label }) => ({
    fecha: label,
    pedidos: pedidos.filter((p) => p.createdAt.toISOString().slice(0, 10) === key).length,
  }));

  return { ok: true, datos };
}

export async function obtenerReporteVentas(
  periodo: 7 | 30
): Promise<{ ok: true; datos: DatoVentas[] } | { error: string }> {
  const restauranteId = await getRestauranteId();
  if (!restauranteId) return { error: "Sesión no válida." };

  const { inicio, dias } = buildRango(periodo);

  const pedidos = await prisma.pedido.findMany({
    where: { restauranteId, createdAt: { gte: inicio } },
    select: { createdAt: true, costoTotal: true },
  });

  const datos: DatoVentas[] = dias.map(({ key, label }) => {
    const monto = pedidos
      .filter((p) => p.createdAt.toISOString().slice(0, 10) === key)
      .reduce((sum, p) => sum + Number(p.costoTotal), 0);
    return { fecha: label, monto: parseFloat(monto.toFixed(2)) };
  });

  return { ok: true, datos };
}

export async function obtenerReportePlatillos(
  periodo: 7 | 30
): Promise<{ ok: true; datos: DatoPlatillo[] } | { error: string }> {
  const restauranteId = await getRestauranteId();
  if (!restauranteId) return { error: "Sesión no válida." };

  const { inicio } = buildRango(periodo);

  const agrupado = await prisma.detallePedido.groupBy({
    by: ["nombrePlatillo"],
    where: {
      pedido: {
        restauranteId,
        createdAt: { gte: inicio },
        estado: { not: "CANCELADO" },
      },
    },
    _sum: { cantidad: true },
    orderBy: { _sum: { cantidad: "desc" } },
    take: 6,
  });

  const datos: DatoPlatillo[] = agrupado.map((g) => ({
    nombre: g.nombrePlatillo,
    cantidad: g._sum.cantidad ?? 0,
  }));

  return { ok: true, datos };
}
