# 🧪 Plan de Testing Completo - Sistema Gestión Deportes

**Fecha**: 13 de enero de 2026  
**Versión**: MVP v1.0  
**User Stories Implementadas**: 14/20 (70%)

---

## 📋 Módulos a Testear

### ✅ Implementados y Listos para Testing
1. **Autenticación** (US-016)
2. **Dashboard** (US-012)
3. **Productos** (US-001 a US-005, US-019)
4. **Proveedores** (US-017)
5. **Compras** (US-006 a US-008)
6. **Ventas** (US-009 a US-011)
7. **Layout y Navegación** (US-018)

---

## 🎯 Test Cases por Módulo

### 1. AUTENTICACIÓN (US-016)

#### TC-AUTH-001: Login Exitoso
**Pasos:**
1. Ir a `/login`
2. Ingresar email: `admin@deporteslaboulaye.com`
3. Ingresar password: `Admin123!`
4. Click en "Iniciar Sesión"

**Resultado Esperado:**
- ✅ Redirección a `/dashboard`
- ✅ Header muestra nombre de usuario
- ✅ Sidebar visible con todas las opciones
- ✅ No se puede acceder a `/login` (redirect automático)

#### TC-AUTH-002: Login con Credenciales Incorrectas
**Pasos:**
1. Ir a `/login`
2. Ingresar credenciales incorrectas
3. Click en "Iniciar Sesión"

**Resultado Esperado:**
- ❌ Error: "Credenciales incorrectas"
- ✅ Permanece en `/login`
- ✅ No hay redirección

#### TC-AUTH-003: Logout
**Pasos:**
1. Estando logueado
2. Click en "Cerrar Sesión" (header)

**Resultado Esperado:**
- ✅ Redirección a `/login`
- ✅ No se puede acceder a rutas protegidas sin login
- ✅ Sesión eliminada correctamente

#### TC-AUTH-004: Protección de Rutas
**Pasos:**
1. Sin estar logueado
2. Intentar acceder a `/dashboard`, `/productos`, `/ventas`

**Resultado Esperado:**
- ✅ Redirección automática a `/login`
- ✅ Mensaje o indicación de que se requiere autenticación

---

### 2. DASHBOARD (US-012)

#### TC-DASH-001: Visualización de Métricas
**Pre-condición:** Debe haber al menos 1 venta y productos con stock bajo

**Pasos:**
1. Login y ir a `/dashboard`

**Resultado Esperado:**
- ✅ Card "Ventas de Hoy" muestra monto correcto
- ✅ Card "Ventas del Mes" muestra total del mes
- ✅ Card "Stock Bajo" muestra cantidad de productos críticos
- ✅ Card "Total Productos" muestra cantidad total
- ✅ Números son coherentes con los datos reales

#### TC-DASH-002: Últimas Ventas
**Pre-condición:** Debe haber al menos 1 venta registrada

**Pasos:**
1. En dashboard, scroll a sección "Últimas Ventas"

**Resultado Esperado:**
- ✅ Muestra máximo 5 ventas
- ✅ Cada venta muestra: monto, fecha, método de pago, cantidad de items
- ✅ Link "Ver todas" funciona → redirección a `/ventas`
- ✅ Ventas ordenadas por fecha descendente (más reciente primero)

#### TC-DASH-003: Stock Crítico
**Pre-condición:** Debe haber productos con stock ≤ mínimo

**Pasos:**
1. En dashboard, verificar sección "Stock Crítico"

**Resultado Esperado:**
- ✅ Banner rojo de alerta visible
- ✅ Muestra máximo 5 productos
- ✅ Badge rojo para stock = 0, amarillo para stock bajo
- ✅ Muestra: producto, variante, stock actual vs mínimo
- ✅ Link "Ver todos" funciona
- ✅ Link "Registrar compra" lleva a `/compras/nueva`

#### TC-DASH-004: Acciones Rápidas
**Pasos:**
1. En dashboard, verificar sección "Acciones Rápidas"
2. Probar cada botón

**Resultado Esperado:**
- ✅ "Nueva Venta" → `/ventas/nueva`
- ✅ "Nueva Compra" → `/compras/nueva`
- ✅ "Nuevo Producto" → `/productos/nuevo`
- ✅ "Reportes" → `/reportes`
- ✅ Efectos hover visibles

#### TC-DASH-005: Empty States
**Pre-condición:** Sistema sin ventas

**Pasos:**
1. Dashboard con base de datos limpia

