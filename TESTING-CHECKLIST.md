# ✅ Checklist Rápido de Testing

**Última actualización:** 13/01/2026  
**Versión:** MVP v1.0

---

## 🎯 Testing Esencial (30 min)

### 1. AUTENTICACIÓN (5 min)
- [ ] Login exitoso con credenciales correctas
- [ ] Error con credenciales incorrectas
- [ ] Logout funciona
- [ ] Rutas protegidas redirectan a login

### 2. DASHBOARD (5 min)
- [ ] Métricas muestran números correctos
- [ ] Últimas ventas visibles (si hay ventas)
- [ ] Stock crítico visible (si hay stock bajo)
- [ ] Acciones rápidas funcionan (links)
- [ ] No errores en console

### 3. PRODUCTOS (5 min)
- [ ] Listado carga correctamente
- [ ] Búsqueda funciona
- [ ] Crear producto nuevo → exitoso
- [ ] Editar producto → cambios guardados
- [ ] Ver detalle → modal muestra info completa

### 4. PROVEEDORES (3 min)
- [ ] Listado visible
- [ ] Crear proveedor → exitoso
- [ ] Editar funciona
- [ ] Soft delete (desactivar) funciona

### 5. COMPRAS (5 min)
- [ ] Registrar compra nueva
- [ ] Búsqueda de productos funciona
- [ ] Stock se incrementa después de compra ⚠️ CRÍTICO
- [ ] Ver detalle de compra

### 6. VENTAS (5 min)
- [ ] Registrar venta nueva
- [ ] Búsqueda de productos funciona
- [ ] Tipo de precio actualiza precios automáticamente
- [ ] Validación de stock funciona
- [ ] Stock se decrementa después de venta ⚠️ CRÍTICO
- [ ] Ver detalle de venta

### 7. RESPONSIVE (2 min)
- [ ] Mobile: Drawer menú funciona
- [ ] Mobile: Tablas son usables
- [ ] Desktop: Layout correcto

---

## 🔥 Tests Críticos (No pueden fallar)

### CRITICAL-1: Stock Management
**Test:**
1. Producto X tiene stock = 5
2. Registrar compra de 10 unidades
3. Verificar stock = 15
4. Registrar venta de 3 unidades  
5. Verificar stock = 12

**Status:** [ ] PASS [ ] FAIL

---

### CRITICAL-2: Validación de Stock en Venta
**Test:**
1. Producto Y tiene stock = 2
2. Intentar vender 5 unidades
3. Debe mostrar error y no permitir

**Status:** [ ] PASS [ ] FAIL

---

### CRITICAL-3: Transacciones Atómicas
**Test:**
1. Registrar venta con item que tiene stock insuficiente
2. Debe fallar completamente (no venta parcial)
3. Stock no debe cambiar

**Status:** [ ] PASS [ ] FAIL

---

## 🐛 Bugs Encontrados

### Bug #1
**Severidad:** [ ] Crítica [ ] Alta [ ] Media [ ] Baja  
**Módulo:**  
**Descripción:**  

---

### Bug #2
**Severidad:** [ ] Crítica [ ] Alta [ ] Media [ ] Baja  
**Módulo:**  
**Descripción:**  

---

### Bug #3
**Severidad:** [ ] Crítica [ ] Alta [ ] Media [ ] Baja  
**Módulo:**  
**Descripción:**  

---

## 📋 Notas del Testing

### Ambiente
- **URL:** https://[tu-deployment].vercel.app
- **Browser:** Chrome / Safari / Firefox
- **Device:** Desktop / Mobile / Tablet
- **Fecha:** 

### Observaciones Generales

**Performance:**
- Carga inicial: ___ segundos
- Búsquedas: [ ] Rápidas [ ] Lentas
- Transiciones: [ ] Suaves [ ] Con lag

**UX:**
- Navegación: [ ] Intuitiva [ ] Confusa
- Mensajes de error: [ ] Claros [ ] Mejorables
- Responsive: [ ] Excelente [ ] Aceptable [ ] Malo

**Datos:**
- Stock consistente: [ ] Sí [ ] No
- Cálculos correctos: [ ] Sí [ ] No
- Fechas correctas: [ ] Sí [ ] No

---

## ✅ Aprobación

**Sistema listo para producción:**
- [ ] Sí, sin issues críticos
- [ ] Sí, con issues menores documentados
- [ ] No, requiere fixes antes de deployment

**Firmado por:** _______________  
**Fecha:** _______________

---

## 🚀 Quick Commands

```bash
# Limpiar base de datos de testing
npx prisma migrate reset

# Seed con datos de prueba
npx prisma db seed

# Verificar que el build funciona
npm run build

# Correr en local
npm run dev
```
