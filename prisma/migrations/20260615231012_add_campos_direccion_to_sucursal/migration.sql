/*
  Warnings:

  - You are about to drop the column `direccion` on the `sucursales` table. All the data in the column will be lost.
  - You are about to drop the column `horarioApertura` on the `sucursales` table. All the data in the column will be lost.
  - You are about to drop the column `horarioCierre` on the `sucursales` table. All the data in the column will be lost.
  - Added the required column `calle` to the `sucursales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coloniaId` to the `sucursales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero` to the `sucursales` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- AlterTable
ALTER TABLE "sucursales" DROP COLUMN "direccion",
DROP COLUMN "horarioApertura",
DROP COLUMN "horarioCierre",
ADD COLUMN     "calle" TEXT NOT NULL,
ADD COLUMN     "coloniaId" TEXT NOT NULL,
ADD COLUMN     "numero" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "HorarioSucursal" (
    "id" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "dia" "DiaSemana" NOT NULL,
    "apertura" TEXT NOT NULL,
    "cierre" TEXT NOT NULL,
    "abierto" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HorarioSucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estado" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Municipio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "estadoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Municipio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colonia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Colonia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HorarioSucursal_sucursalId_dia_key" ON "HorarioSucursal"("sucursalId", "dia");

-- CreateIndex
CREATE UNIQUE INDEX "Estado_nombre_key" ON "Estado"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Municipio_nombre_estadoId_key" ON "Municipio"("nombre", "estadoId");

-- CreateIndex
CREATE UNIQUE INDEX "Colonia_nombre_municipioId_key" ON "Colonia"("nombre", "municipioId");

-- AddForeignKey
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_coloniaId_fkey" FOREIGN KEY ("coloniaId") REFERENCES "Colonia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioSucursal" ADD CONSTRAINT "HorarioSucursal_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Municipio" ADD CONSTRAINT "Municipio_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "Estado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colonia" ADD CONSTRAINT "Colonia_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
