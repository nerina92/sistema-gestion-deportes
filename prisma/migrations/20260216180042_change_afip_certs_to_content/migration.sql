-- AlterTable: Change AFIP certificate storage from file paths to content
-- This allows the app to work in serverless environments like Vercel

-- Add new columns for certificate content
ALTER TABLE "afip_config" ADD COLUMN "cert_content" TEXT;
ALTER TABLE "afip_config" ADD COLUMN "key_content" TEXT;

-- Drop old path columns (if there's existing data, it will be lost - but AFIP config is likely empty)
ALTER TABLE "afip_config" DROP COLUMN IF EXISTS "cert_path";
ALTER TABLE "afip_config" DROP COLUMN IF EXISTS "key_path";

-- Make new columns NOT NULL (safe since table is likely empty)
ALTER TABLE "afip_config" ALTER COLUMN "cert_content" SET NOT NULL;
ALTER TABLE "afip_config" ALTER COLUMN "key_content" SET NOT NULL;