**Resultado Esperado:**
- ✅ Sección ventas muestra mensaje: "No hay ventas registradas"
- ✅ Link "Registrar primera venta"
- ✅ Sección stock muestra: "✓ Todos los productos tienen stock adecuado"

---

### 3. PRODUCTOS (US-001 a US-005)

#### TC-PROD-001: Listado de Productos
**Pasos:**
1. Ir a `/productos`

**Resultado Esperado:**
- ✅ Tabla con todos los productos
- ✅ Columnas: Imagen, Producto, Categoría, Marca, Variantes, Stock, Acciones
- ✅ Paginación funcional (si hay >20 productos)
- ✅ Botón "Nuevo Producto" visible

#### TC-PROD-002: Búsqueda de Productos
**Pasos:**
1. En `/productos`
2. Escribir texto en buscador
3. Probar búsqueda por: nombre, marca, código de barras

**Resultado Esperado:**
- ✅ Resultados filtrados en tiempo real (debounce 300ms)
- ✅ Búsqueda case-insensitive
- ✅ Mensaje si no hay resultados

#### TC-PROD-003: Filtros
**Pasos:**
1. En `/productos`
2. Probar filtros: Categoría, Marca, Stock Bajo

**Resultado Esperado:**
- ✅ Filtros se aplican correctamente
- ✅ Se pueden combinar filtros
- ✅ Botón "Limpiar filtros" funciona
- ✅ Contadores de resultados actualizados

#### TC-PROD-004: Ver Detalle de Producto
**Pasos:**
1. En listado, click en "Ver Detalle"

**Resultado Esperado:**
- ✅ Modal con información completa del producto
- ✅ Lista de variantes con: talla, color, SKU, precios, stock
- ✅ Botón "Cerrar" funciona

#### TC-PROD-005: Crear Producto Nuevo
**Pasos:**
1. Click en "Nuevo Producto"
2. Llenar formulario:
   - Nombre: "Producto Test"
   - Marca: "Test Brand"
   - Categoría: "Test"
   - Código de barras: "123456"
3. Agregar 2 variantes con diferentes tallas/colores
4. Ingresar precios y stocks
5. Click "Guardar"

**Resultado Esperado:**
- ✅ Validación de campos requeridos
- ✅ SKU auto-generado para cada variante
- ✅ Guardado exitoso
- ✅ Toast de éxito
- ✅ Redirección a listado
- ✅ Producto aparece en la tabla

#### TC-PROD-006: Editar Producto
**Pasos:**
1. En listado, click "Editar"
2. Modificar nombre y agregar 1 variante nueva
3. Guardar

**Resultado Esperado:**
- ✅ Formulario pre-llenado con datos existentes
- ✅ Badges distinguen variantes existentes vs nuevas
- ✅ Cambios guardados correctamente
- ✅ Toast de éxito

#### TC-PROD-007: Eliminar Producto (Validación)
**Pasos:**
1. Intentar eliminar producto con stock > 0

**Resultado Esperado:**
- ❌ Error: No se puede eliminar producto con stock
- ✅ Mensaje descriptivo

#### TC-PROD-008: Eliminar Producto (Exitoso)
**Pasos:**
1. Eliminar producto sin stock
2. Confirmar en modal

**Resultado Esperado:**
- ✅ Modal de confirmación
- ✅ Producto eliminado
- ✅ Ya no aparece en listado

---

### 4. PROVEEDORES (US-017)

#### TC-PROV-001: Listado de Proveedores
**Pasos:**
1. Ir a `/proveedores`

**Resultado Esperado:**
- ✅ Cards de estadísticas (Total, Activos, Inactivos)
- ✅ Tabla con proveedores
- ✅ Botón "Nuevo Proveedor"

#### TC-PROV-002: Crear Proveedor
**Pasos:**
1. Click "Nuevo Proveedor"
2. Llenar:
   - Nombre: "Proveedor Test"
   - Email: "test@test.com"
   - Teléfono: "123456789"
   - Dirección: "Calle Test 123"
3. Guardar

**Resultado Esperado:**
- ✅ Validación de campos requeridos
- ✅ Guardado exitoso
- ✅ Aparece en listado
- ✅ Estado = Activo por defecto

#### TC-PROV-003: Editar Proveedor
**Pasos:**
1. Click "Editar" en un proveedor
2. Modificar datos
3. Guardar

**Resultado Esperado:**
- ✅ Formulario pre-llenado
- ✅ Cambios guardados
- ✅ Toast de éxito

#### TC-PROV-004: Desactivar Proveedor (Soft Delete)
**Pasos:**
1. Click icono de "Desactivar"
2. Confirmar

