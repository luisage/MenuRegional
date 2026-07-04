-- CreateTable
CREATE TABLE "qr_menus" (
    "id" TEXT NOT NULL,
    "restauranteId" TEXT NOT NULL,
    "escaneos" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_menus_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "qr_menus" ADD CONSTRAINT "qr_menus_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "restaurantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
