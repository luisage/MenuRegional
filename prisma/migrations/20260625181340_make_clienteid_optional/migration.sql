-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_clienteId_fkey";

-- AlterTable
ALTER TABLE "pedidos" ALTER COLUMN "clienteId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cuentas_cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
