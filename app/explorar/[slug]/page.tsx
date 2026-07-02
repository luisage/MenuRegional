import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { calcularSucursalAbierta } from "@/app/lib/horario";
import { obtenerSesionClienteId } from "@/app/lib/session";
import { obtenerMunicipios } from "@/app/lib/actions/clienteAuth";

import RestauranteMenuClient from "./RestauranteMenuClient";
import type { AvisoVista } from "./AvisosCarousel";

export type CuentaClienteVista = {
  nombre: string;
  celular: string;
  latitud: number | null;
  longitud: number | null;
};

export type SucursalVista = {
  id: string;
  nombre: string;
  telefonoWhatsApp: string;
  envioDomicilio: boolean;
  costoEnvio: string | null;
  rangoEnvio: string | null;
  latitud: number | null;
  longitud: number | null;
  direccion: string;
};

export type IngredienteVista = {
  id: string;
  nombre: string;
  opcional: boolean;
};

export type ExtraVista = {
  id: string;
  nombre: string;
  costo: string;
  descripcion: string | null;
};

export type PlatilloVistaPublica = {
  id: string;
  nombre: string;
  descripcion: string | null;
  costo: string;
  imagenUrl: string | null;
  ingredientes: IngredienteVista[];
  extras: ExtraVista[];
};

export type CategoriaVistaPublica = {
  id: string;
  nombre: string;
  platillos: PlatilloVistaPublica[];
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await prisma.restaurante.findUnique({
    where: { slug },
    select: { nombre: true },
  });
  return {
    title: r ? `${r.nombre} | Menú Regional` : "Restaurante | Menú Regional",
  };
}

