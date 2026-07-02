import { prisma } from "@/app/lib/prisma";
import CatalogoClient, {
  type CategoriaComidaRow,
  type CategoriaTipoRow,
  type IngredienteRow,
  type ExtraRow,
  type RestauranteOpcion,
  type PlatilloOpcion,
} from "./CatalogoClient";

export default async function CatalogoPage() {
  const [
    categoriasComida,
    categoriasTipo,
    ingredientes,
    extras,
    restaurantes,
    platillos,
  ] = await Promise.all([
    prisma.categoriaComida.findMany({
      orderBy: [{ restaurante: { nombre: "asc" } }, { orden: "asc" }],
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        orden: true,
        activa: true,
        restauranteId: true,
        restaurante: { select: { nombre: true } },
      },
    }),
    prisma.categoriaTipoComida.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, Tipo: true, slug: true, icono: true, activo: true },
    }),
    prisma.ingrediente.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, activo: true },
    }),
    prisma.extra.findMany({
      orderBy: [{ platillo: { nombre: "asc" } }, { nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        costo: true,
        descripcion: true,
        disponible: true,
        platilloId: true,
        platillo: {
          select: {
            nombre: true,
            restaurante: { select: { nombre: true } },
          },
        },
      },
    }),
    prisma.restaurante.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.platillo.findMany({
      orderBy: [{ restaurante: { nombre: "asc" } }, { nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        restaurante: { select: { id: true, nombre: true } },
      },
    }),
  ]);

  const categoriasComidaRows: CategoriaComidaRow[] = categoriasComida.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    orden: c.orden,
    activa: c.activa,
    restauranteId: c.restauranteId,
    restauranteNombre: c.restaurante.nombre,
  }));

  const categoriasTipoRows: CategoriaTipoRow[] = categoriasTipo.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    tipo: c.Tipo,
    slug: c.slug,
    icono: c.icono,
    activo: c.activo,
  }));

  const ingredientesRows: IngredienteRow[] = ingredientes.map((i) => ({
    id: i.id,
    nombre: i.nombre,
    activo: i.activo,
  }));

  const extrasRows: ExtraRow[] = extras.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    costo: String(e.costo),
    descripcion: e.descripcion,
    disponible: e.disponible,
    platilloId: e.platilloId,
    platilloNombre: e.platillo.nombre,
    restauranteNombre: e.platillo.restaurante.nombre,
  }));

  const restaurantesOpciones: RestauranteOpcion[] = restaurantes.map((r) => ({
    id: r.id,
    nombre: r.nombre,
  }));

  const platillosOpciones: PlatilloOpcion[] = platillos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    restauranteId: p.restaurante.id,
    restauranteNombre: p.restaurante.nombre,
  }));

  return (
    <CatalogoClient
      categoriasComida={categoriasComidaRows}
      categoriasTipo={categoriasTipoRows}
      ingredientes={ingredientesRows}
      extras={extrasRows}
      restaurantes={restaurantesOpciones}
      platillos={platillosOpciones}
    />
  );
}
