# Diseño: Gestión de Categorías (BD) + Cálculo de Precios por Porcentaje

Fecha: 2026-06-15
Estado: Aprobado

Sistema: Next.js (App Router) + Prisma + PostgreSQL. Base de datos prácticamente vacía
(un solo producto de prueba) → no se requiere preservar datos en la migración; se puede
recrear el esquema directamente.

---

## Feature 1 — Gestión de Categorías en base de datos (FK real)

### Problema actual
- `Product.category` es un `String` libre.
- Dos listas `CATEGORIES` **hardcodeadas e inconsistentes**:
  - `src/app/productos/nuevo/page.tsx` → 6 categorías.
  - `src/app/productos/[id]/editar/page.tsx` → 10 categorías distintas.
- No existe forma de crear/editar/borrar categorías desde la app.
- Falta la categoría **"Paletas"**.

### Modelo de datos (`prisma/schema.prisma`)
```prisma
model Category {
  id        String    @id @default(cuid())
  name      String    @unique
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  products  Product[]
  @@map("categories")
}

model Product {
  // ...
  categoryId String   @map("category_id")          // reemplaza a `category String`
  category   Category @relation(fields: [categoryId], references: [id]) // onDelete: Restrict (default)
  // ...
  @@index([categoryId])
}
```
- Se **elimina** la columna de texto `category` de `products`; todo pasa por la relación.
- Borrado **bloqueado**: `onDelete: Restrict` + chequeo explícito en la API que devuelve
  `409` con mensaje claro ("la categoría tiene N productos") si está en uso.

### Migración
Sistema vacío → recrear esquema con `prisma migrate dev`. Seed inicial de categorías
(incluyendo **Paletas**) vía `prisma/seed.ts`.

### API nueva
- `GET    /api/categories` → lista (con conteo de productos) para menús y ABM.
- `POST   /api/categories` → crear (nombre único, no vacío).
- `PUT    /api/categories/[id]` → renombrar.
- `DELETE /api/categories/[id]` → borra solo si no tiene productos; si tiene → `409`.

### UI ABM nueva: `/categorias`
- Item nuevo en `src/components/Sidebar.tsx` (ícono tipo etiqueta).
- Tabla: categoría + cantidad de productos; botón "Nueva categoría"; editar; borrar
  (deshabilitado si tiene productos asignados).

### Sitios a adaptar (string → relación)
- **APIs**: `products/route.ts` (include category, filtro por `categoryId`, dropdown desde
  tabla Category), `products/[id]/route.ts`, `sales/[id]/route.ts`,
  `products/bulk-prices/route.ts`, `import/excel/route.ts` (resuelve/crea categoría por nombre).
- **Forms** `productos/nuevo` + `productos/[id]/editar`: eliminar `const CATEGORIES`;
  cargar opciones desde `/api/categories`; enviar `categoryId`.
- **Lecturas display**: `productos/page.tsx`, `ventas/nueva`, `precios`, `reportes`
  → `product.category.name`.
- **Tipos** `src/types/products.ts` y **`src/lib/validation.ts`** → validar `categoryId`.

---

## Feature 2 — Cálculo de precios por porcentaje

### Objetivo
Cargar solo el **costo**; los precios contado, débito y financiado se **calculan** a partir
de porcentajes editables con valores por defecto.

### Fórmula (recargos sobre el precio CONTADO)
```
contado    = costo   × (1 + margenContado/100)        // default margen = 90
débito     = contado × (1 + recargoDebito/100)        // default = 5
financiado = contado × (1 + recargoFinanciado/100)    // default = 20
```
- Débito y financiado se calculan sobre el **contado sin redondear** (evita acumular error
  de redondeo); luego cada precio final se redondea de forma independiente.

### Redondeo
Cada precio calculado se redondea al **múltiplo de 100 más cercano**:
`round(x / 100) * 100`. Ej (costo $100): contado $190 → **$200**; débito $199,50 → **$200**;
financiado $228 → **$200**.

### Alcance de los porcentajes
Los 3 porcentajes se cargan **una vez por producto** y se aplican al costo de cada variante.

### Modelo de datos (`Product`)
```prisma
marginCash        Decimal @default(90) @map("margin_cash")        @db.Decimal(6,2)
surchargeDebit    Decimal @default(5)  @map("surcharge_debit")    @db.Decimal(6,2)
surchargeFinanced Decimal @default(20) @map("surcharge_financed") @db.Decimal(6,2)
```
La variante **sigue almacenando** `costPrice` + los 3 precios calculados (`priceCash`,
`priceDebit`, `priceFinanced`) para no afectar ventas/reportes/facturas. Los precios se
**recalculan en el servidor** al guardar (única fuente de verdad).

### Lógica compartida
Nueva utilidad `src/lib/pricing.ts` con la función de cálculo + redondeo, usada por:
- APIs (`products` POST/PUT, `import/excel`, `bulk-prices`).
- Front (preview en vivo).

### Formularios (`productos/nuevo` + `editar`)
- Datos del producto: 3 inputs de porcentaje precargados en **90 / 5 / 20**.
- Cada variante: se carga solo **Costo**; los 3 precios se muestran **calculados en vivo y
  en solo lectura**.
- `src/lib/validation.ts`: exige `costPrice` + porcentajes válidos; deja de exigir precios.

### Página `/precios` (actualizador masivo)
Se reconvierte para editar **costo y/o porcentajes** en masa; los precios se recalculan
(consistente con el nuevo modelo). Ya no edita precios finales a mano.

---

## Testing / verificación
- `prisma migrate dev` + seed corren sin error; categoría "Paletas" presente.
- `npm run build` (typecheck) verde.
- Manual:
  - Crear categoría, asignarla a producto nuevo.
  - Intentar borrar categoría en uso → bloqueado con mensaje.
  - Borrar categoría vacía → ok.
  - Alta de producto: cargar costo → ver precios calculados y redondeados a múltiplo de 100.
  - Cambiar porcentajes → precios se recalculan.
  - `/precios`: editar costo/% → precios recalculados.
