# Categorías en BD + Cálculo de Precios por Porcentaje — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Gestionar categorías de productos desde una tabla en BD (ABM con FK real) y calcular automáticamente los precios contado/débito/financiado a partir del costo y porcentajes editables, redondeando al múltiplo de 100 más cercano.

**Architecture:** PostgreSQL gana una tabla `categories`; `Product` pasa de `category String` a `categoryId` (FK, borrado `Restrict`) y gana 3 campos de porcentaje. Una utilidad pura `src/lib/pricing.ts` centraliza el cálculo+redondeo, usada por APIs y por el preview del front. Los precios calculados se siguen persistiendo en cada variante (no se rompen ventas/reportes/facturas).

**Tech Stack:** Next.js (App Router), Prisma, PostgreSQL, TypeScript, Tailwind, React Icons, `tsx` (para seed y test del cálculo).

**Notas de verificación:** El proyecto no tiene framework de tests unitarios. Se verifica con:
- `npm run build` (typecheck completo) para cada cambio de tipos/API.
- Un test puro del cálculo de precios ejecutable con `npx tsx scripts/test-pricing.ts`.
- Pruebas manuales en `npm run dev` para UI.

Base de datos vacía (1 producto de prueba) → se puede recrear el esquema sin preservar datos.

---

## Fase 1 — Cálculo de precios (utilidad pura + test)

### Task 1: Utilidad de cálculo `src/lib/pricing.ts`

**Files:**
- Create: `src/lib/pricing.ts`
- Create: `scripts/test-pricing.ts`

**Step 1: Escribir el test del cálculo (TDD)**

Crear `scripts/test-pricing.ts`:
```ts
import { computeVariantPrices, roundToHundred, DEFAULT_PRICING } from '../src/lib/pricing';

let failures = 0;
function assertEq(label: string, actual: number, expected: number) {
  if (actual !== expected) {
    console.error(`❌ ${label}: esperado ${expected}, obtenido ${actual}`);
    failures++;
  } else {
    console.log(`✅ ${label} = ${actual}`);
  }
}

// roundToHundred: al más cercano
assertEq('round 190', roundToHundred(190), 200);
assertEq('round 228', roundToHundred(228), 200);
assertEq('round 250', roundToHundred(250), 300); // .5 redondea hacia arriba
assertEq('round 240', roundToHundred(240), 200);
assertEq('round 0', roundToHundred(0), 0);

// computeVariantPrices con defaults (90/5/20) y costo 100
// contado crudo = 190 -> 200 ; debito crudo = 190*1.05=199.5 -> 200 ; financiado crudo = 190*1.2=228 -> 200
const p = computeVariantPrices(100, DEFAULT_PRICING);
assertEq('contado', p.priceCash, 200);
assertEq('debito', p.priceDebit, 200);
assertEq('financiado', p.priceFinanced, 200);

// costo mayor para ver separación: costo 1000, 90/5/20
// contado = 1900 ; debito = 1900*1.05=1995 -> 2000 ; financiado = 1900*1.2=2280 -> 2300
const p2 = computeVariantPrices(1000, { marginCash: 90, surchargeDebit: 5, surchargeFinanced: 20 });
assertEq('contado 1000', p2.priceCash, 1900);
assertEq('debito 1000', p2.priceDebit, 2000);
assertEq('financiado 1000', p2.priceFinanced, 2300);

// costo 0 -> todo 0
const p3 = computeVariantPrices(0, DEFAULT_PRICING);
assertEq('contado 0', p3.priceCash, 0);

if (failures > 0) { console.error(`\n${failures} test(s) fallaron`); process.exit(1); }
console.log('\n✅ Todos los tests de pricing pasaron');
```

**Step 2: Ejecutar el test y verificar que FALLA**

Run: `npx tsx scripts/test-pricing.ts`
Expected: FALLA — "Cannot find module '../src/lib/pricing'".

**Step 3: Implementar `src/lib/pricing.ts`**

