-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN "tiendanube_product_id" TEXT,
ADD COLUMN "tiendanube_variant_id" TEXT;

-- CreateTable
CREATE TABLE "tiendanube_config" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiendanube_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_logs_created_at_idx" ON "sync_logs"("created_at");
