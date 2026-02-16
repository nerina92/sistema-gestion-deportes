-- CreateTable: AFIP Configuration
CREATE TABLE "afip_config" (
    "id" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "cert_path" TEXT NOT NULL,
    "key_path" TEXT NOT NULL,
    "punto_venta" INTEGER NOT NULL,
    "production_mode" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "afip_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Invoices
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "invoice_type" TEXT NOT NULL DEFAULT 'B',
    "invoice_number" TEXT NOT NULL,
    "punto_venta" INTEGER NOT NULL,
    "cae" TEXT,
    "cae_expiration" TIMESTAMP(3),
    "invoice_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "customer_name" TEXT,
    "customer_dni" TEXT,
    "pdf_path" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_sale_id_key" ON "invoices"("sale_id");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
