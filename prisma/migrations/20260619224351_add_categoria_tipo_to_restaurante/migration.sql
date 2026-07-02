-- CreateTable
CREATE TABLE "categorias_tipo_comida" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "Tipo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icono" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_tipo_comida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurante_categorias" (
    "id" TEXT NOT NULL,
    "restauranteId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurante_categorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_tipo_comida_nombre_key" ON "categorias_tipo_comida"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_tipo_comida_slug_key" ON "categorias_tipo_comida"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "restaurante_categorias_restauranteId_categoriaId_key" ON "restaurante_categorias"("restauranteId", "categoriaId");

-- AddForeignKey
ALTER TABLE "restaurante_categorias" ADD CONSTRAINT "restaurante_categorias_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurante_categorias" ADD CONSTRAINT "restaurante_categorias_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_tipo_comida"("id") ON DELETE CASCADE ON UPDATE CASCADE;
