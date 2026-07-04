import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { obtenerSesionRestauranteId } from "@/app/lib/session";
import QrMenuClient, { type SucursalQr } from "./QrMenuClient";

export default async function QrPage() {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) redirect("/");

  const restaurante = await prisma.restaurante.findUnique({
    where: { cuentaId },
    select: {
      nombre: true,
      slug: true,
      logoUrl: true,
      sucursales: {
        where: { activa: true },
        orderBy: { createdAt: "asc" },
        select: { id: true, nombre: true, slug: true },
      },
    },
  });

  if (!restaurante) redirect("/");

  const sucursales: SucursalQr[] = restaurante.sucursales.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    slug: s.slug,
  }));

  return (
    <QrMenuClient
      restauranteNombre={restaurante.nombre}
      restauranteSlug={restaurante.slug}
      logoUrl={restaurante.logoUrl}
      sucursales={sucursales}
    />
  );
}
