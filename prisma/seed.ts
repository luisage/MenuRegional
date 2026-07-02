/**
 * Seed: datos base para nuevo despliegue.
 *
 * Ejecutar con:  npx prisma db seed
 * (o manualmente): npx tsx prisma/seed.ts
 *
 * Incluye:
 *  1. categorias_tipo_comida  — catálogo global (30 registros)
 *  2. planes                  — planes de suscripción (3 registros)
 *  3. User                    — usuario administrador
 *  4. categorias_comida       — categorías del menú del restaurante
 *                               (solo se insertan si el restaurante ya existe)
 */

import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────────────────────────────────────
// 1. Catálogo global de tipos de comida
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIAS_TIPO: Array<{
  id: string;
  nombre: string;
  Tipo: string;
  slug: string;
  icono: string;
}> = [
  { id: "bad957c2-1dcc-43eb-b686-8882bc7d9a43", nombre: "Alitas y boneless",           Tipo: "Tipo de platillo",            slug: "alitas_y_boneless",          icono: "" },
  { id: "0427dd49-7684-4628-b5b9-d9ad18794a5e", nombre: "Antojitos mexicanos",          Tipo: "Comida mexicana / regional",  slug: "antojitos_mexicanos",         icono: "" },
  { id: "d9e80082-ee2e-4e99-9cff-2e82fe20beb6", nombre: "Barbacoa",                     Tipo: "Comida mexicana / regional",  slug: "barbacoa",                    icono: "" },
  { id: "becb4c03-458a-4ab1-9bbe-42ed08ce56df", nombre: "Bebidas alcohólicas / bar",    Tipo: "Bebidas",                     slug: "bebidas_alcoholica_bar",      icono: "" },
  { id: "52963899-63a8-4565-ad0c-a2f185ab7c13", nombre: "Bebidas calientes",             Tipo: "Bebidas",                     slug: "bebidas_calientes",           icono: "" },
  { id: "a72cd838-9495-4c7e-9fa8-08d626b8b8c5", nombre: "Bebidas frías",                Tipo: "Bebidas",                     slug: "bebidas_frias",               icono: "" },
  { id: "f37db03e-e13b-4812-93a5-9984c26466bc", nombre: "Birria",                        Tipo: "Comida mexicana / regional",  slug: "birria",                      icono: "" },
  { id: "d9a0fb65-a76e-4811-bda5-4fc6d714ed65", nombre: "Café y cafetería",              Tipo: "Panadería y postres",         slug: "cafe_y_cafeteria",            icono: "" },
  { id: "37662aec-49c5-4c19-90e0-cb73a538da88", nombre: "Churros",                       Tipo: "Panadería y postres",         slug: "churros",                     icono: "" },
  { id: "644022f7-4e82-4505-894d-d8ee7c4beb90", nombre: "Comida casera",                 Tipo: "Comida mexicana / regional",  slug: "comida_casera",               icono: "" },
  { id: "16d981af-1a16-434e-8406-48626c700343", nombre: "Comida china",                  Tipo: "Comida internacional",        slug: "comida_china",                icono: "" },
  { id: "8554d4e4-df7e-41b4-b048-90717b2a7b37", nombre: "Comida japonesa",               Tipo: "Comida internacional",        slug: "comida_japonesa",             icono: "" },
  { id: "bbe91245-16d7-48e7-8495-fd9d57934d6a", nombre: "Comida vegana / vegetariana",   Tipo: "Tipo de platillo",            slug: "comida_vegana_vegetariana",   icono: "" },
  { id: "d1249c6e-b014-4830-be8d-49c4f526b102", nombre: "Desayunos",                     Tipo: "Otros",                       slug: "desayunos",                   icono: "" },
  { id: "296597ad-cd8f-4f79-b4eb-9bbfcb6a74ee", nombre: "Donas",                         Tipo: "Panadería y postres",         slug: "donas",                       icono: "" },
  { id: "53a503ef-43d1-4be9-a23d-4d417768b156", nombre: "Ensaladas",                     Tipo: "Tipo de platillo",            slug: "ensaladas",                   icono: "" },
  { id: "64139063-a569-4c49-993a-7e92fb0f3a25", nombre: "Hamburguesas",                  Tipo: "Comida internacional",        slug: "hamburguesas",                icono: "" },
  { id: "89375b2f-78f7-4d9d-86e3-c9a2c745ec6e", nombre: "Jugos y licuados",              Tipo: "Bebidas",                     slug: "jugos_y_licuados",            icono: "" },
  { id: "9d93cdb6-c95d-4ef8-9654-8f7b5436d8f4", nombre: "Mariscos",                      Tipo: "Comida mexicana / regional",  slug: "mariscos",                    icono: "" },
  { id: "17a06e80-2d18-4e9a-8002-e7c2e81e7fb4", nombre: "Nieves y paletas",              Tipo: "Panadería y postres",         slug: "nieves_y_paletas",            icono: "" },
  { id: "c6833f41-4b16-47ec-8fe6-99c4f302e125", nombre: "Parrilla / asados",             Tipo: "Tipo de platillo",            slug: "parrilla_asados",             icono: "" },
  { id: "d9b1de29-a82f-4f2d-a005-a41435620809", nombre: "Pastas",                        Tipo: "Tipo de platillo",            slug: "pastas",                      icono: "" },
  { id: "42588c04-c1df-41d6-afce-a00a83ee7b46", nombre: "Pastelería",                    Tipo: "Panadería y postres",         slug: "pastelería",                  icono: "" },
  { id: "5a4cb1fa-d5db-4069-b651-e26ac36b5800", nombre: "Pizzas",                        Tipo: "Comida internacional",        slug: "pizzas",                      icono: "" },
  { id: "5a44eaf7-70ba-403e-ba1b-3a80af50e9b3", nombre: "Postres",                       Tipo: "Panadería y postres",         slug: "postres",                     icono: "" },
  { id: "f62c8b20-d474-45d2-85c0-6e05570b200c", nombre: "Pozole",                        Tipo: "Comida mexicana / regional",  slug: "pozole",                      icono: "" },
  { id: "f9ae21ce-4559-437c-b8a4-b730d8df1932", nombre: "Sopas y caldos",                Tipo: "Tipo de platillo",            slug: "sopas_y_caldos",              icono: "" },
  { id: "b6826bd6-b217-449b-9345-d94b2f1d2ba8", nombre: "Tacos",                         Tipo: "Comida mexicana / regional",  slug: "tacos",                       icono: "" },
  { id: "572efc77-5685-4bc0-80cf-ae467cbedb96", nombre: "Tamales",                       Tipo: "Otros",                       slug: "tamales",                     icono: "" },
  { id: "a69d692c-8ec3-4214-8ded-409317f5af6a", nombre: "Tortas",                        Tipo: "Comida mexicana / regional",  slug: "tortas",                      icono: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. Planes de suscripción
// ─────────────────────────────────────────────────────────────────────────────
const PLANES: Array<{
  id: string;
  nombre: string;
  slug: string;
  precio: string;
  limitePlatillos: number | null;
  limiteSucursales: number | null;
  avisos: boolean;
  activo: boolean;
}> = [
  {
    id:               "d9daceed-7200-4735-984a-b62e489fe620",
    nombre:           "Gratis",
    slug:             "gratis",
    precio:           "0",
    limitePlatillos:  10,
    limiteSucursales: 1,
    avisos:           false,
    activo:           true,
  },
  {
    id:               "c603e31b-3e7a-4cc2-8401-f96e5168ad36",
    nombre:           "1 Sucursal",
    slug:             "1_sucursal",
    precio:           "200",
    limitePlatillos:  -1,
    limiteSucursales: 1,
    avisos:           true,
    activo:           true,
  },
  {
    id:               "0d8f0b39-b6e1-4383-a610-5dd338c42430",
    nombre:           "Multi Sucursal",
    slug:             "multi_sucursal",
    precio:           "300",
    limitePlatillos:  -1,
    limiteSucursales: -1,
    avisos:           true,
    activo:           true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. Usuario administrador
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_USER = {
  id:       "c9632c86-2297-42ef-8269-a4372e5ba965",
  usuario:  "Luis35",
  // Contraseña hasheada con bcrypt — NO cambiar este valor
  password: "$2b$10$PiSEEFkNxlSWQGdRWxQU.e/BVphmWEyDETZnFA.zFn9KdnQ9Lo4GK",
  nombre:   "Luis",
  apellido: "Gómez",
  role:     "ADMIN" as const,
  estatus:  true,
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Categorías del menú del restaurante (dependen de que el restaurante exista)
// ─────────────────────────────────────────────────────────────────────────────
const RESTAURANTE_ID = "cmqgy2pk40002pwcl6s281tu8";

const CATEGORIAS_COMIDA: Array<{
  id: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  activa: boolean;
  restauranteId: string;
}> = [
  { id: "cmqjx0mig000090cli2p2bg09", nombre: "Hamburguesas", descripcion: null, orden: 0, activa: true, restauranteId: RESTAURANTE_ID },
  { id: "cmqkcorta000490clx3vsjyb2", nombre: "Quesadillas",  descripcion: null, orden: 1, activa: true, restauranteId: RESTAURANTE_ID },
  { id: "cmqkcozka000590clnqwzl2df", nombre: "Sopes",        descripcion: null, orden: 2, activa: true, restauranteId: RESTAURANTE_ID },
  { id: "cmqkcp9q8000690cl3f365wz1", nombre: "Enchiladas",   descripcion: null, orden: 3, activa: true, restauranteId: RESTAURANTE_ID },
  { id: "cmqkdaks2000p90clzlmtjo28", nombre: "Bebidas",      descripcion: null, orden: 5, activa: true, restauranteId: RESTAURANTE_ID },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Iniciando seed...\n");

  // 1. Tipos de comida
  const { count: countTipo } = await prisma.categoriaTipoComida.createMany({
    data: CATEGORIAS_TIPO,
    skipDuplicates: true,
  });
  console.log(`✅ categorias_tipo_comida: ${countTipo} registros insertados (duplicados omitidos)`);

  // 2. Planes de suscripción
  const { count: countPlanes } = await prisma.plan.createMany({
    data: PLANES,
    skipDuplicates: true,
  });
  console.log(`✅ planes: ${countPlanes} registros insertados (duplicados omitidos)`);

  // 3. Usuario administrador
  await prisma.user.upsert({
    where: { id: ADMIN_USER.id },
    update: {},
    create: ADMIN_USER,
  });
  console.log(`✅ user: usuario "${ADMIN_USER.usuario}" listo`);

  // 4. Categorías de menú (solo si el restaurante existe)
  const restaurante = await prisma.restaurante.findUnique({
    where: { id: RESTAURANTE_ID },
    select: { id: true, nombre: true },
  });

  if (restaurante) {
    const { count: countCats } = await prisma.categoriaComida.createMany({
      data: CATEGORIAS_COMIDA,
      skipDuplicates: true,
    });
    console.log(`✅ categorias_comida (${restaurante.nombre}): ${countCats} registros insertados`);
  } else {
    console.log(
      `⚠️  categorias_comida omitidas — el restaurante (id: ${RESTAURANTE_ID}) no existe todavía.\n` +
      `   Créalo primero desde el panel y luego ejecuta el seed de nuevo si necesitas estas categorías.`
    );
  }

  console.log("\n🌱 Seed completado.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Error en seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
