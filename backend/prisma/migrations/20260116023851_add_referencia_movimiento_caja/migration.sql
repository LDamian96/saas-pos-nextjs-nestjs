/*
  Warnings:

  - You are about to drop the column `nombre` on the `variantes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "variantes" DROP COLUMN "nombre",
ADD COLUMN     "alto" DECIMAL(10,2),
ADD COLUMN     "ancho" DECIMAL(10,2),
ADD COLUMN     "descripcion_corta" TEXT,
ADD COLUMN     "descripcion_larga" TEXT,
ADD COLUMN     "descuento_porcentaje" DECIMAL(5,2),
ADD COLUMN     "largo" DECIMAL(10,2),
ADD COLUMN     "nombre_variante" VARCHAR(200),
ADD COLUMN     "oferta_desde" TIMESTAMP(3),
ADD COLUMN     "oferta_hasta" TIMESTAMP(3),
ADD COLUMN     "peso" DECIMAL(10,3),
ADD COLUMN     "precio_mayorista" DECIMAL(12,2),
ADD COLUMN     "precio_oferta" DECIMAL(12,2),
ADD COLUMN     "stock_minimo" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "sucursal_id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "lote_id" UUID,
    "tipo" VARCHAR(20) NOT NULL,
    "motivo" VARCHAR(50) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "stock_anterior" INTEGER NOT NULL,
    "stock_nuevo" INTEGER NOT NULL,
    "costo_unitario" DECIMAL(12,2),
    "costo_total" DECIMAL(12,2),
    "documento_tipo" VARCHAR(30),
    "documento_numero" VARCHAR(50),
    "documento_id" UUID,
    "sucursal_origen_id" UUID,
    "sucursal_destino_id" UUID,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_caja" (
    "id" UUID NOT NULL,
    "caja_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "motivo" VARCHAR(50) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "venta_id" UUID,
    "descripcion" TEXT,
    "referencia" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_caja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movimientos_inventario_empresa_id_idx" ON "movimientos_inventario"("empresa_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_sucursal_id_idx" ON "movimientos_inventario"("sucursal_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_variante_id_idx" ON "movimientos_inventario"("variante_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_created_at_idx" ON "movimientos_inventario"("created_at");

-- CreateIndex
CREATE INDEX "movimientos_inventario_tipo_idx" ON "movimientos_inventario"("tipo");

-- CreateIndex
CREATE INDEX "movimientos_caja_caja_id_idx" ON "movimientos_caja"("caja_id");

-- CreateIndex
CREATE INDEX "movimientos_caja_created_at_idx" ON "movimientos_caja"("created_at");

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_sucursal_origen_id_fkey" FOREIGN KEY ("sucursal_origen_id") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_sucursal_destino_id_fkey" FOREIGN KEY ("sucursal_destino_id") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
