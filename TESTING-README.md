# 🧪 Guía de Testing - Sistema Gestión Deportes

## 🎯 Objetivo

Validar que todos los módulos implementados funcionan correctamente antes de ir a producción.

---

## 📋 Preparación del Ambiente de Testing

### Paso 1: Clonar/Actualizar Repositorio

```bash
git pull origin main
npm install
```

### Paso 2: Configurar Variables de Entorno

Asegúrate de tener `.env` configurado:

```env
DATABASE_URL="tu-connection-string"
JWT_SECRET="tu-secret-key"
```

### Paso 3: Generar Datos de Prueba

```bash
# Opción A: Usar script de generación automática
node scripts/generate-test-data.js

# Opción B: Reset completo (⚠️ BORRA TODA LA DATA)
npx prisma migrate reset
npx prisma db seed
node scripts/generate-test-data.js
```

### Paso 4: Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Abre: http://localhost:3000

---

## 🔐 Credenciales de Prueba

**Usuario Admin:**
- Email: `admin@deporteslaboulaye.com`
- Password: `Admin123!`

---

## 📝 Documentación de Testing

Hay 2 documentos de testing:

### 1. `TESTING.md` - Plan Completo
- **Duración estimada:** 2-3 horas
- **Casos de prueba detallados:** ~50 test cases
- **Flujos end-to-end completos**
- **Casos edge y validaciones**

**Usar cuando:**
- Testing exhaustivo pre-producción
- Entrega a QA team
- Documentación oficial

### 2. `TESTING-CHECKLIST.md` - Checklist Rápido  
- **Duración estimada:** 30 minutos
- **Tests esenciales críticos**
- **Formato checklist interactivo**

**Usar cuando:**
- Validación rápida post-deploy
- Testing de smoke
- Verificación después de hotfix

---

## 🚀 Guía de Testing Paso a Paso

### Nivel 1: Smoke Test (10 min)

**Objetivo:** Verificar que el sistema está operativo

1. ✅ Login funciona
2. ✅ Dashboard carga sin errores
3. ✅ Puedes navegar entre módulos
4. ✅ No hay errores en consola de JavaScript

**Si todo pasa → Continuar al Nivel 2**

---

### Nivel 2: Funcionalidad Básica (20 min)

**Objetivo:** Validar CRUD básico en cada módulo

#### Productos
1. Crear producto nuevo
2. Editar producto existente
3. Buscar producto
4. Ver detalle

#### Proveedores
1. Crear proveedor
2. Editar proveedor
3. Desactivar proveedor

#### Compras
1. Registrar compra
2. Verificar stock incrementado
3. Ver detalle de compra

#### Ventas
1. Registrar venta
2. Verificar stock decrementado
3. Ver detalle de venta

**Si todo pasa → Continuar al Nivel 3**

---

### Nivel 3: Validaciones Críticas (15 min)

**Objetivo:** Verificar lógica de negocio

#### Test 1: Validación de Stock
```
1. Producto X tiene stock = 5
2. Intentar vender 10 unidades
3. ❌ Debe rechazar con mensaje claro
```

#### Test 2: Actualización de Stock (Compra)
```
1. Producto Y stock inicial = 10
2. Registrar compra de 20 unidades
3. ✅ Stock debe ser = 30
```

#### Test 3: Actualización de Stock (Venta)
```
1. Producto Z stock inicial = 15
2. Registrar venta de 5 unidades
3. ✅ Stock debe ser = 10
```

#### Test 4: Tipo de Precio Dinámico
```
1. Agregar item a venta con precio contado
2. Cambiar tipo a "Débito"
3. ✅ Precio debe actualizarse automáticamente
```

**Si todo pasa → Sistema APROBADO para producción**

---

### Nivel 4: Testing Exhaustivo (Opcional - 2-3 horas)

Seguir `TESTING.md` completo para testing profesional.

---

## 🐛 Reportar Issues

### Formato Sugerido

```markdown
## [PRIORIDAD] Título del Bug

**Módulo:** Ventas  
**Test Case:** TC-VENT-002

**Pasos para Reproducir:**
1. Ir a /ventas/nueva
2. Agregar producto sin stock
3. ...

**Esperado vs Actual:**
- Esperado: Error "Stock insuficiente"
- Actual: Permite agregar al carrito

**Severidad:** Alta
```

### Niveles de Prioridad

- **🔴 CRÍTICA**: Pérdida de datos, stock inconsistente, no permite operar
- **🟠 ALTA**: Funcionalidad principal no funciona, errores frecuentes
- **🟡 MEDIA**: Problemas de UX, validaciones faltantes
- **🟢 BAJA**: Mejoras cosméticas, textos, pequeños ajustes

---

## ✅ Criterios de Aprobación

### Para ir a Producción, el sistema debe:

- ✅ **0 bugs críticos** (data loss, stock inconsistency)
- ✅ **< 3 bugs altos** (funcionalidad principal afectada)
- ✅ **Flujos principales funcionan** (login, productos, ventas, compras)
- ✅ **Stock management funciona** (compras suman, ventas restan)
- ✅ **Validaciones funcionan** (no overselling)
- ✅ **Mobile usable** (menú funciona, tablas visibles)
- ✅ **Performance aceptable** (< 3 segundos carga inicial)

---

## 📊 Checklist de Preparación

Antes de comenzar el testing:

- [ ] `.env` configurado correctamente
- [ ] Base de datos limpia o con datos de prueba
- [ ] `npm install` ejecutado
- [ ] Servidor corriendo sin errores
- [ ] Browser DevTools abierto (Console + Network tabs)
- [ ] Documentos de testing listos (`TESTING-CHECKLIST.md`)
- [ ] Notas/documento para anotar bugs

---

## 🎬 Videos de Referencia (Opcional)

Si es posible, graba los tests críticos:

1. **Flujo de compra completo** (desde búsqueda hasta stock actualizado)
2. **Flujo de venta completo** (desde búsqueda hasta stock decrementado)
3. **Validación de stock insuficiente**
4. **Navegación responsive (mobile)**

Esto ayuda a:
- Documentar comportamiento correcto
- Onboarding de nuevos usuarios
- Debugging futuro

---

## 🔧 Comandos Útiles Durante Testing

```bash
# Ver logs de Prisma (queries SQL)
# Agregar a .env: DEBUG=prisma:query

# Verificar build antes de deploy
npm run build

# Linter (verificar código)
npm run lint

# TypeScript check
npx tsc --noEmit

# Ver info de la base de datos
npx prisma studio
```

---

## 📞 Contacto y Soporte

Si encuentras issues bloqueantes o tienes dudas:

1. **Crear Issue en GitHub** con formato sugerido
2. **Documentar en TESTING-CHECKLIST.md**
3. **Notificar al equipo de desarrollo**

---

## 🎉 Después del Testing

Una vez aprobado:

1. ✅ Marcar issues encontrados (si los hay)
2. ✅ Documentar en `TESTING-RESULTS.md`
3. ✅ Planificar fixes si es necesario
4. ✅ Proceder con deployment a producción
5. ✅ Capacitación a usuarios finales

---

**¡Éxito con el testing! 🚀**

Si tienes dudas sobre algún test case o comportamiento esperado, consulta `TESTING.md` para detalles completos.
