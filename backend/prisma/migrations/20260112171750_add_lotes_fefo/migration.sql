-- AlterTable
ALTER TABLE "venta_detalles" ADD COLUMN     "lote_id" UUID;

-- CreateTable
CREATE TABLE "lotes" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "sucursal_id" UUID NOT NULL,
    "codigo_lote" VARCHAR(50) NOT NULL,
    "fecha_vencimiento" DATE,
    "fecha_fabricacion" DATE,
    "fecha_ingreso" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stock_inicial" INTEGER NOT NULL DEFAULT 0,
    "costo_unitario" DECIMAL(12,2),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lotes_empresa_id_variante_id_sucursal_id_codigo_lote_key" ON "lotes"("empresa_id", "variante_id", "sucursal_id", "codigo_lote");

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalles" ADD CONSTRAINT "venta_detalles_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
