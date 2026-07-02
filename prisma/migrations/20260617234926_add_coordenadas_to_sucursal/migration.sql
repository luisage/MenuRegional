/*
  Warnings:

  - You are about to drop the column `linkGoogleMaps` on the `sucursales` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sucursales" DROP COLUMN "linkGoogleMaps",
ADD COLUMN     "latitud" DECIMAL(10,8),
ADD COLUMN     "longitud" DECIMAL(11,8);
