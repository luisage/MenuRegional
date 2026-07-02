import { redirect } from "next/navigation";
import { obtenerSesionRestauranteId } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";
import { esPlanGratis } from "@/app/lib/planes";
import ReportesClient from "./ReportesClient";

export default async function ReportesPage() {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) redirect("/");

  const restaurante = await prisma.restaurante.findUnique({
    where: { cuentaId },
    select: { plan: { select: { precio: true, limiteSucursales: true, limitePlatillos: true } } },
  });

  if (!restaurante) redirect("/");

  const planLimites = restaurante.plan
    ? {
        precio: Number(restaurante.plan.precio),
        limiteSucursales: restaurante.plan.limiteSucursales,
        limitePlatillos: restaurante.plan.limitePlatillos,
      }
    : null;

  return <ReportesClient esGratis={esPlanGratis(planLimites)} />;
}
