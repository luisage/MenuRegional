-- CreateEnum
CREATE TYPE "TipoEnvio" AS ENUM ('RECOGER_EN_SUCURSAL', 'ENVIO_A_DOMICILIO', 'COMER_EN_LUGAR');

-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'EN_CAMINO', 'LISTO', 'ENTREGADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "cuentas_restaurante" (
    "id" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombreDueno" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "email" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_restaurante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_cliente" (
    "id" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "direccion" TEXT,
    "linkGoogleMaps" TEXT,
    "referencias" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurantes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "logoUrl" TEXT,
    "logoPublicId" TEXT,
    "slug" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cuentaId" TEXT NOT NULL,

    CONSTRAINT "restaurantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sucursales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "linkGoogleMaps" TEXT,
    "descripcion" TEXT,
    "telefonoWhatsApp" TEXT NOT NULL,
    "horarioApertura" TEXT,
    "horarioCierre" TEXT,
    "costoEnvio" DECIMAL(10,2),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagenes_sucursal" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sucursalId" TEXT NOT NULL,

    CONSTRAINT "imagenes_sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_comida" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "categorias_comida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platillos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tamano" TEXT,
    "tipo" TEXT,
    "costo" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT,
    "imagenUrl" TEXT,
    "imagenPublicId" TEXT,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "restauranteId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,

    CONSTRAINT "platillos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platillos_sucursal" (
    "id" TEXT NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "precioEspecial" DECIMAL(10,2),
    "platilloId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,

    CONSTRAINT "platillos_sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platillos_ingredientes" (
    "id" TEXT NOT NULL,
    "opcional" BOOLEAN NOT NULL DEFAULT true,
    "platilloId" TEXT NOT NULL,
    "ingredienteId" TEXT NOT NULL,

    CONSTRAINT "platillos_ingredientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extras" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "costo" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "platilloId" TEXT NOT NULL,

    CONSTRAINT "extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "folio" SERIAL NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "tipoEnvio" "TipoEnvio" NOT NULL,
    "tipoPago" "TipoPago" NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "costoEnvio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "propina" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "costoTotal" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT,
    "direccionEntrega" TEXT,
    "linkMapsEntrega" TEXT,
    "telefonoContacto" TEXT,
    "whatsappEnviado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clienteId" TEXT NOT NULL,
    "restauranteId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_pedido" (
    "id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "nombrePlatillo" TEXT NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "costoTotal" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT,
    "pedidoId" TEXT NOT NULL,
    "platilloId" TEXT,

    CONSTRAINT "detalles_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_pedido_extras" (
    "id" TEXT NOT NULL,
    "nombreExtra" TEXT NOT NULL,
    "costoExtra" DECIMAL(10,2) NOT NULL,
    "detalleId" TEXT NOT NULL,
    "extraId" TEXT,

    CONSTRAINT "detalles_pedido_extras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_restaurante_usuario_key" ON "cuentas_restaurante"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_restaurante_email_key" ON "cuentas_restaurante"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_cliente_usuario_key" ON "cuentas_cliente"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_cliente_celular_key" ON "cuentas_cliente"("celular");

-- CreateIndex
CREATE UNIQUE INDEX "restaurantes_slug_key" ON "restaurantes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "restaurantes_cuentaId_key" ON "restaurantes"("cuentaId");

-- CreateIndex
CREATE INDEX "sucursales_restauranteId_idx" ON "sucursales"("restauranteId");

-- CreateIndex
CREATE INDEX "imagenes_sucursal_sucursalId_idx" ON "imagenes_sucursal"("sucursalId");

-- CreateIndex
CREATE INDEX "categorias_comida_restauranteId_idx" ON "categorias_comida"("restauranteId");

-- CreateIndex
CREATE INDEX "platillos_restauranteId_idx" ON "platillos"("restauranteId");

-- CreateIndex
CREATE INDEX "platillos_categoriaId_idx" ON "platillos"("categoriaId");

-- CreateIndex
CREATE INDEX "platillos_sucursal_sucursalId_idx" ON "platillos_sucursal"("sucursalId");

-- CreateIndex
CREATE UNIQUE INDEX "platillos_sucursal_platilloId_sucursalId_key" ON "platillos_sucursal"("platilloId", "sucursalId");

-- CreateIndex
CREATE UNIQUE INDEX "ingredientes_nombre_key" ON "ingredientes"("nombre");

-- CreateIndex
CREATE INDEX "platillos_ingredientes_platilloId_idx" ON "platillos_ingredientes"("platilloId");

-- CreateIndex
CREATE UNIQUE INDEX "platillos_ingredientes_platilloId_ingredienteId_key" ON "platillos_ingredientes"("platilloId", "ingredienteId");

-- CreateIndex
CREATE INDEX "extras_platilloId_idx" ON "extras"("platilloId");

-- CreateIndex
CREATE INDEX "pedidos_clienteId_idx" ON "pedidos"("clienteId");

-- CreateIndex
CREATE INDEX "pedidos_restauranteId_idx" ON "pedidos"("restauranteId");

-- CreateIndex
CREATE INDEX "pedidos_sucursalId_idx" ON "pedidos"("sucursalId");

-- CreateIndex
CREATE INDEX "pedidos_estado_idx" ON "pedidos"("estado");

-- CreateIndex
CREATE INDEX "detalles_pedido_pedidoId_idx" ON "detalles_pedido"("pedidoId");

-- CreateIndex
CREATE INDEX "detalles_pedido_extras_detalleId_idx" ON "detalles_pedido_extras"("detalleId");

-- AddForeignKey
ALTER TABLE "restaurantes" ADD CONSTRAINT "restaurantes_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas_restaurante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagenes_sucursal" ADD CONSTRAINT "imagenes_sucursal_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias_comida" ADD CONSTRAINT "categorias_comida_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platillos" ADD CONSTRAINT "platillos_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "restaurantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platillos" ADD CONSTRAINT "platillos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_comida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platillos_sucursal" ADD CONSTRAINT "platillos_sucursal_platilloId_fkey" FOREIGN KEY ("platilloId") REFERENCES "platillos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platillos_sucursal" ADD CONSTRAINT "platillos_sucursal_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platillos_ingredientes" ADD CONSTRAINT "platillos_ingredientes_platilloId_fkey" FOREIGN KEY ("platilloId") REFERENCES "platillos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platillos_ingredientes" ADD CONSTRAINT "platillos_ingredientes_ingredienteId_fkey" FOREIGN KEY ("ingredienteId") REFERENCES "ingredientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extras" ADD CONSTRAINT "extras_platilloId_fkey" FOREIGN KEY ("platilloId") REFERENCES "platillos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cuentas_cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "restaurantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_pedido" ADD CONSTRAINT "detalles_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_pedido" ADD CONSTRAINT "detalles_pedido_platilloId_fkey" FOREIGN KEY ("platilloId") REFERENCES "platillos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_pedido_extras" ADD CONSTRAINT "detalles_pedido_extras_detalleId_fkey" FOREIGN KEY ("detalleId") REFERENCES "detalles_pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_pedido_extras" ADD CONSTRAINT "detalles_pedido_extras_extraId_fkey" FOREIGN KEY ("extraId") REFERENCES "extras"("id") ON DELETE SET NULL ON UPDATE CASCADE;
