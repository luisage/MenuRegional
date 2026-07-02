/*
  Warnings:

  - You are about to drop the column `linkMapsEntrega` on the `pedidos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pedidos" DROP COLUMN "linkMapsEntrega",
ADD COLUMN     "latitud" DECIMAL(10,8),
ADD COLUMN     "longitud" DECIMAL(11,8);