```ts
export interface PricingPercentages {
  /** % de margen sobre el costo para el precio contado (default 90) */
  marginCash: number;
  /** % de recargo sobre el contado para débito (default 5) */
  surchargeDebit: number;
  /** % de recargo sobre el contado para financiado/crédito (default 20) */
  surchargeFinanced: number;
}

export const DEFAULT_PRICING: PricingPercentages = {
  marginCash: 90,
  surchargeDebit: 5,
  surchargeFinanced: 20,
};

/** Redondea al múltiplo de 100 más cercano (.5 hacia arriba). */
export function roundToHundred(value: number): number {
  if (!isFinite(value) || value <= 0) return 0;
  return Math.round(value / 100) * 100;
}

export interface ComputedPrices {
  priceCash: number;
  priceDebit: number;
  priceFinanced: number;
}

/**
 * Calcula los 3 precios a partir del costo y los porcentajes.
 * Débito y financiado se calculan sobre el contado SIN redondear,
 * y luego cada precio final se redondea de forma independiente.
 */
export function computeVariantPrices(
  costPrice: number,
  pct: PricingPercentages = DEFAULT_PRICING
): ComputedPrices {
  const cost = Number(costPrice) || 0;
  const rawCash = cost * (1 + (Number(pct.marginCash) || 0) / 100);
  const rawDebit = rawCash * (1 + (Number(pct.surchargeDebit) || 0) / 100);
  const rawFinanced = rawCash * (1 + (Number(pct.surchargeFinanced) || 0) / 100);
  return {
    priceCash: roundToHundred(rawCash),
    priceDebit: roundToHundred(rawDebit),
    priceFinanced: roundToHundred(rawFinanced),
  };
}
```

**Step 4: Ejecutar el test y verificar que PASA**

Run: `npx tsx scripts/test-pricing.ts`
Expected: PASA — "✅ Todos los tests de pricing pasaron".

**Step 5: Commit**

```bash
git add src/lib/pricing.ts scripts/test-pricing.ts
git commit -m "feat: add pure pricing calculation utility with rounding to nearest 100"
```

---

## Fase 2 — Esquema de BD + seed

### Task 2: Modelo `Category` + cambios en `Product`

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Agregar modelo `Category` y modificar `Product`**

En `prisma/schema.prisma`, agregar el modelo (después de `ProductVariant`):
```prisma
model Category {
  id        String    @id @default(cuid())
  name      String    @unique
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  products  Product[]

  @@map("categories")
}
```

Modificar `Product`: eliminar la línea `category String` y los campos de porcentaje + relación:
```prisma
model Product {
  id          String            @id @default(cuid())
  name        String
  brand       String?
  description String?
  barcode     String?           @unique
  imageUrl    String?           @map("image_url")
  categoryId  String            @map("category_id")
  marginCash        Decimal     @default(90) @map("margin_cash")        @db.Decimal(6, 2)
  surchargeDebit    Decimal     @default(5)  @map("surcharge_debit")    @db.Decimal(6, 2)
  surchargeFinanced Decimal     @default(20) @map("surcharge_financed") @db.Decimal(6, 2)
  createdAt   DateTime          @default(now()) @map("created_at")
  updatedAt   DateTime          @updatedAt @map("updated_at")

  category    Category          @relation(fields: [categoryId], references: [id])
  variants    ProductVariant[]

  @@index([categoryId])
  @@index([brand])
  @@map("products")
}
```
(Se elimina el viejo `@@index([category])`.)

**Step 2: Generar la migración (BD vacía → reset permitido)**

Run: `npx prisma migrate dev --name add_categories_and_pricing_percentages`
Expected: crea la migración y aplica; si pide reset por el cambio destructivo de columna, aceptar (BD vacía). `prisma generate` corre solo.

**Step 3: Verificar el cliente generado**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | head -20`
Expected: aún habrá errores en archivos que usan `product.category` (string) — se arreglan en fases siguientes. Confirmar que NO hay error en `prisma/schema.prisma` ni en la generación del client.

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add Category model (FK) and pricing percentage fields to Product"
```

### Task 3: Seed de categorías (incluye Paletas)

**Files:**
- Modify: `prisma/seed.ts`

**Step 1: Agregar seeding de categorías**

Dentro de `main()`, antes del cierre del `try`, agregar:
```ts
    // Crear categorías por defecto
    console.log('🏷️  Creando categorías por defecto...');
    const categoryNames = [
      'Remeras', 'Pantalones', 'Shorts', 'Buzos', 'Camperas',
      'Zapatillas', 'Medias', 'Accesorios', 'Equipamiento', 'Paletas', 'Otros',
    ];
    for (const name of categoryNames) {
      await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
    const categoryCount = await prisma.category.count();
    console.log(`📊 Total de categorías: ${categoryCount}`);
```

