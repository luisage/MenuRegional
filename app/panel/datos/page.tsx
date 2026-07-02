import { redirect } from "next/navigation";
import { obtenerSesionRestauranteId } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";
import { puedeAgregarAvisos, puedeAgregarSucursal } from "@/app/lib/planes";
import DatosForm from "./DatosForm";

export default async function DatosPage({
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
      nombre: true,
      descripcion: true,
      logoUrl: true,
      portadaUrl: true,
      plan: { select: { precio: true, limiteSucursales: true, limitePlatillos: true } },
      sucursales: {
        select: {
          id: true,
          nombre: true,
          calle: true,
          numero: true,
          coloniaId: true,
          telefonoWhatsApp: true,
          envioDomicilio: true,
          costoEnvio: true,
          descripcionEnvio: true,
          rangoEnvio: true,
          latitud: true,
          longitud: true,
          descripcion: true,
          colonia: { select: { id: true, nombre: true, municipioId: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!restaurante) redirect("/");

  const { sucursales } = restaurante;
  if (sucursales.length === 0) redirect("/panel");

  const sucursalSeleccionada =
    sucursales.find((s) => s.id === sucursalIdParam) ?? sucursales[0];

  const municipioId = sucursalSeleccionada.colonia.municipioId;

  const [municipios, colonias, todasCategoriasTipo, categoriasActuales, avisosRaw] = await Promise.all([
    prisma.municipio.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.colonia.findMany({
      where: { municipioId },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.categoriaTipoComida.findMany({
      orderBy: [{ Tipo: "asc" }, { nombre: "asc" }],
      select: { id: true, nombre: true, Tipo: true, icono: true },
    }),
    prisma.restauranteCategoria.findMany({
      where: { restauranteId: restaurante.id },
      select: { categoriaId: true },
    }),
    prisma.aviso.findMany({
      where: { sucursal: { restauranteId: restaurante.id } },
      select: { id: true, descripcion: true, fecha: true, imagenUrl: true, imagenPublicId: true, estatus: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Agrupar avisos creados para múltiples sucursales con el mismo contenido
  type AvisoGroup = { ids: string[]; id: string; descripcion: string; fecha: string | null; imagenUrl: string | null; imagenPublicId: string | null; estatus: boolean };
  const gruposMap = new Map<string, AvisoGroup>();
  for (const a of avisosRaw) {
    const key = `${a.descripcion}|${a.imagenUrl ?? ""}|${a.fecha ?? ""}`;
    const grupo = gruposMap.get(key);
    if (grupo) {
      grupo.ids.push(a.id);
    } else {
      gruposMap.set(key, { ids: [a.id], id: a.id, descripcion: a.descripcion, fecha: a.fecha, imagenUrl: a.imagenUrl, imagenPublicId: a.imagenPublicId ?? null, estatus: a.estatus });
    }
  }
  const avisosIniciales = Array.from(gruposMap.values());

  const planLimites = restaurante.plan
    ? {
        precio: Number(restaurante.plan.precio),
        limiteSucursales: restaurante.plan.limiteSucursales,
        limitePlatillos: restaurante.plan.limitePlatillos,
      }
    : null;
  const permisoAvisos = puedeAgregarAvisos(planLimites);
  const permisoSucursal = puedeAgregarSucursal(planLimites, sucursales.length);

  return (
    <div>
      <p className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-amber">
        Restaurante
      </p>
      <h1 className="mt-2 font-serif text-3xl md:text-4xl font-bold text-cream">
        Editar datos del restaurante
      </h1>
      <p className="mt-2 mb-8 text-sand">
        Actualiza la información de tu restaurante y sucursales.
      </p>

      <DatosForm
        key={sucursalSeleccionada.id}
        restaurante={{
          nombre: restaurante.nombre,
          descripcion: restaurante.descripcion,
          logoUrl: restaurante.logoUrl,
          portadaUrl: restaurante.portadaUrl,
        }}
        avisosIniciales={avisosIniciales}
        todasCategoriasTipo={todasCategoriasTipo}
        categoriasSeleccionadasIds={categoriasActuales.map((c) => c.categoriaId)}
        sucursales={sucursales.map((s) => ({
          id: s.id,
          nombre: s.nombre,
          calle: s.calle,
          numero: s.numero,
          coloniaId: s.coloniaId,
          telefonoWhatsApp: s.telefonoWhatsApp,
          envioDomicilio: s.envioDomicilio,
          costoEnvio: s.costoEnvio != null ? String(s.costoEnvio) : "",
          descripcionEnvio: s.descripcionEnvio ?? "",
          rangoEnvio: s.rangoEnvio != null ? String(s.rangoEnvio) : "",
          latitud: s.latitud != null ? String(s.latitud) : "",
          longitud: s.longitud != null ? String(s.longitud) : "",
          descripcion: s.descripcion ?? "",
          colonia: s.colonia,
        }))}
        sucursalSeleccionadaId={sucursalSeleccionada.id}
        municipios={municipios}
        coloniasIniciales={colonias}
        municipioActualId={municipioId}
        puedeAgregarAvisos={permisoAvisos}
        puedeAgregarSucursal={permisoSucursal}
      />
    </div>
  );
}