export default async function RestauranteMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sucursalId?: string; platilloId?: string }>;
}) {
  const { slug } = await params;
  const { sucursalId: sucursalIdParam, platilloId: platilloDestacadoId } = await searchParams;

  const [clienteId, municipios, restaurante] = await Promise.all([
    obtenerSesionClienteId(),
    obtenerMunicipios(),
    prisma.restaurante.findUnique({
      where: { slug, activo: true },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        logoUrl: true,
        portadaUrl: true,
        plan: { select: { limiteSucursales: true, limitePlatillos: true, avisos: true } },
        sucursales: {
          where: { activa: true },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            nombre: true,
            telefonoWhatsApp: true,
            envioDomicilio: true,
            costoEnvio: true,
            rangoEnvio: true,
            latitud: true,
            longitud: true,
            calle: true,
            numero: true,
            colonia: { select: { nombre: true, municipio: { select: { nombre: true } } } },
            horarios: {
              select: { dia: true, apertura: true, cierre: true, abierto: true },
            },
          },
        },
      },
    }),
  ]);

  if (!restaurante) notFound();

  // Lee los límites directamente de la BD. -1 = infinito. Sin plan = valores más restrictivos.
  const plan = restaurante.plan;

  const maxSucursales: number | null =
    !plan                           ? 1    // sin plan asignado → tratar como el más restrictivo
    : plan.limiteSucursales === -1  ? null // -1 = sin límite
    : (plan.limiteSucursales ?? 1);        // cualquier otro número (o null si el campo es null)

  const maxPlatillos: number | null =
    !plan                          ? 10   // sin plan → más restrictivo
    : plan.limitePlatillos === -1  ? null // -1 = sin límite
    : (plan.limitePlatillos ?? 10);

  const mostrarAvisos: boolean = plan?.avisos ?? false; // sin plan → no mostrar avisos

  const sucursalesVisibles =
    maxSucursales === null
      ? restaurante.sucursales
      : restaurante.sucursales.slice(0, maxSucursales);

  const sucursalSeleccionada =
    sucursalesVisibles.find((s) => s.id === sucursalIdParam) ?? sucursalesVisibles[0] ?? null;

  const sucursales: SucursalVista[] = sucursalesVisibles.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    telefonoWhatsApp: s.telefonoWhatsApp,
    envioDomicilio: s.envioDomicilio,
    costoEnvio: s.costoEnvio !== null ? String(s.costoEnvio) : null,
    rangoEnvio: s.rangoEnvio !== null ? String(s.rangoEnvio) : null,
    latitud: s.latitud !== null ? Number(s.latitud) : null,
    longitud: s.longitud !== null ? Number(s.longitud) : null,
    direccion: `${s.calle} ${s.numero}, ${s.colonia.nombre}, ${s.colonia.municipio.nombre}`,
  }));

  const sucursal: SucursalVista | null = sucursalSeleccionada
    ? sucursales.find((s) => s.id === sucursalSeleccionada.id) ?? null
    : null;

  const sucursalAbierta = sucursalSeleccionada
    ? calcularSucursalAbierta(sucursalSeleccionada.horarios)
    : false;

  const [avisosRaw, categoriasRaw, cuentaClienteRaw] = await Promise.all([
    sucursalSeleccionada && mostrarAvisos
      ? prisma.aviso.findMany({
          where: { sucursalId: sucursalSeleccionada.id, estatus: true },
          orderBy: { createdAt: "desc" },
          select: { id: true, descripcion: true, fecha: true, imagenUrl: true },
        })
      : Promise.resolve([]),
    sucursalSeleccionada
      ? prisma.categoriaComida.findMany({
          where: { restauranteId: restaurante.id, activa: true },
          orderBy: { orden: "asc" },
          select: {
            id: true,
            nombre: true,
            platillos: {
              where: { disponible: true },
              orderBy: { nombre: "asc" },
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                costo: true,
                imagenUrl: true,
                ingredientes: {
                  select: {
                    id: true,
                    opcional: true,
                    ingrediente: { select: { nombre: true } },
                  },
                },
                extras: {
                  where: { disponible: true },
                  select: {
                    id: true,
                    nombre: true,
                    costo: true,
                    descripcion: true,
                  },
                },
                // Disponibilidad/precio especial para la sucursal seleccionada.
                // Si no hay override registrado, el platillo se considera disponible
                // en todas las sucursales con su precio base.
                sucursales: {
                  where: { sucursalId: sucursalSeleccionada.id },
                  select: { disponible: true, precioEspecial: true },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
    clienteId
      ? prisma.cuentaCliente.findUnique({
          where: { id: clienteId, activa: true },
          select: { nombre: true, celular: true, latitud: true, longitud: true },
        })
      : Promise.resolve(null),
  ]);

  const cuentaCliente: CuentaClienteVista | null = cuentaClienteRaw
    ? {
        nombre: cuentaClienteRaw.nombre,
        celular: cuentaClienteRaw.celular,
        latitud: cuentaClienteRaw.latitud !== null ? Number(cuentaClienteRaw.latitud) : null,
        longitud: cuentaClienteRaw.longitud !== null ? Number(cuentaClienteRaw.longitud) : null,
      }
    : null;

  const avisos: AvisoVista[] = avisosRaw;

  const categorias: CategoriaVistaPublica[] = categoriasRaw
    .reduce<{ count: number; list: CategoriaVistaPublica[] }>(
      (acc, c) => {
        const platillosMapeados = c.platillos
          .map((p) => {
            const override = p.sucursales[0];
            const disponibleEnSucursal = override ? override.disponible : true;
            if (!disponibleEnSucursal) return null;
            const costoEfectivo = override?.precioEspecial ?? p.costo;
            return {
              id: p.id,
              nombre: p.nombre,
              descripcion: p.descripcion,
              costo: String(costoEfectivo),
              imagenUrl: p.imagenUrl,
              ingredientes: p.ingredientes.map((i) => ({
                id: i.id,
                nombre: i.ingrediente.nombre,
                opcional: i.opcional,
              })),
              extras: p.extras.map((e) => ({
                id: e.id,
                nombre: e.nombre,
                costo: String(e.costo),
                descripcion: e.descripcion,
              })),
            };
          })
          .filter((p): p is PlatilloVistaPublica => p !== null);

        // Aplicar límite global de platillos entre todas las categorías
        const platillosVisibles =
          maxPlatillos === null
            ? platillosMapeados
            : platillosMapeados.slice(0, Math.max(0, maxPlatillos - acc.count));

        if (platillosVisibles.length === 0) return acc;

        return {
          count: acc.count + platillosVisibles.length,
          list: [...acc.list, { id: c.id, nombre: c.nombre, platillos: platillosVisibles }],
        };
      },
      { count: 0, list: [] }
    ).list;

  return (
    <RestauranteMenuClient
      key={sucursal?.id ?? "sin-sucursal"}
      nombre={restaurante.nombre}
      descripcion={restaurante.descripcion}
      logoUrl={restaurante.logoUrl}
      portadaUrl={restaurante.portadaUrl}
      categorias={categorias}
      sucursal={sucursal}
      sucursales={sucursales}
      sucursalAbierta={sucursalAbierta}
      avisos={avisos}
      platilloDestacadoId={platilloDestacadoId ?? null}
      cuentaCliente={cuentaCliente}
      municipios={municipios}
    />
  );
}
