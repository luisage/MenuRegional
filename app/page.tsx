import Hero from "./components/Hero";
import Restaurantes from "./components/Restaurantes";
import type { RestauranteHome } from "./components/Restaurantes";
import Platillos from "./components/Platillos";
import type { PlatilloHome } from "./components/Platillos";
import Nosotros from "./components/Nosotros";
import RegistroUsuario from "./components/RegistroUsuario";
import RegistroRestaurante from "./components/RegistroRestaurante";
import Contacto from "./components/Contacto";
import Footer from "./components/Footer";
import { prisma } from "@/app/lib/prisma";
import { calcularSucursalAbierta } from "@/app/lib/horario";

const MAX_PLATILLOS_HOME = 10;
const PLATILLOS_POR_REST_HOME = 2;

function mezclar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export default async function Home() {
  const [municipios, restaurantesRaw] = await Promise.all([
    prisma.municipio.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.restaurante.findMany({
      where: { activo: true },
      select: {
        nombre: true,
        slug: true,
        logoUrl: true,
        portadaUrl: true,
        categoriasTipo: {
          select: { categoria: { select: { nombre: true } } },
        },
        sucursales: {
          where: { activa: true },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: {
            horarios: {
              select: { dia: true, apertura: true, cierre: true, abierto: true },
            },
          },
        },
        platillos: {
          where: { disponible: true },
          select: { id: true, nombre: true, imagenUrl: true, costo: true },
        },
      },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const restaurantesHome: RestauranteHome[] = restaurantesRaw.map((r) => ({
    nombre: r.nombre,
    slug: r.slug,
    logoUrl: r.logoUrl,
    portadaUrl: r.portadaUrl,
    categorias: r.categoriasTipo.map((ct) => ct.categoria.nombre),
    abierto: r.sucursales.length > 0 && calcularSucursalAbierta(r.sucursales[0].horarios),
  }));

  // Máx 2 platillos por restaurante, máx 10 en total, orden aleatorio
  const platillosHome: PlatilloHome[] = [];
  for (const r of mezclar(restaurantesRaw)) {
    if (platillosHome.length >= MAX_PLATILLOS_HOME) break;
    const elegidos = mezclar(r.platillos).slice(0, PLATILLOS_POR_REST_HOME);
    for (const p of elegidos) {
      if (platillosHome.length >= MAX_PLATILLOS_HOME) break;
      platillosHome.push({
        id: p.id,
        nombre: p.nombre,
        imagenUrl: p.imagenUrl,
        costo: String(p.costo),
        restauranteNombre: r.nombre,
        restauranteSlug: r.slug,
      });
    }
  }

  const municipioPorDefecto =
    municipios.find((m) => m.nombre === "Atitalaquia") ?? municipios[0] ?? null;

  const coloniasPorDefecto = municipioPorDefecto
    ? await prisma.colonia.findMany({
        where: { municipioId: municipioPorDefecto.id },
        select: { id: true, nombre: true },
        orderBy: { nombre: "asc" },
      })
    : [];

  return (
    <>
      <Hero />
      <Restaurantes restaurantes={restaurantesHome} />
      <Platillos platillos={platillosHome} />
      <Nosotros />
      <RegistroUsuario />
      <RegistroRestaurante
        municipios={municipios}
        colonias={coloniasPorDefecto}
        municipioPorDefectoId={municipioPorDefecto?.id ?? null}
      />
      <Contacto />
      <Footer />
    </>
  );
}
