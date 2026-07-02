/*
  Warnings:

  - You are about to drop the column `linkGoogleMaps` on the `cuentas_cliente` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cuentas_cliente" DROP COLUMN "linkGoogleMaps",
ADD COLUMN     "latitud" DECIMAL(10,8),
ADD COLUMN     "longitud" DECIMAL(11,8);