**Step 2: Ejecutar el seed**

Run: `npm run db:seed`
Expected: "Total de categorías: 11" y sin errores.

**Step 3: Verificar Paletas en BD**

Run: `npx prisma studio` (opcional) o consulta rápida; confirmar fila `Paletas` en `categories`.

**Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed default categories including Paletas"
```

---

## Fase 3 — Tipos y validación

### Task 4: Actualizar tipos en `src/types/products.ts`

**Files:**
- Modify: `src/types/products.ts`

**Step 1: Cambiar `category` → `categoryId` + porcentajes + relación**

- En `ProductInput`: reemplazar `category: string;` por:
  ```ts
  categoryId: string;
  marginCash?: number;
  surchargeDebit?: number;
  surchargeFinanced?: number;
  ```
- En `ProductWithVariants`: reemplazar `category: string;` por:
  ```ts
  categoryId: string;
  category?: { id: string; name: string } | null;
  marginCash: number;
  surchargeDebit: number;
  surchargeFinanced: number;
  ```
- En `ProductsListResponse.filters`: cambiar `categories: string[]` por
  `categories: { id: string; name: string }[]`.
- `ProductVariantInput`: dejar `costPrice` requerido; `priceCash/priceDebit/priceFinanced`
  pasan a opcionales (`?`) porque los calcula el servidor.

**Step 2: Verificar typecheck del archivo de tipos**

Run: `npx tsc --noEmit 2>&1 | grep "types/products" | head`
Expected: sin errores propios del archivo de tipos.

**Step 3: Commit**

```bash
git add src/types/products.ts
git commit -m "refactor: update product types for categoryId FK and pricing percentages"
```

### Task 5: Actualizar `src/lib/validation.ts`

**Files:**
- Modify: `src/lib/validation.ts`

**Step 1: Reemplazar validación de `category` y de precios**

- En `validateProductInput`: reemplazar el bloque que valida `data.category` por:
  ```ts
  if (!data.categoryId || typeof data.categoryId !== 'string' || data.categoryId.trim().length === 0) {
    errors.push({ field: 'categoryId', message: 'La categoría del producto es requerida' });
  }
  ```
  Y agregar validación de porcentajes (opcionales pero, si vienen, válidos):
  ```ts
  const pctFields = ['marginCash', 'surchargeDebit', 'surchargeFinanced'];
  pctFields.forEach((f) => {
    if (data[f] !== undefined) {
      const v = data[f];
      if (typeof v !== 'number' || isNaN(v) || v < 0) {
        errors.push({ field: f, message: `${f} debe ser un porcentaje válido (>= 0)` });
      }
    }
  });
  ```
- En `validateProductVariantInput`: cambiar la validación de precios para exigir SOLO
  `costPrice` (los demás los calcula el servidor):
  ```ts
  const value = variant.costPrice;
  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    errors.push({ field: `${fieldPrefix}.costPrice`, message: 'costPrice debe ser un número positivo mayor a 0' });
  }
  ```
  (Eliminar el `priceFields.forEach` que exigía los 3 precios.)
- En `sanitizeProductInput`: convertir también los porcentajes a number a nivel producto:
  ```ts
  if (sanitized.marginCash !== undefined) sanitized.marginCash = Number(sanitized.marginCash);
  if (sanitized.surchargeDebit !== undefined) sanitized.surchargeDebit = Number(sanitized.surchargeDebit);
  if (sanitized.surchargeFinanced !== undefined) sanitized.surchargeFinanced = Number(sanitized.surchargeFinanced);
  ```
  (Las variantes ya parsean `costPrice`; los `parseFloat` de priceCash/Debit/Financed pueden quedar — no molestan — pero pueden quitarse.)
- En `validateProductsQueryParams`: el filtro `category` ahora será por id. Renombrar a
  `categoryId`: agregar `categoryId: undefined as string | undefined` y leer `params.categoryId`.
  (Mantener compat: aceptar también `params.category` si querés, pero preferir `categoryId`.)

**Step 2: Verificar typecheck**

Run: `npx tsc --noEmit 2>&1 | grep "lib/validation" | head`
Expected: sin errores propios del archivo.

**Step 3: Commit**

```bash
git add src/lib/validation.ts
git commit -m "refactor: validate categoryId + costPrice-only, server computes prices"
```

---

## Fase 4 — API de Categorías (ABM)

### Task 6: `GET`/`POST` en `/api/categories`

**Files:**
- Create: `src/app/api/categories/route.ts`

**Step 1: Implementar la ruta**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/categories — lista con conteo de productos
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json({
      success: true,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        productCount: c._count.products,
      })),
    });
  } catch (error: any) {
    console.error('Error GET categories:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/categories — crear
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    const trimmed = name.trim();
    const existing = await prisma.category.findUnique({ where: { name: trimmed } });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 409 });
    }
    const category = await prisma.category.create({ data: { name: trimmed } });
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    console.error('Error POST category:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

**Step 2: Verificar typecheck**

Run: `npx tsc --noEmit 2>&1 | grep "api/categories" | head`
Expected: sin errores.

**Step 3: Commit**

```bash
git add src/app/api/categories/route.ts
git commit -m "feat: add GET/POST /api/categories"
```

### Task 7: `PUT`/`DELETE` en `/api/categories/[id]`

**Files:**
- Create: `src/app/api/categories/[id]/route.ts`

**Step 1: Implementar la ruta**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/categories/:id — renombrar
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name } = await request.json();
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    const trimmed = name.trim();
    const dup = await prisma.category.findFirst({
      where: { name: trimmed, NOT: { id } },
    });
    if (dup) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 409 });
    }
    const category = await prisma.category.update({ where: { id }, data: { name: trimmed } });
    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error('Error PUT category:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/categories/:id — bloquea si tiene productos
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `No se puede borrar: la categoría tiene ${count} producto(s) asignado(s).` },
        { status: 409 }
      );
    }
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error DELETE category:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

**Step 2: Verificar typecheck**

Run: `npx tsc --noEmit 2>&1 | grep "api/categories" | head`
Expected: sin errores.

**Step 3: Commit**

```bash
git add src/app/api/categories/\[id\]/route.ts
git commit -m "feat: add PUT/DELETE /api/categories/[id] with in-use delete guard"
```

---

## Fase 5 — Adaptar APIs de productos

### Task 8: `src/app/api/products/route.ts` (GET filtros + POST con cálculo)

**Files:**
- Modify: `src/app/api/products/route.ts`

**Step 1: GET — filtro por categoryId, include category, filtros desde tabla**

- Cambiar el filtro de categoría (línea ~32):
  ```ts
  if (categoryId) {
    where.categoryId = categoryId;
  }
  ```
  (y leer `categoryId` desde `validateProductsQueryParams`).
- Agregar `category: true` al `include` de ambos `findMany` (junto a `variants: true`).
- Reemplazar el bloque de `uniqueCategories` (líneas ~112-121) por consulta a la tabla:
  ```ts
  const categoriesList = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  const allProducts = await prisma.product.findMany({ select: { brand: true } });
  const uniqueBrands = [...new Set(allProducts.map(p => p.brand).filter((x): x is string => !!x))];
  ```
- En `filters` de la respuesta: `categories: categoriesList`.

**Step 2: POST — calcular precios desde costo + porcentajes**

- `import { computeVariantPrices } from '@/lib/pricing';` arriba.
- En la creación del producto (data), reemplazar `category: productData.category` por:
  ```ts
  categoryId: productData.categoryId,
  marginCash: productData.marginCash ?? 90,
  surchargeDebit: productData.surchargeDebit ?? 5,
  surchargeFinanced: productData.surchargeFinanced ?? 20,
  ```
- Antes de crear variantes, definir los porcentajes efectivos:
  ```ts
  const pct = {
    marginCash: productData.marginCash ?? 90,
    surchargeDebit: productData.surchargeDebit ?? 5,
    surchargeFinanced: productData.surchargeFinanced ?? 20,
  };
  ```
- En `tx.productVariant.create`, reemplazar los 3 precios por el cálculo:
  ```ts
  const prices = computeVariantPrices(variant.costPrice, pct);
  // data:
  costPrice: variant.costPrice,
  priceCash: prices.priceCash,
  priceDebit: prices.priceDebit,
  priceFinanced: prices.priceFinanced,
  ```

**Step 3: Verificar typecheck**

Run: `npx tsc --noEmit 2>&1 | grep "api/products/route" | head`
Expected: sin errores.

**Step 4: Commit**

```bash
git add src/app/api/products/route.ts
git commit -m "feat: products GET filters by categoryId; POST computes prices server-side"
```

### Task 9: `src/app/api/products/[id]/route.ts` (PUT con cálculo)

**Files:**
- Modify: `src/app/api/products/[id]/route.ts`

**Step 1: include category en GET**

En el `findUnique` del GET agregar `category: true` al `include`.

**Step 2: PUT — categoryId, porcentajes y recálculo de precios**

- `import { computeVariantPrices } from '@/lib/pricing';`
- En `tx.product.update` data: reemplazar `category` por `categoryId`, `marginCash`,
  `surchargeDebit`, `surchargeFinanced` (con `?? default`).
- Definir `pct` igual que en Task 8.
- En los `update` y `create` de variantes, reemplazar los 3 precios por
  `computeVariantPrices(variant.costPrice, pct)` (calcular `const prices = ...` dentro de cada `.map`).

**Step 3: Verificar typecheck**

Run: `npx tsc --noEmit 2>&1 | grep "api/products/\[id\]" | head`
Expected: sin errores.

**Step 4: Commit**

```bash
git add src/app/api/products/\[id\]/route.ts
git commit -m "feat: product PUT updates categoryId/percentages and recomputes prices"
```

### Task 10: `src/app/api/sales/[id]/route.ts` (lectura de nombre de categoría)

**Files:**
- Modify: `src/app/api/sales/[id]/route.ts`

**Step 1: Ajustar include y lectura**

- Donde hace `select: { ... category: true ... }` del product, cambiar a incluir la relación:
  `category: { select: { name: true } }` (o include).
- Donde lee `item.productVariant.product.category` (línea ~61), cambiar a
  `item.productVariant.product.category?.name ?? ''`.

**Step 2: Verificar typecheck**

Run: `npx tsc --noEmit 2>&1 | grep "api/sales/\[id\]" | head`
Expected: sin errores.

**Step 3: Commit**

```bash
git add src/app/api/sales/\[id\]/route.ts
git commit -m "refactor: read category name via relation in sale detail"
```

### Task 11: `src/app/api/import/excel/route.ts` (resolver/crear categoría + calcular precios)

**Files:**
- Modify: `src/app/api/import/excel/route.ts`

**Step 1: Resolver categoría por nombre (crear si falta) y calcular precios**

- `import { computeVariantPrices } from '@/lib/pricing';`
- En `insertProducts`, dentro de la transacción, antes de crear el producto, resolver la categoría:
  ```ts
  const categoryRow = await tx.category.upsert({
    where: { name: productData.category },
    update: {},
    create: { name: productData.category },
  });
  ```
  y en `tx.product.create` usar `categoryId: categoryRow.id` (en vez de `category: ...`).
  Quitar `category` del create del producto.
- El Excel ya trae precios; para mantener el modelo nuevo, recalcular desde el costo con
  los defaults (`computeVariantPrices(variant.costPrice)`), y usar esos valores en
  `costPrice/priceCash/priceDebit/priceFinanced` tanto en create como en update de variantes.
  (Los precios del Excel se ignoran salvo el costo. Confirmar con la usuaria si prefiere
  respetar los precios del Excel; por defecto, recalcular para consistencia.)

**Step 2: Verificar typecheck**

Run: `npx tsc --noEmit 2>&1 | grep "import/excel" | head`
Expected: sin errores.

**Step 3: Commit**

```bash
git add src/app/api/import/excel/route.ts
git commit -m "feat: import resolves category by name (upsert) and computes prices"
```

### Task 12: `src/app/api/products/bulk-prices/route.ts` (editar costo + %, recalcular)

**Files:**
- Modify: `src/app/api/products/bulk-prices/route.ts`

**Step 1: GET — filtro por categoryId, include category.name, % del producto, filtros desde tabla**

- En el filtro: `if (category) where.product = { ...where.product, categoryId: category };`
  (el parámetro pasa a ser el id).
- En el `include` del product, traer `category: { select: { name: true } }`,
  `marginCash`, `surchargeDebit`, `surchargeFinanced`.
- Reemplazar el bloque de `categories`/`brands` por consulta a tabla `category.findMany`
  (igual que Task 8) para `filters.categories = [{id,name}]`.
- En `formatted`, exponer `product.category = v.product.category?.name ?? ''`, `product.categoryId`,
  y los porcentajes `marginCash/surchargeDebit/surchargeFinanced` (numéricos).

**Step 2: PUT — recibir costo y/o % y recalcular precios**

- `import { computeVariantPrices } from '@/lib/pricing';`
- Cambiar el tipo de `updates` para aceptar `{ id, costPrice }` y opcionalmente porcentajes
  del producto. Como los % son a nivel producto, el payload debe incluir por cada variante
  el `costPrice` nuevo; los % se toman del producto en BD (o vienen en el update por producto).

  Implementación simple y consistente: por cada update traer la variante con su producto,
  calcular precios con `computeVariantPrices(costPrice, { marginCash, surchargeDebit, surchargeFinanced })`
  usando los % del producto, y guardar costo + 3 precios:
  ```ts
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    await prisma.$transaction(
      await Promise.all(batch.map(async (u) => {
        const variant = await prisma.productVariant.findUnique({
          where: { id: u.id },
          include: { product: { select: { marginCash: true, surchargeDebit: true, surchargeFinanced: true } } },
        });
        const pct = {
          marginCash: Number(variant!.product.marginCash),
          surchargeDebit: Number(variant!.product.surchargeDebit),
          surchargeFinanced: Number(variant!.product.surchargeFinanced),
        };
        const prices = computeVariantPrices(u.costPrice, pct);
        return prisma.productVariant.update({
          where: { id: u.id },
          data: { costPrice: u.costPrice, ...prices },
        });
      }))
    );
    totalUpdated += batch.length;
  }
  ```
  > Nota: si además se quieren editar los % por producto en masa, agregar un segundo bloque
  > que actualice `product.{marginCash,...}` y luego recalcule todas sus variantes. Mantener
  > en este task solo costo+recalculo; el ajuste de % por producto se cubre en la UI (Task 16).

**Step 3: Verificar typecheck**

Run: `npx tsc --noEmit 2>&1 | grep "bulk-prices" | head`
Expected: sin errores.

**Step 4: Commit**

```bash
git add src/app/api/products/bulk-prices/route.ts
git commit -m "feat: bulk-prices edits cost and recomputes prices from product percentages"
```

---

## Fase 6 — UI: ABM de categorías

### Task 13: Página `/categorias` + link en Sidebar

**Files:**
- Create: `src/app/categorias/page.tsx`
- Modify: `src/components/Sidebar.tsx`

**Step 1: Agregar item al menú**

En `src/components/Sidebar.tsx`, importar un ícono (p. ej. `FaTags` de `react-icons/fa`) y
agregar al array `menuItems`, después de "Productos":
```ts
  {
    name: 'Categorías',
    href: '/categorias',
    icon: FaTags,
    disabled: false,
  },