**Resultado Esperado:**
- ✅ Proveedor marcado como inactivo
- ✅ Badge cambia a "Inactivo"
- ✅ No aparece por defecto (toggle off)

#### TC-PROV-005: Toggle Mostrar Inactivos
**Pasos:**
1. Activar toggle "Mostrar inactivos"

**Resultado Esperado:**
- ✅ Se muestran proveedores inactivos
- ✅ Visualmente diferenciados

#### TC-PROV-006: Ver Detalle de Proveedor
**Pasos:**
1. Click "Ver Detalle"

**Resultado Esperado:**
- ✅ Modal con información completa
- ✅ Datos de contacto visibles

---

### 5. COMPRAS (US-006 a US-008)

#### TC-COMP-001: Listado de Compras
**Pasos:**
1. Ir a `/compras`

**Resultado Esperado:**
- ✅ Tabla con compras registradas
- ✅ Columnas: Fecha, Proveedor, Items, Total, Estado
- ✅ Botón "Nueva Compra"

#### TC-COMP-002: Registrar Nueva Compra
**Pasos:**
1. Click "Nueva Compra"
2. Seleccionar proveedor activo
3. Buscar producto (por nombre o SKU)
4. Seleccionar variante
5. Ingresar cantidad: 10
6. Ingresar costo unitario: 100
7. Agregar otro item
8. Click "Registrar Compra"

**Resultado Esperado:**
- ✅ Búsqueda de productos en tiempo real funciona
- ✅ Dropdown muestra productos con variantes
- ✅ Costo unitario se auto-llena con precio anterior
- ✅ Stock actual visible por variante
- ✅ Subtotales calculados automáticamente
- ✅ Total general correcto
- ✅ Validación: no permite proveedores inactivos
- ✅ Validación: cantidad > 0
- ✅ Compra guardada exitosamente
- ✅ **CRÍTICO**: Stock incrementado automáticamente
- ✅ Toast de éxito

#### TC-COMP-003: Validación de Stock Actualizado
**Pasos:**
1. Antes de compra: anotar stock de variante X
2. Registrar compra de 10 unidades de variante X
3. Verificar stock después

**Resultado Esperado:**
- ✅ Stock nuevo = Stock anterior + 10
- ✅ Visible en listado de productos
- ✅ Visible en dashboard si afectó stock bajo

#### TC-COMP-004: Ver Detalle de Compra
**Pasos:**
1. En listado, click "Ver Detalle"

**Resultado Esperado:**
- ✅ Modal con información completa
- ✅ Proveedor, fecha, items, cantidades, costos
- ✅ Total correcto

---

### 6. VENTAS (US-009 a US-011)

#### TC-VENT-001: Listado de Ventas
**Pasos:**
1. Ir a `/ventas`

**Resultado Esperado:**
- ✅ Cards de estadísticas (Hoy, Mes, Total, Promedio)
- ✅ Tabla con ventas registradas
- ✅ Columnas: Fecha, Método Pago, Tipo Precio, Items, Total
- ✅ Botón "Nueva Venta"

#### TC-VENT-002: Registrar Nueva Venta - Flujo Completo
**Pre-condición:** Productos con stock > 0 y precios configurados

**Pasos:**
1. Click "Nueva Venta"
2. Seleccionar fecha (hoy por defecto)
3. Método de pago: Efectivo
4. Tipo de precio: Contado
5. Buscar producto en buscador
6. Seleccionar variante con stock
7. Verificar que precio mostrado = priceCash
8. Agregar otro item
9. Cambiar tipo de precio a "Débito"
10. Verificar que precios se actualizan automáticamente
11. Agregar nota: "Venta de prueba"
12. Click "Registrar Venta"

**Resultado Esperado:**
- ✅ Fecha = hoy por defecto
- ✅ Búsqueda en tiempo real funciona
- ✅ Solo muestra variantes con stock > 0
- ✅ Precio se resalta según tipo seleccionado
- ✅ Los 3 precios visibles por item
- ✅ Al cambiar tipo precio, todos los items se actualizan
- ✅ Cantidad por defecto = 1
- ✅ Subtotales correctos
- ✅ Total general correcto
- ✅ Panel resumen sticky (visible al scroll)
- ✅ Venta guardada exitosamente
- ✅ **CRÍTICO**: Stock decrementado automáticamente
- ✅ Redirección a `/ventas`
- ✅ Toast de éxito con total

#### TC-VENT-003: Validación de Stock en Venta
**Pasos:**
1. Agregar producto con stock = 2
2. Intentar cantidad = 5

