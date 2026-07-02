-- AlterTable
ALTER TABLE "categorias_tipo_comida" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ingredientes" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;
