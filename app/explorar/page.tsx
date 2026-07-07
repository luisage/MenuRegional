import type { Metadata } from "next";
import { prisma } from "@/app/lib/prisma";
import { calcularSucursalAbierta } from "@/app/lib/horario";
import { obtenerSesionClienteId } from "@/app/lib/session";
import { obtenerMunicipios } from "@/app/lib/actions/clienteAuth";
import ExplorarClient from "./ExplorarClient";
import type { AvisoVista } from "./[slug]/AvisosCarousel";

export const metadata: Metadata = {
  title: "Explorar restaurantes | Menú Regional",
  description:
    "Descubre restaurantes y platillos de tu región. Arma tu pedido fácilmente.",
};

export type RestauranteExplora = {
  id: string;
  nombre: string;
  logoUrl: string | null;
  slug: string;
  tiposComida: string[];
  categoriasMenu: string[];
  colonias: string[];
  colonia: string | null;
  envioDomicilio: boolean;
  abierto: boolean;
};

export type PlatilloExplora = {
  id: string;
  nombre: string;
  descripcion: string | null;
  costo: string;
  imagenUrl: string | null;
  restauranteNombre: string;
  restauranteSlug: string;
};

const MAX_PLATILLOS = 20;
const PLATILLOS_POR_RESTAURANTE = 2;
const MAX_PROMOCIONES = 15;

function mezclar<T>(items: T[]): T[] {
  const copia = [...items];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export default async function ExplorarPage({
  searchParams,
}: {
  searchParams: Promise<{ destacado?: string }>;
}) {
  const { destacado } = await searchParams;

  const [clienteId, municipios] = await Promise.all([
    obtenerSesionClienteId(),
    obtenerMunicipios(),
  ]);
  const clienteLogueado = clienteId !== null;

  let primerNombre: string | null = null;
  if (clienteId) {
    const cuenta = await prisma.cuentaCliente.findUnique({
      where: { id: clienteId },
      select: { nombre: true },
    });
    primerNombre = cuenta?.nombre
      ? cuenta.nombre.trim().split(/\s+/)[0]
      : null;
  }

  const restaurantesRaw = await prisma.restaurante.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
      logoUrl: true,
      slug: true,
      categoriasTipo: {
        select: { categoria: { select: { nombre: true } } },
      },
      categorias: {
        where: { activa: true },
        select: { nombre: true },
      },
      sucursales: {
        where: { activa: true },
        select: {
          id: true,
          envioDomicilio: true,
          colonia: { select: { nombre: true } },
          horarios: {
            select: { dia: true, apertura: true, cierre: true, abierto: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      platillos: {
        where: { disponible: true },
        select: { id: true, nombre: true, descripcion: true, costo: true, imagenUrl: true },
      },
      plan: { select: { avisos: true } },
    },
    orderBy: { nombre: "asc" },
  });

  const restaurantes: RestauranteExplora[] = restaurantesRaw.map((r) => {
    const colonias = [...new Set(r.sucursales.map((s) => s.colonia.nombre))];
    return {
      id: r.id,
      nombre: r.nombre,
      logoUrl: r.logoUrl,
      slug: r.slug,
      tiposComida: r.categoriasTipo.map((ct) => ct.categoria.nombre),
      categoriasMenu: r.categorias.map((c) => c.nombre),
      colonias,
      colonia: colonias[0] ?? null,
      envioDomicilio: r.sucursales.some((s) => s.envioDomicilio),
      abierto: r.sucursales.some((s) => calcularSucursalAbierta(s.horarios)),
    };
  });

  // Si viene ?destacado=slug, poner ese restaurante primero en la lista
  if (destacado) {
    const idx = restaurantes.findIndex((r) => r.slug === destacado);
    if (idx > 0) {
      const [dest] = restaurantes.splice(idx, 1);
      restaurantes.unshift(dest);
    }
  }

  // ── Platillos del día: solo de restaurantes abiertos ahora, 2 por restaurante, máx. 20 ──
  const restaurantesAbiertos = mezclar(
    restaurantesRaw.filter((r) => r.sucursales.some((s) => calcularSucursalAbierta(s.horarios)))
  );

  const platillos: PlatilloExplora[] = [];
  for (const r of restaurantesAbiertos) {
    if (platillos.length >= MAX_PLATILLOS) break;
    const elegidos = mezclar(r.platillos).slice(0, PLATILLOS_POR_RESTAURANTE);
    for (const p of elegidos) {
      if (platillos.length >= MAX_PLATILLOS) break;
      platillos.push({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        costo: String(p.costo),
        imagenUrl: p.imagenUrl,
        restauranteNombre: r.nombre,
        restauranteSlug: r.slug,
      });
    }
  }

  // ── Promociones: avisos de sucursales abiertas ahora, máx. 15 ──
  // Solo incluye restaurantes cuyo plan tiene avisos = true (o sin plan = false por defecto)
  const sucursalesAbiertasIds = restaurantesRaw
    .filter((r) => r.plan?.avisos === true)
    .flatMap((r) => r.sucursales)
    .filter((s) => calcularSucursalAbierta(s.horarios))
    .map((s) => s.id);

  const avisosRaw = sucursalesAbiertasIds.length
    ? await prisma.aviso.findMany({
        where: { estatus: true, sucursalId: { in: sucursalesAbiertasIds } },
        orderBy: { createdAt: "desc" },
        select: { id: true, descripcion: true, fecha: true, imagenUrl: true },
      })
    : [];

  const promociones: AvisoVista[] =
    avisosRaw.length > MAX_PROMOCIONES ? mezclar(avisosRaw).slice(0, MAX_PROMOCIONES) : avisosRaw;

  return (
    <ExplorarClient
      restaurantes={restaurantes}
      platillos={platillos}
      promociones={promociones}
      clienteLogueado={clienteLogueado}
      primerNombre={primerNombre}
      municipios={municipios}
    />
  );
}
