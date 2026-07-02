import { redirect } from "next/navigation";
import { obtenerSesionRestauranteId } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";
import VerMenuClient, { type CategoriaVista } from "./VerMenuClient";

export const metadata = { title: "Ver menú | Panel" };

export default async function VerMenuPage() {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) redirect("/");

  const restaurante = await prisma.restaurante.findUnique({
    where: { cuentaId },
    select: {
      nombre: true,
      logoUrl: true,
      portadaUrl: true,
      categorias: {
        where: { activa: true },
        orderBy: { orden: "asc" },
        select: {
          id: true,
          nombre: true,
          platillos: {
            where: { disponible: true },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              costo: true,
              imagenUrl: true,
            },
          },
        },
      },
    },
  });

  if (!restaurante) redirect("/");

  const categorias: CategoriaVista[] = restaurante.categorias
    .filter((c) => c.platillos.length > 0)
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      platillos: c.platillos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        costo: String(p.costo),
        imagenUrl: p.imagenUrl,
      })),
    }));

  return (
    <div>
      <p className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-amber">
        Panel
      </p>
      <h1 className="mt-2 font-serif text-3xl md:text-4xl font-bold text-cream">
        Ver menú
      </h1>
      <p className="mt-2 mb-8 text-sand font-sans text-sm">
        Así se verá tu menú. Edita o quita platillos directamente desde aquí.
      </p>

      <VerMenuClient
        nombre={restaurante.nombre}
        logoUrl={restaurante.logoUrl}
        portadaUrl={restaurante.portadaUrl}
        categorias={categorias}
      />
    </div>
  );
}
