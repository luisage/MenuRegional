import { prisma } from "@/app/lib/prisma";
import MunicipiosClient, {
  type EstadoRow,
  type MunicipioRow,
  type ColoniaRow,
} from "./MunicipiosClient";

export default async function MunicipiosPage() {
  const [estados, municipios, colonias] = await Promise.all([
    prisma.estado.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, activo: true },
    }),
    prisma.municipio.findMany({
      orderBy: [{ estado: { nombre: "asc" } }, { nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        activo: true,
        estadoId: true,
        estado: { select: { nombre: true } },
      },
    }),
    prisma.colonia.findMany({
      orderBy: [{ municipio: { nombre: "asc" } }, { nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        activo: true,
        municipioId: true,
        municipio: {
          select: {
            nombre: true,
            estadoId: true,
            estado: { select: { nombre: true } },
          },
        },
      },
    }),
  ]);

  const estadosRows: EstadoRow[] = estados.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    activo: e.activo,
  }));

  const municipiosRows: MunicipioRow[] = municipios.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    activo: m.activo,
    estadoId: m.estadoId,
    estadoNombre: m.estado.nombre,
  }));

  const coloniasRows: ColoniaRow[] = colonias.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    activo: c.activo,
    municipioId: c.municipioId,
    municipioNombre: c.municipio.nombre,
    estadoId: c.municipio.estadoId,
    estadoNombre: c.municipio.estado.nombre,
  }));

  return (
    <MunicipiosClient
      estados={estadosRows}
      municipios={municipiosRows}
      colonias={coloniasRows}
    />
  );
}
