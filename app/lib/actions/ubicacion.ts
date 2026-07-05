"use server";

import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/app/lib/prisma";

export async function obtenerColoniasPorMunicipio(municipioId: string) {
  noStore();
  return prisma.colonia.findMany({
    where: { municipioId },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}