**Resultado Esperado:**
- ❌ No permite cantidad > stock disponible
- ✅ Mensaje: "Stock insuficiente. Disponible: 2"
- ✅ Input se limita al máximo disponible

#### TC-VENT-004: Validación Stock Insuficiente al Guardar
**Pasos:**
1. Agregar item con cantidad = todo el stock
2. En otra pestaña, registrar venta del mismo item
3. Volver y intentar guardar

**Resultado Esperado:**
- ❌ Error del servidor: "Stock insuficiente para [producto]"
- ✅ Mensaje descriptivo con producto afectado
- ✅ No se crea la venta (transacción rollback)

#### TC-VENT-005: Incrementar/Decrementar Cantidad
**Pasos:**
1. Agregar item
2. Cambiar cantidad manualmente
3. Verificar límites

**Resultado Esperado:**
- ✅ Input numérico funciona
- ✅ No permite cantidad < 1
- ✅ No permite cantidad > stock
- ✅ Subtotal se recalcula automáticamente

#### TC-VENT-006: Eliminar Item de Venta
**Pasos:**
1. Agregar 2 items
2. Eliminar uno con botón 🗑️

**Resultado Esperado:**
- ✅ Item eliminado de la lista
- ✅ Total recalculado
- ✅ Contador de items actualizado

#### TC-VENT-007: Ver Detalle de Venta
**Pasos:**
1. En listado, click "Ver detalle"

**Resultado Esperado:**
- ✅ Modal con información completa
- ✅ Fecha, método pago, tipo precio
- ✅ Lista de items con: producto, variante, cantidad, precio unitario, subtotal
- ✅ Total correcto
- ✅ Notas visibles (si existen)

#### TC-VENT-008: Validación Stock Actualizado Post-Venta
**Pasos:**
1. Antes de venta: stock variante Y = 10
2. Vender 3 unidades de variante Y
3. Verificar stock después

**Resultado Esperado:**
- ✅ Stock nuevo = 7 (10 - 3)
- ✅ Visible en listado productos
- ✅ Dashboard actualizado si entró en stock bajo

---

### 7. NAVEGACIÓN Y LAYOUT (US-018)

#### TC-NAV-001: Sidebar Desktop
**Pasos:**
1. En desktop (>1024px)
2. Verificar sidebar

**Resultado Esperado:**
- ✅ Sidebar visible permanentemente
- ✅ Links: Dashboard, Productos, Ventas, Compras, Proveedores, Reportes, Configuración
- ✅ Item activo resaltado
- ✅ Iconos visibles

#### TC-NAV-002: Mobile Drawer
**Pasos:**
1. En mobile (<768px)
2. Click hamburger menu

**Resultado Esperado:**
- ✅ Drawer se abre desde la izquierda
- ✅ Overlay oscuro visible
- ✅ Mismos links que desktop
- ✅ Click overlay cierra drawer

#### TC-NAV-003: Header
**Pasos:**
1. Verificar header en todas las páginas

**Resultado Esperado:**
- ✅ Logo/título visible
- ✅ Nombre usuario visible (ej: "Admin User")
- ✅ Botón "Cerrar Sesión" funciona

#### TC-NAV-004: Footer
**Pasos:**
1. Scroll al final de cualquier página

**Resultado Esperado:**
- ✅ Footer con info del sistema
- ✅ Versión o copyright visible

#### TC-NAV-005: Navegación Entre Módulos
**Pasos:**
1. Navegar: Dashboard → Productos → Ventas → Compras → Dashboard

**Resultado Esperado:**
- ✅ Transiciones suaves
- ✅ No errores de consola
- ✅ Item activo cambia correctamente
- ✅ Breadcrumbs o título actualizado

---

## 🔄 Flujos de Negocio End-to-End

### E2E-001: Flujo Completo de Inventario
**Escenario:** Desde producto sin stock hasta venta

**Pasos:**
1. Crear producto nuevo con variantes (stock = 0)
2. Verificar aparece en Dashboard "Stock Crítico"
3. Crear orden de compra para ese producto (cantidad = 20)
4. Verificar stock actualizado a 20
5. Verificar ya NO aparece en stock crítico
6. Registrar venta de 5 unidades
7. Verificar stock actualizado a 15
8. Dashboard refleja la venta en "Ventas de Hoy"

**Resultado Esperado:**
- ✅ Flujo completo sin errores
- ✅ Stock siempre consistente
- ✅ Dashboard actualizado correctamente

