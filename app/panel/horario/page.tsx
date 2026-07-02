import { redirect } from "next/navigation";
import { obtenerSesionRestauranteId } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";
import HorarioForm from "./HorarioForm";

export default async function HorarioPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursalId?: string }>;
}) {
  const { sucursalId: sucursalIdParam } = await searchParams;

  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) redirect("/");

  const restaurante = await prisma.restaurante.findUnique({
    where: { cuentaId },
    select: {
      id: true,
      sucursales: {
        select: { id: true, nombre: true, calle: true, numero: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!restaurante) redirect("/");

  const sucursales = restaurante.sucursales;

  if (sucursales.length === 0) {
    return (
      <div>
        <p className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-amber">
          Horarios
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-cream">
          Registrar horario
        </h1>
        <div className="mt-8 rounded-2xl border border-dashed border-cream/15 bg-wood/30 p-10 text-center">
          <p className="font-serif text-xl font-bold text-cream">Sin sucursales</p>
          <p className="mt-2 text-sand">
            Registra al menos una sucursal para poder configurar sus horarios.
          </p>
        </div>
      </div>
    );
  }

  const sucursalSeleccionada =
    sucursales.find((s) => s.id === sucursalIdParam) ?? sucursales[0];

  const horariosExistentes = await prisma.horarioSucursal.findMany({
    where: { sucursalId: sucursalSeleccionada.id },
    select: { dia: true, apertura: true, cierre: true, abierto: true },
  });

  return (
    <div>
      <p className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-amber">
        Sucursales
      </p>
      <h1 className="mt-2 font-serif text-3xl md:text-4xl font-bold text-cream">
        Registrar horario
      </h1>
      <p className="mt-2 mb-8 text-sand">
        Define los días y horarios de atención de cada sucursal.
      </p>

      <HorarioForm
        key={sucursalSeleccionada.id}
        sucursales={sucursales}
        sucursalSeleccionadaId={sucursalSeleccionada.id}
        horariosExistentes={horariosExistentes}
      />
    </div>
  );
}