```

**Step 2: Implementar la página ABM**

Crear `src/app/categorias/page.tsx` (client component) que:
- `useEffect` → `GET /api/categories` y guarda `{id,name,productCount}[]`.
- Tabla con columnas: Nombre, # Productos, Acciones (Editar / Borrar).
- Input + botón "Nueva categoría" → `POST /api/categories` (refresca lista).
- Editar inline (o prompt) → `PUT /api/categories/[id]`.
- Borrar → `DELETE /api/categories/[id]`; si responde 409, mostrar el mensaje de error
  (categoría en uso). Botón Borrar deshabilitado cuando `productCount > 0`.
- Usar `AppLayout` como las demás páginas (ver `src/app/productos/page.tsx` como referencia
  de estructura/estilos Tailwind).

**Step 3: Verificar build + prueba manual**

Run: `npm run build`
Expected: build OK.
Manual (`npm run dev`): abrir `/categorias`, crear "Prueba", renombrar, borrar; verificar que
"Paletas" aparece; intentar borrar una categoría con productos → mensaje de bloqueo.

**Step 4: Commit**

```bash
git add src/app/categorias/page.tsx src/components/Sidebar.tsx
git commit -m "feat: add /categorias ABM page and sidebar link"
```

---

## Fase 7 — UI: formularios de producto y lecturas

### Task 14: Formulario `productos/nuevo`

**Files:**
- Modify: `src/app/productos/nuevo/page.tsx`

**Step 1: Reemplazar categorías hardcodeadas por fetch**

- Eliminar `const CATEGORIES = [...]` (líneas ~47-54).
- Agregar estado `const [categories, setCategories] = useState<{id:string;name:string}[]>([])`
  y `useEffect` que hace `GET /api/categories` y setea la lista.
- El `<select>` de categoría (línea ~388) pasa a usar `formData.categoryId` y mapear
  `categories` con `value={c.id}` y texto `{c.name}`.
- En la interfaz/estado del form: cambiar `category: ''` por `categoryId: ''` y agregar
  `marginCash: 90, surchargeDebit: 5, surchargeFinanced: 20`.

**Step 2: Inputs de porcentaje a nivel producto**

Agregar (en la sección de datos del producto) 3 inputs numéricos:
"Margen contado (%)", "Recargo débito (%)", "Recargo financiado (%)" ligados a
`formData.marginCash/surchargeDebit/surchargeFinanced` (defaults 90/5/20).

**Step 3: Variantes — costo editable, precios calculados solo lectura**

- `import { computeVariantPrices } from '@/lib/pricing';`
- Mantener input "Precio Costo".
- Reemplazar los inputs de Contado/Débito/Financiado por campos **solo lectura** que muestren
  `computeVariantPrices(variant.costPrice, { marginCash: formData.marginCash, surchargeDebit: formData.surchargeDebit, surchargeFinanced: formData.surchargeFinanced })`
  (preview en vivo; `readOnly` + estilo gris). No se envían al backend (o se envían y el server
  los recalcula igual).

**Step 4: Submit**

En el `payload` del `POST /api/products`: enviar `categoryId`, `marginCash`,
`surchargeDebit`, `surchargeFinanced`, y por variante solo `costPrice` (+ size/color/sku/stock).

**Step 5: Build + prueba manual**

Run: `npm run build` → OK.
Manual: alta de producto, elegir categoría (incluida Paletas), cargar costo 100 → ver
contado/débito/financiado calculados (200/200/200 con defaults); guardar; verificar en BD.

**Step 6: Commit**

```bash
git add src/app/productos/nuevo/page.tsx
git commit -m "feat: nuevo producto uses category list from API + percentage-based prices"
```

### Task 15: Formulario `productos/[id]/editar`

**Files:**
- Modify: `src/app/productos/[id]/editar/page.tsx`

**Step 1: Mismos cambios que Task 14, adaptados a edición**

- Eliminar `const CATEGORIES` (líneas ~75-86); fetch de `/api/categories`.
- Al cargar el producto (`GET /api/products/[id]`): setear `categoryId` desde el producto
  y `marginCash/surchargeDebit/surchargeFinanced` desde el producto (con defaults si null).
- `<select>` por id; inputs de % a nivel producto; variantes con costo editable y precios
  calculados solo lectura (preview en vivo con `computeVariantPrices`).
- Submit `PUT`: enviar `categoryId`, porcentajes y `costPrice` por variante.

**Step 2: Build + prueba manual**

Run: `npm run build` → OK.
Manual: editar el producto existente, cambiar costo y %, ver recálculo; guardar; verificar.

**Step 3: Commit**

```bash
git add src/app/productos/\[id\]/editar/page.tsx
git commit -m "feat: editar producto uses category API + percentage-based prices"
```

### Task 16: Página `/precios` (actualizador masivo → costo + %)

**Files:**
- Modify: `src/app/precios/page.tsx`

**Step 1: Adaptar a editar costo y %**

- El filtro de categoría pasa a usar `categoryId` (las opciones vienen de `filters.categories`
  como `{id,name}`).
- La tabla muestra: producto, variante, **costo editable**, y los 3 precios **calculados
  (solo lectura)** con `computeVariantPrices` usando los % del producto.
- Agregar edición de los 3 % **por producto** (una fila/encabezado por producto, o un panel
  por producto) que se envía al backend.
- Guardar:
  - Para % por producto: `PUT /api/products/[id]` (o un endpoint dedicado) que actualiza %
    y recalcula todas sus variantes. Alternativa simple: reutilizar bulk-prices PUT enviando
    `costPrice` por variante (recalcula con % actuales del producto) y, si cambió el %,
    primero actualizar el producto.
  - Para costos: `PUT /api/products/bulk-prices` con `{ id, costPrice }[]`.
- Quitar la edición directa de precios finales.

> Si la complejidad de editar % por producto en `/precios` resulta alta, MVP aceptable:
> `/precios` edita solo el **costo** (Task 12 ya recalcula con los % guardados), y la edición
> de % queda en el formulario de producto. Confirmar alcance con la usuaria antes de ampliar.

**Step 2: Build + prueba manual**

Run: `npm run build` → OK.
Manual: en `/precios`, cambiar un costo → ver precios recalculados y persistidos.

**Step 3: Commit**

```bash
git add src/app/precios/page.tsx
git commit -m "feat: /precios edits cost (+ percentages) and shows computed prices"
```

### Task 17: Lecturas de display (`productos`, `ventas/nueva`)

**Files:**
- Modify: `src/app/productos/page.tsx`
- Modify: `src/app/ventas/nueva/page.tsx`

**Step 1: Adaptar lecturas de `category` → `category.name`**

- `src/app/productos/page.tsx`:
  - Interface local: `category` pasa a `{ id: string; name: string }` (o agregar `categoryId`).
  - El filtro de categorías usa `filters.categories` como `{id,name}` (value=id, text=name);
    el estado `selectedCategory` guarda el id y se envía como `categoryId` en el query.
  - Donde muestra `selectedProduct.category` (línea ~410) y `product.category` (línea ~693):
    usar `product.category?.name ?? ''`.
- `src/app/ventas/nueva/page.tsx`:
  - Interface `category` → `category?: { name: string } | string` según lo que devuelva la API;
    el listado de productos viene de `/api/products` (ahora con `category` relación).
    Mostrar `product.category?.name ?? ''` (línea ~381).

**Step 2: Build + prueba manual**

Run: `npm run build` → OK.
Manual: listado de productos filtra por categoría; ventas/nueva muestra categoría.

**Step 3: Commit**

```bash
git add src/app/productos/page.tsx src/app/ventas/nueva/page.tsx
git commit -m "refactor: display category.name and filter by categoryId in product/sales UI"
```

---

## Fase 8 — Verificación final

### Task 18: Build + test de pricing + smoke manual

**Step 1: Typecheck/build completo**

Run: `npm run build`
Expected: build OK, sin errores de TypeScript.

**Step 2: Test del cálculo**

Run: `npx tsx scripts/test-pricing.ts`
Expected: "✅ Todos los tests de pricing pasaron".

**Step 3: Smoke manual (`npm run dev`)**

- `/categorias`: crear, renombrar, borrar; "Paletas" presente; borrar en uso → bloqueado.
- `/productos/nuevo`: alta con Paletas + costo → precios calculados/redondeados; guardar.
- `/productos/[id]/editar`: cambiar costo/% → recálculo; guardar.
- `/precios`: cambiar costo → recálculo persistido.
- `/ventas/nueva` y listado `/productos`: categoría se muestra OK.

**Step 4: Commit final (si quedaron ajustes)**

```bash
git add -A
git commit -m "chore: final adjustments for categories + pricing feature"
```

---

## Resumen de archivos

**Crear:** `src/lib/pricing.ts`, `scripts/test-pricing.ts`,
`src/app/api/categories/route.ts`, `src/app/api/categories/[id]/route.ts`,
`src/app/categorias/page.tsx`.

**Modificar:** `prisma/schema.prisma`, `prisma/seed.ts`, `src/types/products.ts`,
`src/lib/validation.ts`, `src/app/api/products/route.ts`,
`src/app/api/products/[id]/route.ts`, `src/app/api/sales/[id]/route.ts`,
`src/app/api/import/excel/route.ts`, `src/app/api/products/bulk-prices/route.ts`,
`src/components/Sidebar.tsx`, `src/app/productos/nuevo/page.tsx`,
`src/app/productos/[id]/editar/page.tsx`, `src/app/precios/page.tsx`,
`src/app/productos/page.tsx`, `src/app/ventas/nueva/page.tsx`.