### E2E-002: Ciclo de Compra-Venta
**Pasos:**
1. Registrar compra de 10 unidades producto X (costo $100 c/u)
2. Stock = 10
3. Vender 3 unidades (precio contado $150)
4. Stock = 7
5. Dashboard muestra:
   - Venta de $450 en "Hoy"
   - Stock reducido

**Resultado Esperado:**
- ✅ Números consistentes
- ✅ Transacciones atómicas exitosas

### E2E-003: Múltiples Usuarios (Concurrencia)
**Simulación:**
1. Usuario A: Agregar producto a venta
2. Usuario B: Registrar venta del mismo producto
3. Usuario A: Intentar completar venta

**Resultado Esperado:**
- ✅ API valida stock en tiempo real
- ✅ Si no hay stock, error descriptivo
- ✅ No overselling

---

## ⚠️ Casos Edge y Validaciones

### EDGE-001: Búsquedas Sin Resultados
- ✅ Mensaje apropiado en todas las búsquedas
- ✅ No errores de JavaScript

### EDGE-002: Formularios Vacíos
- ✅ Validación HTML5 funciona
- ✅ Mensajes de error claros

### EDGE-003: Productos Sin Variantes
- ✅ Sistema maneja correctamente
- ✅ No permite ventas/compras

### EDGE-004: Valores Decimales en Precios
- ✅ Se manejan correctamente
- ✅ Formato de moneda consistente

### EDGE-005: Fechas Futuras/Pasadas
- ✅ Sistema acepta fechas razonables
- ✅ Cálculos de "hoy" y "mes" correctos

### EDGE-006: Proveedores Inactivos
- ✅ No aparecen en selector de compras
- ✅ No se pueden usar para nuevas compras

### EDGE-007: Productos Sin Precios
- ✅ No aparecen en selector de ventas
- ✅ Están deshabilitados con indicación visual

---

## 🐛 Issues Conocidos a Verificar

1. **Sincronización Dashboard**: ¿Se actualiza automáticamente tras venta/compra?
2. **Performance**: ¿Búsquedas rápidas con 100+ productos?
3. **Formato Moneda**: ¿Consistente en todo el sistema?
4. **Timezone**: ¿Fechas en zona horaria correcta (Argentina)?
5. **Mobile UX**: ¿Tablas responsive funcionan bien?

---

## 📊 Checklist de Testing

### Pre-Testing
- [ ] Base de datos con datos de prueba realistas
- [ ] Al menos 20 productos con variantes
- [ ] 5 proveedores activos
- [ ] 10 compras registradas
- [ ] 10 ventas registradas
- [ ] Productos con stock bajo para alertas

### Durante Testing
- [ ] Abrir DevTools > Console (verificar sin errores)
- [ ] Verificar Network tab (requests 200 OK)
- [ ] Probar en Chrome y Safari
- [ ] Probar en Desktop (1920x1080) y Mobile (375x667)
- [ ] Anotar cualquier comportamiento extraño

### Post-Testing
- [ ] Documentar bugs encontrados
- [ ] Priorizar issues (Crítico, Alto, Medio, Bajo)
- [ ] Crear lista de mejoras de UX
- [ ] Validar que no hay data corruption

---

## 📝 Reporte de Testing

**Formato para reportar issues:**

```markdown
### [PRIORIDAD] Título del Issue

**Módulo:** [Dashboard/Productos/Ventas/etc]
**User Story:** US-XXX
**Test Case:** TC-XXX-XXX

**Pasos para Reproducir:**
1. ...
2. ...
3. ...

**Resultado Esperado:**
...

**Resultado Actual:**
...

**Screenshots/Video:**
[adjuntar si es posible]

**Severidad:** Crítica/Alta/Media/Baja
**Sugerencia de Fix:**
...
```

---

## ✅ Criterios de Aprobación

**MVP puede ir a producción si:**
- ✅ 0 bugs críticos (pérdida de datos, errores de stock)
- ✅ < 3 bugs altos
- ✅ Flujos principales funcionan (compra, venta, inventario)
- ✅ No hay errores de console graves
- ✅ Performance aceptable (<3s carga inicial)
- ✅ Mobile usable (sin scroll horizontal, botones clickeables)

---

## 🚀 Próximos Pasos Post-Testing

1. **Fix de Bugs**: Corregir issues encontrados
2. **Optimizaciones**: Performance, UX improvements
3. **User Stories Restantes**: US-013, US-014, US-015...
4. **Capacitación**: Documentar para usuarios finales
5. **Deployment**: Validar en producción

---

**Nota**: Este es un plan de testing manual. Para CI/CD considera agregar:
- Tests unitarios (Jest)
- Tests E2E (Playwright/Cypress)
- Tests de integración API
