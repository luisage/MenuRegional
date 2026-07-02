/*
  Warnings:

  - You are about to drop the column `direccion` on the `cuentas_cliente` table. All the data in the column will be lost.
  - Added the required column `calle` to the `cuentas_cliente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coloniaId` to the `cuentas_cliente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero` to the `cuentas_cliente` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cuentas_cliente" DROP COLUMN "direccion",
ADD COLUMN     "calle" TEXT NOT NULL,
ADD COLUMN     "coloniaId" TEXT NOT NULL,
ADD COLUMN     "numero" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "cuentas_cliente" ADD CONSTRAINT "cuentas_cliente_coloniaId_fkey" FOREIGN KEY ("coloniaId") REFERENCES "Colonia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
