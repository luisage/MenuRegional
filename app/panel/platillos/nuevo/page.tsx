import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { obtenerSesionRestauranteId } from "@/app/lib/session";
import { esPlanGratis, puedeAgregarPlatillo } from "@/app/lib/planes";
import RegistrarMenuClient, {
  type CategoriaItem,
  type PlatilloItem,
  type SucursalItem,
} from "./RegistrarMenuClient";

export const metadata = { title: "Registrar menú | Panel" };

export default async function RegistrarMenuPage() {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) redirect("/");

  const restaurante = await prisma.restaurante.findUnique({
    where: { cuentaId },
    select: {
      id: true,
      plan: { select: { precio: true, limiteSucursales: true, limitePlatillos: true } },
      categorias: {
        where: { activa: true },
        orderBy: { orden: "asc" },
        select: { id: true, nombre: true, descripcion: true, orden: true },
      },
      platillos: {
        orderBy: [{ disponible: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          costo: true,
          imagenUrl: true,
          disponible: true,
          categoriaId: true,
          categoria: { select: { nombre: true } },
        },
      },
      sucursales: {
        where: { activa: true },
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true },
      },
    },
  });

  if (!restaurante) redirect("/");

  const categorias: CategoriaItem[] = restaurante.categorias.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    orden: c.orden,
  }));

  const platillos: PlatilloItem[] = restaurante.platillos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    costo: String(p.costo),
    imagenUrl: p.imagenUrl,
    disponible: p.disponible,
    categoriaId: p.categoriaId,
    categoriaNombre: p.categoria.nombre,
  }));

  const sucursales: SucursalItem[] = restaurante.sucursales.map((s) => ({
    id: s.id,
    nombre: s.nombre,
  }));

  const planLimites = restaurante.plan
    ? {
        precio: Number(restaurante.plan.precio),
        limiteSucursales: restaurante.plan.limiteSucursales,
        limitePlatillos: restaurante.plan.limitePlatillos,
      }
    : null;
  const mostrarBannerGratis = esPlanGratis(planLimites);
  const permisoAgregarPlatillo = puedeAgregarPlatillo(planLimites, restaurante.platillos.length);

  return (
    <RegistrarMenuClient
      categorias={categorias}
      platillos={platillos}
      sucursales={sucursales}
      mostrarBannerGratis={mostrarBannerGratis}
      puedeAgregarPlatillo={permisoAgregarPlatillo}
    />
  );
}
