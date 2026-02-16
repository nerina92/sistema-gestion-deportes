# Instrucciones para Migración AFIP

## Estado de la Implementación

✅ **IMPLEMENTADO COMPLETAMENTE:**
- Modelos de datos (AfipConfig, Invoice)
- APIs de backend completas
- Generador de PDFs con código de barras
- Integración con AFIP SDK
- Frontend de configuración
- Frontend de listado de facturas
- Integración con módulo de ventas

⚠️ **PENDIENTE:**
- Ejecutar migración de base de datos (requiere PostgreSQL corriendo)

---

## Pasos para Completar la Implementación

### 1. Iniciar la Base de Datos

```bash
# Si usas Docker
docker-compose up -d

# O inicia PostgreSQL de la manera que lo tengas configurado
```

### 2. Ejecutar la Migración

```bash
npx prisma migrate dev --name add_afip_invoicing
```

Esto creará las siguientes tablas:
- `afip_config` - Configuración de AFIP (CUIT, certificados, punto de venta)
- `invoices` - Facturas emitidas con CAE
- Modificará `sales` para agregar relación con facturas

### 3. Verificar la Migración

```bash
npx prisma studio
```

Deberías ver las nuevas tablas en Prisma Studio.

### 4. Iniciar la Aplicación

```bash
npm run dev
```

### 5. Configurar AFIP (Primera Vez)

1. Ve a **http://localhost:3000/integraciones/afip**
2. Completa el formulario:
   - CUIT (11 dígitos sin guiones)
   - Punto de Venta asignado por AFIP
   - Sube certificado `.crt`
   - Sube clave privada `.key`
   - Marca "Modo Producción" solo cuando estés listo (inicia en Homologación)
3. Haz clic en "Guardar Configuración"
4. Prueba la conexión con "Probar Conexión"

### 6. Emitir Primera Factura

1. Ve a **http://localhost:3000/ventas**
2. En una venta sin factura, haz clic en "Emitir Factura"
3. Opcionalmente ingresa:
   - Nombre del cliente
   - DNI del cliente (8 dígitos)
4. Haz clic en "Emitir Factura"
5. La factura se emitirá y obtendrás el CAE de AFIP
6. Podrás descargar el PDF desde el botón "PDF"

### 7. Ver Facturas

Ve a **http://localhost:3000/facturas** para ver todas las facturas emitidas.

---

## Cómo Obtener Certificado de AFIP

### Paso a Paso:

1. **Ingresa a AFIP con Clave Fiscal**
   - URL: https://www.afip.gob.ar

2. **Ve a "Administrador de Relaciones de Clave Fiscal"**

3. **Adherir al Servicio de Facturación Electrónica**
   - Busca "Factura Electrónica" o "WSFE"
   - Haz clic en "Adherir"

4. **Generar Certificado Digital**
   - En la sección de certificados
   - Genera un nuevo certificado
   - Descarga dos archivos:
     - `.crt` (certificado público)
     - `.key` (clave privada)

5. **Configurar Punto de Venta**
   - En AFIP, configura tu punto de venta
   - Anota el número asignado (ej: 1, 2, 3, etc.)

6. **Subir Certificados en la App**
   - Usa estos archivos en `/integraciones/afip`

---

## Modos de Operación

### Modo Homologación (Testing)
- Para pruebas y desarrollo
- No genera facturas reales
- Los CAE no son válidos para uso fiscal
- **Recomendado para empezar**

### Modo Producción
- Genera facturas reales
- Los CAE son válidos fiscalmente
- Solo usar cuando estés 100% seguro
- Requiere certificado de producción de AFIP

---

## Estructura de Archivos Creados

```
src/
├── app/
│   ├── api/
│   │   ├── integrations/afip/
│   │   │   ├── config/route.ts       # Configuración AFIP
│   │   │   └── test/route.ts         # Test de conexión
│   │   └── invoices/
│   │       ├── route.ts              # Listar facturas
│   │       ├── issue/route.ts        # Emitir factura
│   │       ├── [id]/route.ts         # Obtener factura
│   │       ├── [id]/pdf/route.ts     # Descargar PDF
│   │       └── by-sale/[saleId]/route.ts  # Factura por venta
│   ├── facturas/
│   │   └── page.tsx                  # Listado de facturas
│   ├── integraciones/afip/
│   │   └── page.tsx                  # Configuración AFIP
│   └── ventas/
│       └── page.tsx                  # Actualizado con botón facturar
└── lib/
    └── pdf-generator.ts              # Generador de PDFs

prisma/
└── schema.prisma                     # Actualizado con modelos

certs/                                # Directorio para certificados (creado automáticamente)
public/invoices/                      # Directorio para PDFs (creado automáticamente)
```

---

## Solución de Problemas

### Error: "Can't reach database server"
**Solución:** Inicia PostgreSQL antes de ejecutar la migración.

### Error: "AFIP no está configurado"
**Solución:** Ve a `/integraciones/afip` y completa la configuración.

### Error: "Error al conectar con AFIP"
**Posibles causas:**
- Certificados incorrectos
- CUIT incorrecto
- Punto de venta no configurado en AFIP
- Certificado expirado
- Modo incorrecto (producción vs homologación)

### Factura con estado "Error"
**Solución:** Revisa el mensaje de error en la tabla `invoices` campo `error_message`.

### PDF no se genera
**Posibles causas:**
- Permisos de escritura en directorio `public/invoices/`
- Error al generar código de barras
**Solución:** Verifica logs del servidor con `npm run dev`

---

## Próximos Pasos (Opcional)

### Mejoras Futuras:
1. **Factura A** - Para ventas B2B con CUIT
2. **Notas de Crédito** - Para devoluciones
3. **Integración con Email** - Enviar facturas automáticamente
4. **Reportes AFIP** - Dashboard de facturación
5. **Reintento Automático** - Para facturas con error

---

## Notas Importantes

- ⚠️ **Certificados**: Renovar anualmente en AFIP
- ⚠️ **CAE**: Válido por fechas específicas
- ⚠️ **Backup**: Los PDFs se guardan en `public/invoices/`
- ⚠️ **Testing**: Siempre prueba en modo Homologación primero
- ⚠️ **Producción**: Solo cambia cuando todo funcione perfectamente

---

## Soporte

Si tienes problemas:
1. Revisa los logs de la aplicación
2. Verifica la configuración en AFIP
3. Consulta la documentación oficial: https://www.afip.gob.ar/ws/documentacion/ws-factura-electronica.asp

---

**Estado:** ✅ Implementación completa y lista para usar
**Fecha:** 2026-02-16
**User Story:** US-021 - Facturación Electrónica AFIP
