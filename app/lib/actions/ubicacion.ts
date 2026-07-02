"use server";

import { prisma } from "@/app/lib/prisma";

export async function obtenerColoniasPorMunicipio(municipioId: string) {
  return prisma.colonia.findMany({
    where: { municipioId },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}
