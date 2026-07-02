import { redirect } from "next/navigation";
import { obtenerSesionAdminId } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";
import ConfiguracionShell from "../ConfiguracionShell";

export default async function ConfiguracionProtegidoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminId = await obtenerSesionAdminId();
  if (!adminId) redirect("/configuracion");

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { usuario: true, nombre: true, estatus: true },
  });

  if (!admin || !admin.estatus) redirect("/configuracion");

  const nombreAdmin = admin.nombre?.trim() || admin.usuario;

  return <ConfiguracionShell nombreAdmin={nombreAdmin}>{children}</ConfiguracionShell>;
}
