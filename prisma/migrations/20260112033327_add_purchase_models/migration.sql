/*
  Warnings:

  - You are about to drop the column `invoice_number` on the `purchases` table. All the data in the column will be lost.
  - You are about to drop the column `contact_name` on the `suppliers` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `purchase_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `purchases` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "purchase_items" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "purchases" DROP COLUMN "invoice_number",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'completed',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "purchase_date" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "suppliers" DROP COLUMN "contact_name",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
