import { redirect } from "next/navigation";
import { obtenerSesionRestauranteId } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";
import PanelShell from "./PanelShell";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) redirect("/");

  const restaurante = await prisma.restaurante.findUnique({
    where: { cuentaId },
    select: { nombre: true, logoUrl: true },
  });

  if (!restaurante) redirect("/");

  return (
    <PanelShell nombreRestaurante={restaurante.nombre} logoUrl={restaurante.logoUrl}>
      {children}
    </PanelShell>
  );
}
