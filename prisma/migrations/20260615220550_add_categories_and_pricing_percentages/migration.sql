-- Categorías como tabla (FK) + porcentajes de precio en products.
-- Migración segura para producción: crea la tabla, siembra categorías por defecto
-- (incluida 'Paletas'), backfillea los productos existentes a partir del texto
-- 'category' anterior y recién entonces aplica NOT NULL + FK.

-- 1. Tabla categories
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- 2. Unicidad por nombre
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- 3. Sembrar categorías por defecto (idempotente)
INSERT INTO "categories" ("id", "name", "created_at", "updated_at")
SELECT gen_random_uuid()::text, t.name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('Remeras'), ('Pantalones'), ('Shorts'), ('Buzos'), ('Camperas'),
  ('Zapatillas'), ('Medias'), ('Accesorios'), ('Equipamiento'), ('Paletas'), ('Otros')
) AS t(name)
ON CONFLICT ("name") DO NOTHING;

-- 4. Asegurar una categoría por cada valor de texto ya existente en products
INSERT INTO "categories" ("id", "name", "created_at", "updated_at")
SELECT gen_random_uuid()::text, p.category, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "category" AS category FROM "products" WHERE "category" IS NOT NULL AND "category" <> '') p
ON CONFLICT ("name") DO NOTHING;

-- 5. Columnas nuevas en products (category_id nullable por ahora; porcentajes con default)
ALTER TABLE "products"
  ADD COLUMN "category_id" TEXT,
  ADD COLUMN "margin_cash" DECIMAL(6,2) NOT NULL DEFAULT 90,
  ADD COLUMN "surcharge_debit" DECIMAL(6,2) NOT NULL DEFAULT 5,
  ADD COLUMN "surcharge_financed" DECIMAL(6,2) NOT NULL DEFAULT 20;

-- 6. Backfill: mapear el texto anterior al id de categoría
UPDATE "products" p
SET "category_id" = c."id"
FROM "categories" c
WHERE c."name" = p."category";

-- 7. Cualquier producto sin categoría (NULL/'') queda en 'Otros'
UPDATE "products"
SET "category_id" = (SELECT "id" FROM "categories" WHERE "name" = 'Otros')
WHERE "category_id" IS NULL;

-- 8. Ahora sí, NOT NULL
ALTER TABLE "products" ALTER COLUMN "category_id" SET NOT NULL;

-- 9. Quitar columna e índice viejos
DROP INDEX IF EXISTS "products_category_idx";
ALTER TABLE "products" DROP COLUMN "category";

-- 10. Índice + FK (RESTRICT: no se puede borrar una categoría con productos)
CREATE INDEX "products_category_id_idx" ON "products"("category_id");
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
