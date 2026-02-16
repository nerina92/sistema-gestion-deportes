# Integración con Tienda Nube - US-020

Esta integración permite sincronizar automáticamente el stock entre el sistema local y Tienda Nube.

## Características Implementadas

### Base de Datos
- Campos en `product_variants` para mapear productos con Tienda Nube:
  - `tiendanube_product_id` - ID del producto en Tienda Nube
  - `tiendanube_variant_id` - ID de la variante en Tienda Nube
- Tabla `tiendanube_config` para almacenar credenciales de la API
- Tabla `sync_logs` para registrar todas las operaciones de sincronización

### Backend APIs

#### Configuración
- `GET /api/integrations/tiendanube/config` - Obtener configuración actual
- `POST /api/integrations/tiendanube/config` - Guardar credenciales (Store ID y Access Token)
- `POST /api/integrations/tiendanube/test` - Probar conexión con Tienda Nube

#### Sincronización
- `POST /api/integrations/tiendanube/sync/export` - Exportar stock local a Tienda Nube
- `GET /api/integrations/tiendanube/logs` - Obtener historial de sincronizaciones

#### Auto-sincronización
- Al registrar una venta local, el sistema actualiza automáticamente el stock en Tienda Nube
- Si falla la sincronización, la venta local se completa igualmente (no bloquea)
- Todas las operaciones se registran en `sync_logs`

### Frontend

#### Página de Configuración (`/integraciones/tiendanube`)
- Formulario para ingresar Store ID y Access Token
- Botón "Probar Conexión" para validar credenciales
- Indicador de estado de conexión
- Timestamp de última sincronización

#### Página de Sincronización (`/integraciones/tiendanube/sincronizar`)
- Botón "Exportar Stock a Tienda Nube" para sincronización manual
- Tabla con historial de sincronizaciones
- Mensajes de éxito/error detallados

#### Edición de Productos
- Campos en el formulario de edición de productos para mapear variantes:
  - Tienda Nube Product ID
  - Tienda Nube Variant ID
- Estos campos son opcionales y aparecen al final del formulario de cada variante

## Cómo Usar

### 1. Configurar Credenciales

1. Ve a `/integraciones/tiendanube`
2. Ingresa tu Store ID (lo encuentras en el panel de Tienda Nube: Configuración → API)
3. Ingresa tu Access Token (OAuth 2.0)
4. Haz clic en "Probar Conexión" para validar
5. Si la conexión es exitosa, haz clic en "Guardar Configuración"

### 2. Mapear Productos

Para que la sincronización funcione, debes mapear cada variante local con su correspondiente variante en Tienda Nube:

1. Ve a Productos y edita el producto que quieres sincronizar
2. En cada variante, encontrarás los campos de "Integración Tienda Nube":
   - **Product ID**: ID del producto en Tienda Nube (ejemplo: `123456`)
   - **Variant ID**: ID de la variante en Tienda Nube (ejemplo: `789012`)
3. Guarda los cambios

**¿Cómo obtener los IDs?**
- Accede a la API de Tienda Nube: `GET https://api.tiendanube.com/v1/{store_id}/products`
- O usa la interfaz de Tienda Nube y busca los IDs en la URL al editar productos

### 3. Sincronización Manual

1. Ve a `/integraciones/tiendanube/sincronizar`
2. Haz clic en "Exportar Stock a Tienda Nube"
3. El sistema actualizará el stock en Tienda Nube para todos los productos mapeados
4. Verás un resumen de productos exportados y errores (si los hay)

### 4. Sincronización Automática

Una vez configurado y mapeados los productos:

- Cada vez que registres una venta local, el stock se actualiza automáticamente en Tienda Nube
- No necesitas hacer nada manual
- Si falla la actualización en Tienda Nube, la venta local se completa de todas formas
- Puedes revisar el log de sincronizaciones en `/integraciones/tiendanube/sincronizar`

