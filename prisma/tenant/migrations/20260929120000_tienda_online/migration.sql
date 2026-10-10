-- Tienda online: configuración y pedidos

-- AlterTable
ALTER TABLE "tenant_settings" ADD COLUMN     "store_delivery" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "store_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "store_message" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "store_pickup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "store_price_type" TEXT NOT NULL DEFAULT 'cash',
ADD COLUMN     "store_show_out_of_stock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "store_whatsapp" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "channel" TEXT NOT NULL DEFAULT 'store',
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "delivery_method" TEXT NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "price_type" TEXT NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "sale_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_variant_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "variant_label" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_number_key" ON "orders"("number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_sale_id_key" ON "orders"("sale_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_variant_id_idx" ON "order_items"("product_variant_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
