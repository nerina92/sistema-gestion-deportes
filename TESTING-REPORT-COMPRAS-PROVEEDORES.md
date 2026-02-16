# Testing Report - Compras & Proveedores

**Proyecto:** Sistema de Gestión Deportiva
**Módulos:** COMPRAS (US-006, US-007, US-008) y PROVEEDORES (US-017)
**Fecha:** 2026-02-15
**Tipo:** Testing Manual
**Estado:** READY FOR EXECUTION

---

## ÍNDICE

1. [Información del Sistema](#información-del-sistema)
2. [Configuración Previa](#configuración-previa)
3. [Proveedores - Test Cases](#proveedores---test-cases)
4. [Compras - Test Cases](#compras---test-cases)
5. [Flujos End-to-End](#flujos-end-to-end)
6. [Edge Cases](#edge-cases)
7. [Registro de Ejecución](#registro-de-ejecución)
8. [Bugs Encontrados](#bugs-encontrados)
9. [Resumen](#resumen)

---

## INFORMACIÓN DEL SISTEMA

### Arquitectura Técnica
- **Framework:** Next.js 14 (App Router)
- **Base de datos:** PostgreSQL con Prisma ORM
- **URL Local:** http://localhost:3000
- **Autenticación:** NextAuth.js

### Características Implementadas

#### PROVEEDORES
- CRUD completo de proveedores
- Soft delete (campo `isActive`)
- Validaciones: nombre requerido, email válido opcional
- Filtros: búsqueda por nombre/email, toggle inactivos
- Modal de detalles

#### COMPRAS
- Registro de compras con múltiples items
- Búsqueda de productos en tiempo real
- Selección de variantes por producto
- Actualización automática de stock (transaccional)
- Actualización de precio de costo
- Validaciones completas
- Modal de detalles de compra

### Archivos Principales
```
/src/app/proveedores/page.tsx              - Listado de proveedores
/src/app/proveedores/nuevo/page.tsx        - Crear proveedor
/src/app/proveedores/[id]/editar/page.tsx  - Editar proveedor
/src/app/compras/page.tsx                  - Listado de compras
/src/app/compras/nueva/page.tsx            - Registrar compra
/src/app/api/suppliers/route.ts            - API proveedores
/src/app/api/purchases/route.ts            - API compras
```

---

## CONFIGURACIÓN PREVIA

### 1. Iniciar el Servidor

```bash
# Desde el directorio raíz del proyecto
cd /Users/nuliana/Documents/GitHub/sistema-gestion-deportes

# Instalar dependencias si es necesario
npm install

# Iniciar servidor de desarrollo
npm run dev

# Esperar mensaje:
# ▲ Next.js 14.x
# - Local: http://localhost:3000
# ✓ Ready in Xms
```

### 2. Verificar Servidor Activo

Abrir navegador en: http://localhost:3000

Debe cargar la página de login.

### 3. Iniciar Sesión

**Credenciales:**
- Email: `admin@deporteslaboulaye.com`
- Password: `Admin123!`

### 4. Abrir DevTools

- Presionar `F12` o `Cmd+Option+I` (Mac)
- Ir a la pestaña **Console** para ver errores
- Ir a la pestaña **Network** para ver peticiones API

### 5. Preparar Template de Notas

Crear un archivo de texto para ir registrando los resultados:

```
TEST EXECUTION LOG - COMPRAS & PROVEEDORES
===========================================
Fecha: 2026-02-15
Tester: [Tu nombre]

[Ir completando aquí los resultados]
```

---

## PROVEEDORES - TEST CASES

### TC-PROV-001: Listado de Proveedores

**Objetivo:** Verificar que el listado de proveedores funciona correctamente

**Prioridad:** MEDIA

**Precondiciones:** Usuario autenticado

**Pasos:**

1. Navegar a `/proveedores`
2. Esperar a que cargue la página (spinner debe desaparecer)
3. Observar la página cargada

**Verificaciones:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 1 | Se muestra el título "Proveedores" con ícono de edificio | ⬜ PASS / ⬜ FAIL | |
| 2 | Hay 4 cards de estadísticas: Total, Activos, Con Teléfono, Con Email | ⬜ PASS / ⬜ FAIL | |
| 3 | Los números en las cards son correctos (comparar con tabla) | ⬜ PASS / ⬜ FAIL | |
| 4 | Se muestra una tabla con proveedores | ⬜ PASS / ⬜ FAIL | |
| 5 | Tabla tiene columnas: Proveedor, Contacto, Estado, Acciones | ⬜ PASS / ⬜ FAIL | |
| 6 | Hay un botón "Nuevo Proveedor" (arriba a la derecha) | ⬜ PASS / ⬜ FAIL | |
| 7 | Hay una barra de búsqueda | ⬜ PASS / ⬜ FAIL | |
| 8 | Hay un checkbox "Mostrar inactivos" | ⬜ PASS / ⬜ FAIL | |
| 9 | Hay un botón "Actualizar" | ⬜ PASS / ⬜ FAIL | |
| 10 | Cada fila muestra: nombre, email/teléfono, badge de estado | ⬜ PASS / ⬜ FAIL | |
| 11 | Cada fila tiene botones: Ver (ojo), Editar (lápiz), Desactivar (tacho) | ⬜ PASS / ⬜ FAIL | |
| 12 | Proveedores activos tienen badge verde "🟢 Activo" | ⬜ PASS / ⬜ FAIL | |
| 13 | No hay errores en consola | ⬜ PASS / ⬜ FAIL | |

**Resultado Final:** ⬜ PASS / ⬜ FAIL

**Notas adicionales:**
```
[Anotar aquí cualquier observación]
```

---

### TC-PROV-002: Crear Proveedor

**Objetivo:** Verificar que se puede crear un proveedor correctamente

**Prioridad:** ALTA

**Precondiciones:**
- Usuario autenticado
- En página `/proveedores`

**Pasos:**

1. Click en botón "Nuevo Proveedor"
2. Verificar que navega a `/proveedores/nuevo`
3. Llenar formulario con los siguientes datos:
   - **Nombre:** "Proveedor Testing QA"
   - **Email:** "testing@qa.com"
   - **Teléfono:** "123456789"
   - **Dirección:** "Calle Testing 123"
   - **Notas:** "Proveedor creado para testing manual"
4. Click en botón "Guardar proveedor"
5. Esperar confirmación
6. Verificar redirección a `/proveedores`

**Verificaciones:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 1 | Formulario se muestra correctamente | ⬜ PASS / ⬜ FAIL | |
| 2 | Campo "Nombre" está marcado como requerido (*) | ⬜ PASS / ⬜ FAIL | |
| 3 | Campos tienen íconos apropiados (edificio, email, teléfono, etc.) | ⬜ PASS / ⬜ FAIL | |
| 4 | Hay un banner azul informativo en la parte inferior | ⬜ PASS / ⬜ FAIL | |
| 5 | Hay botones "Guardar proveedor" y "Cancelar" | ⬜ PASS / ⬜ FAIL | |
| 6 | Al guardar, aparece alert "Proveedor creado exitosamente" | ⬜ PASS / ⬜ FAIL | |
| 7 | Redirige a `/proveedores` después de guardar | ⬜ PASS / ⬜ FAIL | |
| 8 | El nuevo proveedor aparece en el listado | ⬜ PASS / ⬜ FAIL | |
| 9 | El proveedor está marcado como "🟢 Activo" por defecto | ⬜ PASS / ⬜ FAIL | |
| 10 | Los datos guardados coinciden con los ingresados | ⬜ PASS / ⬜ FAIL | |
| 11 | No hay errores en consola | ⬜ PASS / ⬜ FAIL | |

**Validación: Campos Requeridos**

12. Intentar guardar con campo "Nombre" vacío
13. Verificar: Aparece error "El nombre es requerido" debajo del campo
14. Verificar: No se envía el formulario

**Validación: Email Inválido**

15. Ingresar email inválido: "correo-invalido"
16. Intentar guardar
17. Verificar: Aparece error "El formato del email no es válido"

**Resultado Final:** ⬜ PASS / ⬜ FAIL

**Datos del Proveedor Creado:**
```
ID: [anotar aquí]
Nombre: Proveedor Testing QA
Email: testing@qa.com
```

---

### TC-PROV-003: Editar Proveedor

**Objetivo:** Verificar que se puede editar un proveedor correctamente

**Prioridad:** ALTA

**Precondiciones:**
- Usuario autenticado
- Existe el proveedor "Proveedor Testing QA" creado en TC-PROV-002

**Pasos:**

1. En `/proveedores`, buscar el proveedor "Proveedor Testing QA"
2. Click en el botón "Editar" (ícono de lápiz)
3. Verificar que navega a `/proveedores/[id]/editar`
4. Verificar que el formulario está pre-llenado con los datos existentes
5. Modificar los siguientes campos:
   - **Teléfono:** Cambiar a "987654321"
   - **Notas:** Agregar " - EDITADO"
6. Click en "Guardar cambios"
7. Esperar confirmación
8. Verificar redirección a `/proveedores`

**Verificaciones:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 1 | URL contiene el ID del proveedor | ⬜ PASS / ⬜ FAIL | |
| 2 | Título muestra "Editar Proveedor" | ⬜ PASS / ⬜ FAIL | |
| 3 | Subtítulo muestra el nombre del proveedor | ⬜ PASS / ⬜ FAIL | |
| 4 | Todos los campos están pre-llenados correctamente | ⬜ PASS / ⬜ FAIL | |
| 5 | Hay radio buttons para "Estado" (Activo/Inactivo) | ⬜ PASS / ⬜ FAIL | |
| 6 | Estado activo está seleccionado por defecto | ⬜ PASS / ⬜ FAIL | |
| 7 | Al guardar, aparece alert "Proveedor actualizado exitosamente" | ⬜ PASS / ⬜ FAIL | |
| 8 | Redirige a `/proveedores` | ⬜ PASS / ⬜ FAIL | |
| 9 | Los cambios se reflejan en el listado | ⬜ PASS / ⬜ FAIL | |
| 10 | Teléfono muestra "987654321" | ⬜ PASS / ⬜ FAIL | |
| 11 | No hay errores en consola | ⬜ PASS / ⬜ FAIL | |

**Resultado Final:** ⬜ PASS / ⬜ FAIL

---

### TC-PROV-004: Desactivar Proveedor (Soft Delete)

**Objetivo:** Verificar que el soft delete funciona correctamente

**Prioridad:** ALTA

**Precondiciones:**
- Usuario autenticado
- Existe el proveedor "Proveedor Testing QA"

**Pasos:**

1. En `/proveedores`, buscar "Proveedor Testing QA"
2. Click en el botón "Desactivar" (ícono de tacho)
3. Se muestra un diálogo de confirmación
4. Click en "Aceptar"
5. Esperar a que se complete la operación

**Verificaciones:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 1 | Aparece confirm del navegador "¿Estás seguro...?" | ⬜ PASS / ⬜ FAIL | |
| 2 | El proveedor desaparece del listado | ⬜ PASS / ⬜ FAIL | |
| 3 | La card "Activos" se decrementa en 1 | ⬜ PASS / ⬜ FAIL | |
| 4 | La página se actualiza automáticamente | ⬜ PASS / ⬜ FAIL | |
| 5 | No hay errores en consola | ⬜ PASS / ⬜ FAIL | |

**Resultado Final:** ⬜ PASS / ⬜ FAIL

---

### TC-PROV-005: Toggle Mostrar Inactivos

**Objetivo:** Verificar que el filtro de proveedores inactivos funciona

**Prioridad:** MEDIA

**Precondiciones:**
- Usuario autenticado
- Existe al menos un proveedor inactivo (el desactivado en TC-PROV-004)

**Pasos:**

1. En `/proveedores`, marcar el checkbox "Mostrar inactivos"
2. Esperar a que recargue
3. Observar la tabla

**Verificaciones:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 1 | La tabla se recarga (puede haber spinner breve) | ⬜ PASS / ⬜ FAIL | |
| 2 | Ahora aparecen proveedores inactivos | ⬜ PASS / ⬜ FAIL | |
| 3 | El proveedor "Proveedor Testing QA" aparece | ⬜ PASS / ⬜ FAIL | |
| 4 | Su badge muestra "⚫ Inactivo" en gris/rojo | ⬜ PASS / ⬜ FAIL | |
| 5 | Proveedores inactivos NO tienen botón de desactivar | ⬜ PASS / ⬜ FAIL | |
| 6 | El contador "Total Proveedores" incluye inactivos | ⬜ PASS / ⬜ FAIL | |
| 7 | No hay errores en consola | ⬜ PASS / ⬜ FAIL | |

**Verificación Inversa:**

8. Desmarcar el checkbox "Mostrar inactivos"
9. Verificar: Proveedores inactivos desaparecen de nuevo

**Resultado Final:** ⬜ PASS / ⬜ FAIL

---

### TC-PROV-006: Ver Detalle de Proveedor

**Objetivo:** Verificar que el modal de detalles funciona correctamente

**Prioridad:** BAJA

**Precondiciones:**
- Usuario autenticado
- Existe al menos un proveedor

**Pasos:**

1. En `/proveedores`, click en el botón "Ver" (ícono de ojo) de cualquier proveedor
2. Observar el modal que se abre
3. Verificar el contenido
4. Click en "Cerrar" o la X

**Verificaciones:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 1 | Se abre un modal centrado con fondo oscuro | ⬜ PASS / ⬜ FAIL | |
| 2 | Título del modal: "Detalles del Proveedor" | ⬜ PASS / ⬜ FAIL | |
| 3 | Hay un botón X arriba a la derecha | ⬜ PASS / ⬜ FAIL | |
| 4 | Se muestran todos los campos: Nombre, Email, Teléfono, Dirección, Notas, Estado, Fecha de registro | ⬜ PASS / ⬜ FAIL | |
| 5 | Los campos vacíos muestran "No especificado" o "Sin notas" | ⬜ PASS / ⬜ FAIL | |
| 6 | La fecha se muestra en español (ej: "15 de febrero de 2026") | ⬜ PASS / ⬜ FAIL | |
| 7 | Hay botones "Cerrar" y "Editar" al final | ⬜ PASS / ⬜ FAIL | |
| 8 | Click en "Cerrar" cierra el modal | ⬜ PASS / ⬜ FAIL | |
| 9 | Click en X cierra el modal | ⬜ PASS / ⬜ FAIL | |
| 10 | Click en "Editar" navega a la página de edición | ⬜ PASS / ⬜ FAIL | |
| 11 | No hay errores en consola | ⬜ PASS / ⬜ FAIL | |

**Resultado Final:** ⬜ PASS / ⬜ FAIL

---

## COMPRAS - TEST CASES

### TC-COMP-001: Listado de Compras

**Objetivo:** Verificar que el listado de compras funciona correctamente

**Prioridad:** MEDIA

**Precondiciones:** Usuario autenticado

**Pasos:**

1. Navegar a `/compras`
2. Esperar a que cargue la página
3. Observar el contenido

**Verificaciones:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 1 | Se muestra el título "Compras" con ícono de paquete morado | ⬜ PASS / ⬜ FAIL | |
| 2 | Hay una barra de búsqueda con placeholder "Buscar por proveedor o ID..." | ⬜ PASS / ⬜ FAIL | |
| 3 | Hay botones "Actualizar" y "Nueva Compra" | ⬜ PASS / ⬜ FAIL | |
| 4 | Se muestra una tabla con compras (si hay) | ⬜ PASS / ⬜ FAIL | |
| 5 | Columnas: ID/Proveedor, Fecha, Items, Total, Estado, Acciones | ⬜ PASS / ⬜ FAIL | |
| 6 | Cada fila muestra: ID corto, nombre proveedor, fecha, cantidad items, total en ARS, badge de estado, botón Ver | ⬜ PASS / ⬜ FAIL | |
| 7 | Las compras están ordenadas por fecha descendente (más recientes primero) | ⬜ PASS / ⬜ FAIL | |
| 8 | Los totales tienen formato de moneda argentina ($ XX.XXX,XX) | ⬜ PASS / ⬜ FAIL | |
| 9 | No hay errores en consola | ⬜ PASS / ⬜ FAIL | |

**Si no hay compras:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 10 | Se muestra mensaje "No hay compras registradas" | ⬜ PASS / ⬜ FAIL | |
| 11 | Hay un botón para "Nueva Compra" en el centro | ⬜ PASS / ⬜ FAIL | |

**Resultado Final:** ⬜ PASS / ⬜ FAIL

---

### TC-COMP-002: Registrar Nueva Compra

**Objetivo:** Verificar el flujo completo de registro de compra

**Prioridad:** 🔴 CRÍTICA

**Precondiciones:**
- Usuario autenticado
- Existe al menos un proveedor activo
- Existen productos con variantes en el sistema
- Conocer el stock actual de al menos un producto

**IMPORTANTE:** Este es el test más crítico del módulo. Tomar notas detalladas.

**Preparación:**

1. Ir a `/productos` y seleccionar un producto
2. Anotar:
   - **Producto:** [nombre]
   - **Variante:** [tamaño/color]
   - **Stock ANTES:** [cantidad]
   - **SKU:** [código]

**Pasos:**

1. Navegar a `/compras`
2. Click en "Nueva Compra"
3. Verificar navegación a `/compras/nueva`
4. **Sección 1: Información de la compra**
   - Seleccionar proveedor: "Proveedor Testing QA" (o cualquier activo)
   - Fecha: dejar la actual
   - Notas: "Compra de prueba - Testing QA"
5. **Sección 2: Items de la compra**
   - En la barra de búsqueda, escribir parte del nombre del producto anotado
   - Esperar que carguen los resultados
   - En el dropdown "Producto", seleccionar el producto
   - En el dropdown "Variante", seleccionar la variante anotada
   - Observar: Se muestra "Stock actual: [cantidad]"
   - Ingresar **Cantidad:** 10
   - Observar el campo "Costo unitario":
     - Si el producto tiene precio anterior, debe auto-llenarse
     - Se muestra "Costo anterior: $XXX"
   - Si está vacío, ingresar **Costo unitario:** 100
   - Verificar que el **Subtotal** muestra: $1.000,00
6. **Agregar segundo item (opcional pero recomendado):**
   - Click en "Agregar item"
   - Seleccionar otro producto/variante
   - Cantidad: 5
   - Costo: 50
   - Subtotal debe ser: $250,00
7. Verificar que el **Total general** es correcto (suma de subtotales)
8. Click en "Guardar compra"
9. Esperar el procesamiento
10. Observar el alert de confirmación

**Verificaciones - Interfaz:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 1 | Título "Nueva Compra" se muestra correctamente | ⬜ PASS / ⬜ FAIL | |
| 2 | Formulario tiene 2 secciones claramente diferenciadas | ⬜ PASS / ⬜ FAIL | |
| 3 | Dropdown de proveedores solo muestra activos | ⬜ PASS / ⬜ FAIL | |
| 4 | El proveedor "Proveedor Testing QA" NO aparece (está inactivo) | ⬜ PASS / ⬜ FAIL | |
| 5 | Barra de búsqueda de productos funciona en tiempo real | ⬜ PASS / ⬜ FAIL | |
| 6 | Búsqueda muestra resultados mientras escribes | ⬜ PASS / ⬜ FAIL | |
| 7 | Al seleccionar producto, dropdown de variantes se habilita | ⬜ PASS / ⬜ FAIL | |
| 8 | Dropdown de variantes muestra: Tamaño - Color (SKU) | ⬜ PASS / ⬜ FAIL | |
| 9 | Se muestra "Stock actual: X" debajo de variante | ⬜ PASS / ⬜ FAIL | |
| 10 | Costo unitario se auto-llena si existe precio anterior | ⬜ PASS / ⬜ FAIL | |
| 11 | Se muestra "Costo anterior: $XXX" si existe | ⬜ PASS / ⬜ FAIL | |
| 12 | Subtotal se calcula automáticamente al cambiar cantidad/costo | ⬜ PASS / ⬜ FAIL | |
| 13 | Total general se actualiza automáticamente | ⬜ PASS / ⬜ FAIL | |
| 14 | Botón "Agregar item" funciona | ⬜ PASS / ⬜ FAIL | |
| 15 | Se pueden agregar múltiples items | ⬜ PASS / ⬜ FAIL | |
| 16 | Botón de eliminar item (tacho) funciona | ⬜ PASS / ⬜ FAIL | |
| 17 | No permite eliminar si solo hay 1 item | ⬜ PASS / ⬜ FAIL | |

**Verificaciones - Validaciones:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 18 | Sin proveedor: muestra error "Debe seleccionar un proveedor" | ⬜ PASS / ⬜ FAIL | |
| 19 | Sin producto: muestra error "Debe seleccionar un producto" | ⬜ PASS / ⬜ FAIL | |
| 20 | Sin variante: muestra error "Debe seleccionar una variante" | ⬜ PASS / ⬜ FAIL | |
| 21 | Cantidad = 0: muestra error "cantidad debe ser mayor a 0" | ⬜ PASS / ⬜ FAIL | |
| 22 | Costo = 0: muestra error "costo unitario debe ser mayor a 0" | ⬜ PASS / ⬜ FAIL | |
| 23 | Variante duplicada: muestra error "Esta variante ya está en la lista" | ⬜ PASS / ⬜ FAIL | |

**Verificaciones - Guardado:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 24 | Al guardar, botón muestra "Guardando..." con spinner | ⬜ PASS / ⬜ FAIL | |
| 25 | Aparece alert "✅ Compra registrada exitosamente. Stock actualizado." | ⬜ PASS / ⬜ FAIL | |
| 26 | Redirige a `/compras` | ⬜ PASS / ⬜ FAIL | |
| 27 | La nueva compra aparece en el listado (primera fila) | ⬜ PASS / ⬜ FAIL | |
| 28 | No hay errores en consola | ⬜ PASS / ⬜ FAIL | |

**🔴 CRÍTICO - Verificar en Network Tab:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 29 | Request POST a `/api/purchases` con status 201 | ⬜ PASS / ⬜ FAIL | |
| 30 | Response tiene `success: true` | ⬜ PASS / ⬜ FAIL | |
| 31 | Response contiene los datos de la compra creada | ⬜ PASS / ⬜ FAIL | |

**Resultado Final:** ⬜ PASS / ⬜ FAIL

**Datos de la Compra Creada:**
```
ID Compra: [anotar aquí]
Proveedor: [nombre]
Total: [monto]
Items: [cantidad]
```

---

### TC-COMP-003: Validación de Stock Actualizado

**Objetivo:** Verificar que el stock se incrementa correctamente después de una compra

**Prioridad:** 🔴 CRÍTICA - INTEGRIDAD DE DATOS

**Precondiciones:**
- Se completó TC-COMP-002
- Se conoce el stock ANTES de la compra

**ESTE TEST VALIDA LA CARACTERÍSTICA MÁS IMPORTANTE DEL MÓDULO**

**Datos necesarios (de TC-COMP-002):**
```
Producto: [nombre]
Variante: [tamaño/color]
Stock ANTES: [X]
Cantidad comprada: [Y]
Stock esperado DESPUÉS: X + Y = [Z]
```

**Pasos:**

1. Navegar a `/productos`
2. Buscar el producto usado en TC-COMP-002
3. Click en "Ver Detalles" o "Editar"
4. Localizar la variante específica
5. Anotar el stock actual

**Verificaciones:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 1 | El stock de la variante ha cambiado | ⬜ PASS / ⬜ FAIL | |
| 2 | Stock ACTUAL = Stock ANTES + Cantidad Comprada | ⬜ PASS / ⬜ FAIL | |
| 3 | El cálculo es exacto (sin decimales ni errores) | ⬜ PASS / ⬜ FAIL | |
| 4 | Si había otras variantes, su stock NO cambió | ⬜ PASS / ⬜ FAIL | |

**Cálculo:**

```
Stock ANTES:         [anotar]
Cantidad Comprada:   [anotar]
Stock Esperado:      [anotar]
Stock ACTUAL:        [anotar]
¿Coincide?           ⬜ SÍ / ⬜ NO
```

**Verificación Adicional - Dashboard:**

5. Navegar a `/dashboard`
6. Verificar la sección "Stock Crítico"
7. Si el producto estaba en stock crítico y ya no lo está, debe desaparecer de la lista

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 5 | Dashboard refleja el nuevo stock | ⬜ PASS / ⬜ FAIL | |
| 6 | Productos que salieron de stock crítico no aparecen | ⬜ PASS / ⬜ FAIL | |

**🚨 SI ESTE TEST FALLA:**

- **Severidad:** CRÍTICA
- **Impacto:** Corrupción de inventario
- **Acción:** DETENER testing y reportar inmediatamente

**Resultado Final:** ⬜ PASS / ⬜ FAIL

---

### TC-COMP-004: Ver Detalle de Compra

**Objetivo:** Verificar que el modal de detalles muestra información completa

**Prioridad:** MEDIA

**Precondiciones:**
- Existe al menos una compra registrada

**Pasos:**

1. En `/compras`, click en el botón "Ver" de cualquier compra
2. Observar el modal que se abre
3. Revisar la información mostrada

**Verificaciones:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 1 | Se abre modal con fondo oscuro | ⬜ PASS / ⬜ FAIL | |
| 2 | Título: "Detalles de Compra #[ID corto]" | ⬜ PASS / ⬜ FAIL | |
| 3 | Muestra fecha de creación | ⬜ PASS / ⬜ FAIL | |
| 4 | Hay botón X para cerrar | ⬜ PASS / ⬜ FAIL | |
| 5 | Sección superior muestra: Proveedor, Fecha, Total items, Total, Estado, Notas (si hay) | ⬜ PASS / ⬜ FAIL | |
| 6 | Sección inferior: tabla con items de la compra | ⬜ PASS / ⬜ FAIL | |
| 7 | Tabla de items tiene columnas: Producto, Variante, Cantidad, Costo Unit., Subtotal | ⬜ PASS / ⬜ FAIL | |
| 8 | Cada item muestra: nombre producto, marca, talle-color, SKU, cantidad, costo, subtotal | ⬜ PASS / ⬜ FAIL | |
| 9 | Los montos tienen formato correcto | ⬜ PASS / ⬜ FAIL | |
| 10 | La suma de subtotales coincide con el total | ⬜ PASS / ⬜ FAIL | |
| 11 | Click en X cierra el modal | ⬜ PASS / ⬜ FAIL | |
| 12 | Click fuera del modal lo cierra | ⬜ PASS / ⬜ FAIL | |

**Resultado Final:** ⬜ PASS / ⬜ FAIL

---

## FLUJOS END-TO-END

### E2E-001: Flujo Completo de Inventario

**Objetivo:** Verificar el ciclo completo: producto nuevo → compra → stock actualizado → venta → stock decrementado

**Prioridad:** 🔴 CRÍTICA

**Duración Estimada:** 15-20 minutos

**Este es el test más importante del sistema. Valida la integridad completa del flujo de inventario.**

---

#### FASE 1: Crear Producto con Stock Cero

**Pasos:**

1. Ir a `/productos`
2. Click en "Nuevo Producto"
3. Crear producto:
   - **Nombre:** "Testing E2E Product"
   - **Marca:** "QA Brand"
   - **Categoría:** Cualquiera
   - **Descripción:** "Producto para testing end-to-end"
4. Agregar variante:
   - **SKU:** "TEST-E2E-001"
   - **Tamaño:** "M"
   - **Color:** "Negro"
   - **Stock:** 0
   - **Precio Costo:** 100
   - **Precio Venta:** 200
   - **Stock Mínimo:** 5
5. Guardar

**Verificaciones Fase 1:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 1 | Producto creado exitosamente | ⬜ PASS / ⬜ FAIL | |
| 2 | Aparece en listado de productos | ⬜ PASS / ⬜ FAIL | |
| 3 | Stock de la variante es 0 | ⬜ PASS / ⬜ FAIL | |

**ID del Producto:** [anotar aquí]

---

#### FASE 2: Verificar Aparece en Stock Crítico

**Pasos:**

1. Ir a `/dashboard`
2. Buscar la sección "Stock Crítico" o "Productos con Stock Bajo"
3. Verificar que el producto "Testing E2E Product" aparece

**Verificaciones Fase 2:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 4 | Dashboard muestra el producto en stock crítico | ⬜ PASS / ⬜ FAIL | |
| 5 | Badge o indicador muestra stock = 0 | ⬜ PASS / ⬜ FAIL | |
| 6 | Indica que está por debajo del mínimo (5) | ⬜ PASS / ⬜ FAIL | |

---

#### FASE 3: Registrar Compra

**Preparación:**

Si el proveedor "Proveedor Testing QA" está inactivo:
1. Ir a `/proveedores`
2. Activar checkbox "Mostrar inactivos"
3. Click "Editar" en el proveedor
4. Cambiar estado a "Activo"
5. Guardar

**Pasos:**

1. Ir a `/compras/nueva`
2. Seleccionar proveedor: "Proveedor Testing QA"
3. Buscar producto: "Testing E2E Product"
4. Seleccionar variante: M - Negro
5. Verificar muestra "Stock actual: 0"
6. Ingresar:
   - **Cantidad:** 20
   - **Costo unitario:** 100
7. Verificar **Subtotal:** $2.000,00
8. Notas: "Compra E2E - Testing completo"
9. Click "Guardar compra"
10. Esperar confirmación

**Verificaciones Fase 3:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 7 | Compra guardada exitosamente | ⬜ PASS / ⬜ FAIL | |
| 8 | Alert confirma "Stock actualizado" | ⬜ PASS / ⬜ FAIL | |
| 9 | Aparece en listado de compras | ⬜ PASS / ⬜ FAIL | |

---

#### FASE 4: Verificar Stock Actualizado a 20

**Pasos:**

1. Ir a `/productos`
2. Buscar "Testing E2E Product"
3. Ver detalles o editar
4. Verificar stock de la variante M - Negro

**Verificaciones Fase 4:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 10 | Stock de la variante = 20 | ⬜ PASS / ⬜ FAIL | |
| 11 | El cálculo es exacto (0 + 20 = 20) | ⬜ PASS / ⬜ FAIL | |

---

#### FASE 5: Verificar Ya NO Está en Stock Crítico

**Pasos:**

1. Ir a `/dashboard`
2. Buscar en la sección de stock crítico

**Verificaciones Fase 5:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 12 | Producto "Testing E2E Product" YA NO aparece en stock crítico | ⬜ PASS / ⬜ FAIL | |
| 13 | Dashboard muestra stock = 20 en algún lugar | ⬜ PASS / ⬜ FAIL | |

---

#### FASE 6: Registrar Venta

**Pasos:**

1. Ir a `/ventas/nueva`
2. Ingresar cliente (cualquiera o "Cliente Testing")
3. Buscar producto: "Testing E2E Product"
4. Seleccionar variante: M - Negro
5. Verificar muestra "Stock disponible: 20"
6. Ingresar:
   - **Cantidad:** 5
   - **Precio:** 200 (o el configurado)
7. Verificar **Subtotal:** $1.000,00
8. Click "Guardar venta"
9. Esperar confirmación

**Verificaciones Fase 6:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 14 | Venta guardada exitosamente | ⬜ PASS / ⬜ FAIL | |
| 15 | Alert confirma "Stock actualizado" | ⬜ PASS / ⬜ FAIL | |
| 16 | Aparece en listado de ventas | ⬜ PASS / ⬜ FAIL | |

---

#### FASE 7: Verificar Stock Final = 15

**Pasos:**

1. Ir a `/productos`
2. Buscar "Testing E2E Product"
3. Verificar stock de la variante M - Negro

**Verificaciones Fase 7:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 17 | Stock de la variante = 15 | ⬜ PASS / ⬜ FAIL | |
| 18 | El cálculo es exacto (20 - 5 = 15) | ⬜ PASS / ⬜ FAIL | |

---

#### FASE 8: Verificar Dashboard Refleja Venta

**Pasos:**

1. Ir a `/dashboard`
2. Buscar sección de ventas (ej: "Ventas de Hoy")

**Verificaciones Fase 8:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 19 | Dashboard muestra la venta registrada | ⬜ PASS / ⬜ FAIL | |
| 20 | Monto de venta ($1.000) reflejado en estadísticas | ⬜ PASS / ⬜ FAIL | |

---

### RESUMEN E2E-001

**Flujo Completo:**

```
Stock inicial: 0
↓
[COMPRA: +20]
↓
Stock después de compra: 20
↓
[VENTA: -5]
↓
Stock final: 15
```

**Tracking de Stock:**

| Operación | Stock Esperado | Stock Actual | Coincide |
|-----------|----------------|--------------|----------|
| Inicial | 0 | [anotar] | ⬜ SÍ / ⬜ NO |
| Después compra | 20 | [anotar] | ⬜ SÍ / ⬜ NO |
| Después venta | 15 | [anotar] | ⬜ SÍ / ⬜ NO |

**Resultado Final E2E-001:** ⬜ PASS / ⬜ FAIL

**🚨 SI ESTE TEST FALLA EN CUALQUIER FASE:**

- **Severidad:** CRÍTICA
- **Impacto:** Sistema no puede garantizar integridad de inventario
- **Acción:** Reportar inmediatamente con detalles de qué fase falló

---

## EDGE CASES

### EDGE-001: Proveedor Inactivo No Aparece en Compras

**Objetivo:** Verificar que proveedores inactivos no se pueden usar en nuevas compras

**Prioridad:** ALTA

**Precondiciones:** Existe un proveedor inactivo

**Pasos:**

1. Ir a `/proveedores`
2. Marcar "Mostrar inactivos"
3. Verificar que hay al menos un proveedor inactivo
4. Ir a `/compras/nueva`
5. Abrir el dropdown de proveedores

**Verificaciones:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 1 | Proveedores inactivos NO aparecen en el dropdown | ⬜ PASS / ⬜ FAIL | |
| 2 | Solo aparecen proveedores con estado "Activo" | ⬜ PASS / ⬜ FAIL | |

**Resultado Final:** ⬜ PASS / ⬜ FAIL

---

### EDGE-002: Validación Formulario Vacío

**Objetivo:** Verificar que no se puede guardar una compra sin items

**Prioridad:** MEDIA

**Pasos:**

1. Ir a `/compras/nueva`
2. Seleccionar un proveedor
3. No llenar ningún item (dejar el primer item vacío)
4. Intentar guardar

**Verificaciones:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 1 | No se envía el formulario | ⬜ PASS / ⬜ FAIL | |
| 2 | Aparecen mensajes de error en cada campo requerido | ⬜ PASS / ⬜ FAIL | |
| 3 | Los errores están en español y son claros | ⬜ PASS / ⬜ FAIL | |
| 4 | No hay errores en consola | ⬜ PASS / ⬜ FAIL | |

**Resultado Final:** ⬜ PASS / ⬜ FAIL

---

### EDGE-003: Búsqueda de Proveedores

**Objetivo:** Verificar que la búsqueda funciona correctamente

**Prioridad:** BAJA

**Precondiciones:** Hay al menos 3 proveedores con nombres diferentes

**Pasos:**

1. Ir a `/proveedores`
2. En la barra de búsqueda, escribir parte del nombre de un proveedor
3. Observar los resultados

**Verificaciones:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 1 | La tabla se filtra en tiempo real | ⬜ PASS / ⬜ FAIL | |
| 2 | Solo aparecen proveedores que coinciden | ⬜ PASS / ⬜ FAIL | |
| 3 | Búsqueda no es case-sensitive | ⬜ PASS / ⬜ FAIL | |
| 4 | Búsqueda funciona por nombre | ⬜ PASS / ⬜ FAIL | |
| 5 | Búsqueda funciona por email | ⬜ PASS / ⬜ FAIL | |
| 6 | Al borrar texto, vuelven a aparecer todos | ⬜ PASS / ⬜ FAIL | |

**Resultado Final:** ⬜ PASS / ⬜ FAIL

---

### EDGE-004: Búsqueda de Compras

**Objetivo:** Verificar que la búsqueda funciona correctamente

**Prioridad:** BAJA

**Precondiciones:** Hay al menos 2 compras de diferentes proveedores

**Pasos:**

1. Ir a `/compras`
2. En la barra de búsqueda, escribir parte del nombre de un proveedor
3. Observar los resultados

**Verificaciones:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 1 | La tabla se filtra en tiempo real | ⬜ PASS / ⬜ FAIL | |
| 2 | Solo aparecen compras que coinciden | ⬜ PASS / ⬜ FAIL | |
| 3 | Búsqueda no es case-sensitive | ⬜ PASS / ⬜ FAIL | |
| 4 | Búsqueda funciona por nombre de proveedor | ⬜ PASS / ⬜ FAIL | |
| 5 | Búsqueda funciona por ID de compra | ⬜ PASS / ⬜ FAIL | |

**Resultado Final:** ⬜ PASS / ⬜ FAIL

---

### EDGE-005: Variantes Duplicadas en Compra

**Objetivo:** Verificar que no se puede agregar la misma variante dos veces

**Prioridad:** MEDIA

**Pasos:**

1. Ir a `/compras/nueva`
2. Seleccionar proveedor
3. En el primer item, seleccionar un producto y variante
4. Click "Agregar item"
5. En el segundo item, intentar seleccionar el mismo producto y variante
6. Intentar guardar

**Verificaciones:**

| # | Verificación | Resultado | Notas |
|---|--------------|-----------|-------|
| 1 | Aparece error "Esta variante ya está en la lista" | ⬜ PASS / ⬜ FAIL | |
| 2 | No permite guardar | ⬜ PASS / ⬜ FAIL | |

**Resultado Final:** ⬜ PASS / ⬜ FAIL

---

## REGISTRO DE EJECUCIÓN

### Información de la Sesión

| Campo | Valor |
|-------|-------|
| **Tester** | [Tu nombre] |
| **Fecha** | [Fecha] |
| **Hora inicio** | [Hora] |
| **Hora fin** | [Hora] |
| **Duración** | [Minutos] |
| **Navegador** | [Chrome/Firefox/Safari + versión] |
| **Sistema Operativo** | [Mac/Windows/Linux] |
| **Versión del código** | [Commit hash del git] |

### Resumen de Ejecución

#### PROVEEDORES

| Test Case | Resultado | Bugs | Notas |
|-----------|-----------|------|-------|
| TC-PROV-001 | ⬜ PASS / ⬜ FAIL | | |
| TC-PROV-002 | ⬜ PASS / ⬜ FAIL | | |
| TC-PROV-003 | ⬜ PASS / ⬜ FAIL | | |
| TC-PROV-004 | ⬜ PASS / ⬜ FAIL | | |
| TC-PROV-005 | ⬜ PASS / ⬜ FAIL | | |
| TC-PROV-006 | ⬜ PASS / ⬜ FAIL | | |

**Total Proveedores:** ___ / 6 passed

#### COMPRAS

| Test Case | Resultado | Bugs | Notas |
|-----------|-----------|------|-------|
| TC-COMP-001 | ⬜ PASS / ⬜ FAIL | | |
| TC-COMP-002 | ⬜ PASS / ⬜ FAIL | | |
| TC-COMP-003 | ⬜ PASS / ⬜ FAIL | | |
| TC-COMP-004 | ⬜ PASS / ⬜ FAIL | | |

**Total Compras:** ___ / 4 passed

#### END-TO-END

| Test Case | Resultado | Bugs | Notas |
|-----------|-----------|------|-------|
| E2E-001 | ⬜ PASS / ⬜ FAIL | | |

#### EDGE CASES

| Test Case | Resultado | Bugs | Notas |
|-----------|-----------|------|-------|
| EDGE-001 | ⬜ PASS / ⬜ FAIL | | |
| EDGE-002 | ⬜ PASS / ⬜ FAIL | | |
| EDGE-003 | ⬜ PASS / ⬜ FAIL | | |
| EDGE-004 | ⬜ PASS / ⬜ FAIL | | |
| EDGE-005 | ⬜ PASS / ⬜ FAIL | | |

**Total Edge Cases:** ___ / 5 passed

---

## BUGS ENCONTRADOS

### Bug #1 - [Título del Bug]

**Severity:** 🔴 Crítica / 🟠 Alta / 🟡 Media / 🟢 Baja

**Módulo:** Compras / Proveedores

**Test Case:** TC-XXX-XXX

**Impact:** [Descripción del impacto en el negocio]

**Descripción:**
[Descripción detallada del bug]

**Pasos para Reproducir:**
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

**Resultado Esperado:**
[Qué debería pasar]

**Resultado Actual:**
[Qué pasó realmente]

**Evidencia:**
- URL: [URL donde ocurrió]
- Consola: [Errores de consola]
- Network: [Errores de red]
- Screenshot: [Si aplica]

**Datos de Prueba:**
```
[Datos usados para reproducir]
```

**Frecuencia:** ⬜ Siempre / ⬜ A veces / ⬜ Rara vez

**Workaround:** [Si existe alguna forma de evitarlo]

---

### Bug #2 - [Título del Bug]

[Misma estructura que Bug #1]

---

## STOCK INTEGRITY REPORT

### Verificación Crítica

**CRITICAL VERIFICATION:**

- ✅ / ❌ All purchases incremented stock correctly
- ✅ / ❌ All stock values match expectations
- ✅ / ❌ No data corruption detected

### Stock Changes Log

**IMPORTANTE:** Registrar TODOS los cambios de stock durante el testing

| Producto | Variante | Before | Operation | Expected After | Actual After | Status |
|----------|----------|--------|-----------|----------------|--------------|--------|
| [Nombre] | [T/C] | X | Compra +Y | X+Y | [Real] | ✅/❌ |
| [Nombre] | [T/C] | A | Venta -B | A-B | [Real] | ✅/❌ |
| Testing E2E Product | M/Negro | 0 | Compra +20 | 20 | [Real] | ✅/❌ |
| Testing E2E Product | M/Negro | 20 | Venta -5 | 15 | [Real] | ✅/❌ |

**Discrepancies Found:** [Número]

**Discrepancy Details:**
```
[Si hay discrepancias, detallar aquí]
```

---

## RESUMEN

### Estadísticas Generales

- **Total Test Cases:** 16 (6 Proveedores + 4 Compras + 1 E2E + 5 Edge)
- **Executed:** ___ / 16
- **Passed:** ___ / 16
- **Failed:** ___ / 16
- **Pass Rate:** ____%

### Bugs por Severidad

- 🔴 **Crítica:** ___
- 🟠 **Alta:** ___
- 🟡 **Media:** ___
- 🟢 **Baja:** ___

**Total Bugs:** ___

### Tests Críticos

| Test Crítico | Status | Comentario |
|--------------|--------|------------|
| TC-COMP-002: Registrar Compra | ⬜ PASS / ⬜ FAIL | |
| TC-COMP-003: Stock Actualizado | ⬜ PASS / ⬜ FAIL | |
| E2E-001: Flujo Completo | ⬜ PASS / ⬜ FAIL | |

### Integridad del Sistema

**Stock Integrity:** ⬜ VERIFIED ✅ / ⬜ CORRUPTED ❌

**Business-Critical Functionality:**
- ⬜ ✅ / ⬜ ❌ Purchases increase stock
- ⬜ ✅ / ⬜ ❌ Sales decrease stock
- ⬜ ✅ / ⬜ ❌ Dashboard reflects correct data
- ⬜ ✅ / ⬜ ❌ Inactive suppliers cannot be used

### Recomendaciones

#### Bugs Prioritarios a Corregir

1. [Bug crítico #X]
2. [Bug alto #X]
3. [Bug medio #X]

#### Mejoras Sugeridas

1. [Mejora UX/funcional]
2. [Mejora UX/funcional]
3. [Mejora UX/funcional]

#### Áreas que Necesitan Más Testing

1. [Área pendiente]
2. [Área pendiente]

### Conclusión

[Escribir conclusión general sobre el estado del módulo]

**¿El sistema está listo para producción?** ⬜ SÍ / ⬜ NO / ⬜ CON RESERVAS

**Justificación:**
```
[Explicar la decisión]
```

---

## NOTAS ADICIONALES

### Observaciones Durante el Testing

```
[Cualquier observación que no encaje en las secciones anteriores]
```

### Sugerencias de Mejora

```
[Sugerencias para mejorar el testing o el sistema]
```

### Próximos Pasos

```
[Qué hacer después de este testing]
```

---

## ANEXOS

### Anexo A: Comandos Útiles

```bash
# Ver logs del servidor
npm run dev

# Limpiar caché de Next.js
rm -rf .next

# Ver base de datos (si usas Prisma Studio)
npx prisma studio

# Ver estado de git
git status
git log --oneline -5
```

### Anexo B: Endpoints API Relevantes

```
GET  /api/suppliers              - Listar proveedores
POST /api/suppliers              - Crear proveedor
GET  /api/suppliers/:id          - Obtener proveedor
PUT  /api/suppliers/:id          - Actualizar proveedor
DELETE /api/suppliers/:id        - Desactivar proveedor (soft delete)

GET  /api/purchases              - Listar compras
POST /api/purchases              - Crear compra (actualiza stock)
GET  /api/purchases/:id          - Obtener compra

GET  /api/products               - Listar productos
GET  /api/products/:id           - Obtener producto
```

### Anexo C: Estructura de la Base de Datos

```prisma
model Supplier {
  id        String   @id @default(cuid())
  name      String   @unique
  email     String?
  phone     String?
  address   String?
  notes     String?
  isActive  Boolean  @default(true)
  purchases Purchase[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Purchase {
  id           String        @id @default(cuid())
  supplierId   String
  purchaseDate DateTime
  totalAmount  Decimal
  status       String        @default("completed")
  notes        String?
  items        PurchaseItem[]
  supplier     Supplier      @relation(...)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model PurchaseItem {
  id               String         @id @default(cuid())
  purchaseId       String
  productVariantId String
  quantity         Int
  unitCost         Decimal
  subtotal         Decimal
  purchase         Purchase       @relation(...)
  productVariant   ProductVariant @relation(...)
}
```

---

**Fin del Reporte**

**Documento generado el:** 2026-02-15
**Versión:** 1.0
**Autor:** QA Agent - Claude Sonnet 4.5