## Flujo de Sincronización

### Venta Local → Tienda Nube

```
1. Usuario registra venta en /ventas/nueva
2. Sistema decrementa stock local
3. Sistema verifica si hay mapeo con Tienda Nube
4. Si existe mapeo, actualiza stock en TN vía API
5. Registra el resultado en sync_logs
```

### Exportación Manual

```
1. Usuario hace clic en "Exportar Stock"
2. Sistema obtiene todas las variantes con mapeo
3. Por cada variante, actualiza stock en TN
4. Registra resultado (éxitos y errores)
5. Actualiza timestamp de última sincronización
```

## Estructura de Archivos

```
prisma/
  └── migrations/
      └── 20260216110751_add_tiendanube_integration/
          └── migration.sql

src/
  └── app/
      ├── api/
      │   ├── integrations/
      │   │   └── tiendanube/
      │   │       ├── config/route.ts
      │   │       ├── test/route.ts
      │   │       ├── logs/route.ts
      │   │       └── sync/
      │   │           └── export/route.ts
      │   └── sales/route.ts (modificado)
      │
      └── integraciones/
          └── tiendanube/
              ├── page.tsx (configuración)
              └── sincronizar/
                  └── page.tsx (sincronización)
```

## API de Tienda Nube

### Autenticación
- Header: `Authentication: bearer {access_token}`
- User-Agent: `Sistema Gestion Deportes`

### Endpoints Utilizados
- `GET /v1/{store_id}/products` - Listar productos (usado en test de conexión)
- `PUT /v1/{store_id}/products/{product_id}/variants/{variant_id}` - Actualizar stock

### Estructura de Request para Actualizar Stock
```json
{
  "stock": 15
}
```

## Logs y Debugging

Todos los eventos de sincronización se registran en la tabla `sync_logs`:
- **action**: `export` (manual), `auto-export` (automático), `import`, `webhook`
- **status**: `success` o `error`
- **details**: Resumen de la operación
- **errorMessage**: Detalles del error (si aplica)
- **createdAt**: Timestamp

Para ver los logs en la base de datos:
```sql
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 50;
```

## Próximas Mejoras

Funcionalidades pendientes para futuras iteraciones:

1. **Importación desde Tienda Nube**: Crear productos locales basados en TN
2. **Webhooks de Tienda Nube**: Recibir eventos cuando hay ventas en TN
3. **Mapeo Automático por SKU**: Buscar coincidencias automáticas
4. **Sincronización de Precios**: Además de stock, sincronizar precios
5. **Dashboard de Sincronización**: Estadísticas y reportes
6. **Sincronización Bidireccional Completa**: Actualizaciones en ambos sentidos
7. **Manejo de Conflictos**: Resolver diferencias de stock entre sistemas
8. **Rate Limiting**: Evitar superar límites de la API de TN

## Seguridad

- El Access Token se almacena en la base de datos (considerar encriptación en producción)
- No se expone el token completo en las respuestas del API
- Las credenciales se envían por HTTPS
- Solo administradores pueden acceder a la configuración

## Troubleshooting

### Error: "Credenciales inválidas"
- Verifica que el Store ID sea correcto
- Verifica que el Access Token no haya expirado
- Asegúrate de tener permisos de lectura/escritura en la app de TN

### Error: "No hay productos para sincronizar"
- Verifica que hayas mapeado los productos con IDs de Tienda Nube
- Edita cada producto y completa los campos de TN Product ID y Variant ID

### La sincronización falla pero la venta se registra
- Esto es intencional - no queremos bloquear ventas locales
- Revisa los logs para ver el error específico
- Puedes hacer una exportación manual después

### Stock desincronizado
- Ejecuta una exportación manual para forzar la actualización
- Verifica que los IDs de mapeo sean correctos
- Revisa los logs para ver si hay errores

## Soporte

Para reportar problemas o solicitar mejoras, contactar al equipo de desarrollo.
