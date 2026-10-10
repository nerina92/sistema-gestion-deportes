-- AlterTable: Add pdf_data to invoices for storing PDF as base64
ALTER TABLE "invoices" ADD COLUMN "pdf_data" TEXT;
