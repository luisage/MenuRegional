import { prisma } from "@/app/lib/prisma";
import RestaurantesAdminClient, { type RestauranteAdminVista, type PlanOpcion } from "./RestaurantesAdminClient";

export const metadata = { title: "Gestionar restaurantes | Configuración" };

export default async function RestaurantesAdminPage() {
  const [restaurantesRaw, planesRaw] = await Promise.all([
    prisma.restaurante.findMany({
      select: {
        id: true,
        nombre: true,
        slug: true,
        activo: true,
        createdAt: true,
        cuenta: { select: { nombreDueno: true, usuario: true, celular: true } },
        _count: { select: { sucursales: true } },
        planId: true,
        plan: { select: { nombre: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.plan.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { precio: "asc" },
    }),
  ]);

  const restaurantes: RestauranteAdminVista[] = restaurantesRaw.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    slug: r.slug,
    activo: r.activo,
    sucursales: r._count.sucursales,
    dueno: r.cuenta.nombreDueno,
    contacto: r.cuenta.celular,
    planId: r.planId,
    planNombre: r.plan?.nombre ?? null,
  }));

  const planes: PlanOpcion[] = planesRaw;

  return (
    <div>
      <p className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-amber">
        Configuración
      </p>
      <h1 className="mt-2 font-serif text-3xl md:text-4xl font-bold text-cream">
        Gestionar restaurantes
      </h1>
      <p className="mt-2 mb-8 text-sand">
        Busca un restaurante y gestiona su plan o estatus en la plataforma.
      </p>

      <RestaurantesAdminClient restaurantes={restaurantes} planes={planes} />
    </div>
  );
}
