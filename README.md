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
- (sin commits pendientes)

**Archivos modificados:**
  - `.tsx`: page.tsx
