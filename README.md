# Sistema de Gestión Integral - Ropa Deportiva

Sistema web completo de gestión para negocio de ropa deportiva con:
- ✅ Gestión de inventario (productos y variantes)
- ✅ Control de stock con alertas
- ✅ Compras y ventas
- ✅ Facturación electrónica AFIP
- ✅ Sincronización con Tienda Nube
- ✅ Reportes y análisis

## Stack Tecnológico

- **Frontend:** Next.js 14 + React + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Vercel Postgres + Prisma ORM
- **Auth:** NextAuth.js
- **Hosting:** Vercel

## Desarrollo

Este proyecto está siendo desarrollado con **Ralph**, un sistema de agentes de IA que trabaja de forma autónoma.

### Setup

```bash
# Instalar dependencias
npm install

# Configurar base de datos
npx prisma generate
npx prisma migrate dev

# Iniciar servidor de desarrollo
npm run dev
```

### Ralph (Desarrollo Autónomo)

```bash
# Ejecutar Ralph para desarrollo automático
cd scripts/ralph
./ralph.sh 10
```

Ralph trabaja en iteraciones, completando user stories de forma autónoma:
- Lee `prd.json` con 19 user stories priorizadas
- Implementa una historia por iteración
- Ejecuta tests y typechecking
- Hace commits automáticos
- Actualiza `progress.txt` con aprendizajes

## Roadmap

### Fase 1: MVP (Semanas 1-5)
- [x] Base de datos con productos y variantes
- [ ] Importación desde Excel (193 productos)
- [ ] CRUD de productos
- [ ] Compras y ventas
- [ ] Dashboard básico

### Fase 2: Facturación AFIP (Semanas 6-7)
- [ ] Integración con AFIP
- [ ] Emisión de facturas tipo B
- [ ] PDFs legales

### Fase 3: Tienda Nube (Semanas 8-9)
- [ ] Sincronización bidireccional
- [ ] Webhooks de ventas

### Fase 4: Reportes (Semanas 10+)
- [ ] Analytics avanzados
- [ ] Exportación de datos

## Licencia

Privado - Deportes Laboulaye

---

## 📝 Últimos cambios

### 2026-06-17

**Commits incluidos:**
- 54b6823 docs: auto-update README [skip ci]
- 2477dfc fix(migration): make category FK migration production-safe (seed + backfill before NOT NULL)
- a70833d refactor: display category.name and filter by categoryId in product/sales UI
- b41d471 feat: /precios edits cost and shows computed prices (read-only)
- 56a0c0c feat: editar producto uses category API + percentage-based prices
- bdc19c3 feat: nuevo producto uses category list from API + percentage-based prices
- 7e87583 feat: add /categorias ABM page and sidebar link
- 1e0e688 feat: bulk-prices edits cost and recomputes prices from product percentages
- a264520 feat: import resolves category by name (upsert) and computes prices
- 0d41074 refactor: read category name via relation in sale detail
- df6bec3 feat: product PUT updates categoryId/percentages and recomputes prices
- 6a846e2 feat: products GET filters by categoryId; POST computes prices server-side
- 04d4167 feat: add PUT/DELETE /api/categories/[id] with in-use delete guard
- 00d3149 feat: add GET/POST /api/categories
- 1c2238c refactor: update product types and validation for categoryId + percentage pricing
- a19c2d1 feat: seed default categories including Paletas
- 7cb1272 feat: add Category model (FK) and pricing percentage fields to Product
- 187f8cc feat: add pure pricing calculation utility with rounding to nearest 100
- d38b063 docs: Add implementation plan for categories + percentage pricing
- 611cb6c docs: Add design for DB category management + percentage-based pricing

**Archivos modificados:**
  - `.md`: README.md
