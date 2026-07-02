"use server";

import { DiaSemana } from "@/app/generated/prisma/client";
import { prisma } from "@/app/lib/prisma";
import { obtenerSesionRestauranteId } from "@/app/lib/session";

const HORA_REGEX = /^\d{2}:\d{2}$/;

type HorarioInput = {
  dia: DiaSemana;
  apertura: string;
  cierre: string;
  abierto: boolean;
};

export async function guardarHorarios(
  sucursalId: string,
  horarios: HorarioInput[]
): Promise<{ ok: true } | { error: string }> {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) return { error: "Sesión no válida." };

  // Verificar que la sucursal pertenece al restaurante del usuario en sesión
  const sucursal = await prisma.sucursal.findUnique({
    where: { id: sucursalId },
    select: { restaurante: { select: { cuentaId: true } } },
  });

  if (!sucursal || sucursal.restaurante.cuentaId !== cuentaId) {
    return { error: "No tienes permiso para editar esta sucursal." };
  }

  for (const h of horarios) {
    if (h.abierto && (!HORA_REGEX.test(h.apertura) || !HORA_REGEX.test(h.cierre))) {
      return { error: `Formato de hora inválido para ${h.dia}.` };
    }
  }

  await prisma.$transaction(
    horarios.map(({ dia, apertura, cierre, abierto }) =>
      prisma.horarioSucursal.upsert({
        where: { sucursalId_dia: { sucursalId, dia } },
        update: { apertura, cierre, abierto },
        create: { sucursalId, dia, apertura, cierre, abierto },
      })
    )
  );

  return { ok: true };
}
