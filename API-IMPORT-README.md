# API de Importación Excel - US-019

Esta API permite importar inventario desde un archivo Excel con formato específico.

## Endpoint

```
POST /api/import/excel
```

## Formato del archivo Excel requerido

### Hoja: "STOCK INICIAL"

El archivo debe contener una hoja llamada **"STOCK INICIAL"** con las siguientes columnas:

| Columna | Descripción | Obligatoria |
|---------|-------------|-------------|
| Descripción | Nombre del producto | ✅ Sí |
| Marca | Marca del producto | ✅ Sí |
| Art | SKU/Código del producto | ✅ Sí |
| Talle | Talle del producto | ⚪ Opcional |
| Color | Color del producto | ⚪ Opcional |
| Vendido? | Estado de venta (Si/No) | ⚪ Opcional |
| Columna G | Precio Contado | ⚪ Opcional |
| Columna H | Precio Débito | ⚪ Opcional |
| Columna I | Precio Financiado | ⚪ Opcional |
| Columna L | Costo actualizado | ⚪ Opcional |

## Lógica de procesamiento

1. **Filtrado**: Solo se importan productos donde "Vendido?" = "No" o esté vacío
2. **Agrupación**: Productos con mismo nombre + marca se agrupan
3. **Categorización automática**: Se asignan categorías basadas en palabras clave:
   - remera/camisa/polo/musculosa → Remeras
   - short/bermuda → Shorts
   - pantalon/jean/joggin → Pantalones
   - campera/buzo/chaleco/sudadera → Camperas
   - zapatilla/zapato/sandalia → Calzado
   - medias/gorra/guantes → Accesorios
4. **Normalización**: Trim de espacios, lowercase de marcas/colores
5. **Transacción**: Todo se ejecuta en una transacción de base de datos

## Uso desde frontend

```typescript
async function importExcelFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/import/excel', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  return result;
}
```

## Respuesta de la API

### Éxito (200)
```json
{
  "success": true,
  "message": "Importación completada: 15 productos creados, 45 variantes creadas",
  "log": {
    "productsCreated": 15,
    "variantsCreated": 45,
    "skippedRows": 2,
    "totalErrors": 0,
    "totalWarnings": 3,
    "errors": [],
    "warnings": [
      "Fila 5: Todos los precios son 0 o inválidos",
      "Producto existente actualizado: Remera Nike",
      "Variante existente actualizada: SKU ABC123"
    ]
  }
}
```

### Error (400/500)
```json
{
  "error": "No se encontró la hoja 'STOCK INICIAL' en el archivo Excel",
  "details": ["Información adicional sobre el error"],
  "log": {
    "productsCreated": 0,
    "variantsCreated": 0,
    "errors": ["Lista de errores encontrados"]
  }
}
```

## Ejemplo de estructura Excel

| Descripción | Marca | Art | Talle | Color | Vendido? | G (P.Contado) | H (P.Débito) | I (P.Financ) | L (Costo) |
|-------------|-------|-----|-------|-------|----------|---------------|--------------|--------------|-----------|
| Remera Básica | Nike | REM001 | M | Azul | No | 2500 | 2700 | 3000 | 1500 |
| Remera Básica | Nike | REM002 | L | Azul | No | 2500 | 2700 | 3000 | 1500 |
| Short Deportivo | Adidas | SHO001 | XL | Negro | No | 3500 | 3800 | 4200 | 2000 |

## Validaciones

- ✅ Archivo debe ser .xlsx o .xls
- ✅ Debe existir hoja "STOCK INICIAL"
- ✅ Columnas Descripción, Marca y Art son obligatorias
- ✅ SKUs deben ser únicos
- ✅ Precios no pueden ser negativos
- ✅ Manejo de caracteres especiales en SKUs

## Manejo de errores

- **Errores críticos**: Detienen la importación completa
- **Errores de fila**: Se registran pero continúa la importación
- **Advertencias**: Se registran para revisión posterior

## Testing

Usar el script de prueba incluido:
```bash
node test-import-api.js
```

Asegúrate de tener el servidor corriendo en `http://localhost:3000` y un archivo de prueba válido.