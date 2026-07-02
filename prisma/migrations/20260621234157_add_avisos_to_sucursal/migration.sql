-- CreateTable
CREATE TABLE "avisos" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estatus" BOOLEAN NOT NULL DEFAULT true,
    "fecha" TIMESTAMP(3),
    "imagenUrl" TEXT,
    "imagenPublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sucursalId" TEXT NOT NULL,

    CONSTRAINT "avisos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "avisos" ADD CONSTRAINT "avisos_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
