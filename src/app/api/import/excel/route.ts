import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// Tipos para manejo de datos Excel
interface ExcelRow {
  [key: number]: string | number | undefined;
}

// Mapeo de categorías por palabras clave
const CATEGORY_MAPPING: { [key: string]: string } = {
  'remera': 'Remeras',
  'camisa': 'Remeras',
  'polo': 'Remeras',
  'musculosa': 'Remeras',
  'short': 'Shorts',
  'bermuda': 'Shorts',
  'pantalon': 'Pantalones',
  'jean': 'Pantalones',
  'joggin': 'Pantalones',
  'campera': 'Camperas',
  'buzo': 'Camperas',
  'chaleco': 'Camperas',
  'sudadera': 'Camperas',
  'zapatilla': 'Calzado',
  'zapato': 'Calzado',
  'sandalia': 'Calzado',
  'medias': 'Accesorios',
  'gorra': 'Accesorios',
  'guantes': 'Accesorios',
};

// Normalizar texto
function normalizeText(text: string): string {
  if (!text) return '';
  return text.toString().trim().toLowerCase();
}

// Asignar categoría automáticamente
function assignCategory(productName: string): string {
  const normalized = normalizeText(productName);
  
  for (const [keyword, category] of Object.entries(CATEGORY_MAPPING)) {
    if (normalized.includes(keyword)) {
      return category;
    }
  }
  
  return 'Otros'; // Categoría por defecto
}

// Convertir valor de celda a número decimal
function parseDecimal(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
  return isNaN(num) ? 0 : num;
}

// Limpiar SKU
function cleanSku(sku: unknown): string {
  if (!sku) return '';
  return sku.toString().trim().replace(/[^a-zA-Z0-9-_]/g, '');
}

interface ImportLog {
  productsCreated: number;
  variantsCreated: number;
  errors: string[];
  warnings: string[];
  skippedRows: number;
}

interface ProductData {
  name: string;
  brand: string;
  category: string;
  variants: VariantData[];
}

interface VariantData {
  size: string;
  color: string;
  sku: string;
  costPrice: number;
  priceCash: number;
  priceDebit: number;
  priceFinanced: number;
  stockQuantity: number;
}

export async function POST(request: NextRequest) {
  const log: ImportLog = {
    productsCreated: 0,
    variantsCreated: 0,
    errors: [],
    warnings: [],
    skippedRows: 0
  };

  try {
    // Obtener el archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Validar que sea un archivo Excel
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'El archivo debe ser formato Excel (.xlsx o .xls)' },
        { status: 400 }
      );
    }

    // Leer el archivo
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Verificar que existe la hoja "STOCK INICIAL"
    if (!workbook.SheetNames.includes('STOCK INICIAL')) {
      return NextResponse.json(
        { error: 'No se encontró la hoja "STOCK INICIAL" en el archivo Excel' },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets['STOCK INICIAL'];
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      raw: false
    }) as ExcelRow[];

    if (data.length < 2) {
      return NextResponse.json(
        { error: 'La hoja Excel está vacía o no contiene datos' },
        { status: 400 }
      );
    }

    // Encontrar las columnas necesarias en la primera fila (headers)
    const headers = data[0] as Record<number, string>;
    const descriptionCol = Object.values(headers).findIndex(h => 
      h && (normalizeText(h).includes('descripcion') || normalizeText(h) === 'descripción')
    );
    const brandCol = Object.values(headers).findIndex(h => h && normalizeText(h).includes('marca'));
    const skuCol = Object.values(headers).findIndex(h => h && normalizeText(h).includes('art'));
    const sizeCol = Object.values(headers).findIndex(h => h && normalizeText(h).includes('talle'));
    const colorCol = Object.values(headers).findIndex(h => h && normalizeText(h).includes('color'));
    const soldCol = Object.values(headers).findIndex(h => h && normalizeText(h).includes('vendido'));

    // Validar que se encontraron las columnas esenciales
    if (descriptionCol === -1) {
      log.errors.push('No se encontró la columna "Descripción"');
    }
    if (brandCol === -1) {
      log.errors.push('No se encontró la columna "Marca"');
    }
    if (skuCol === -1) {
      log.errors.push('No se encontró la columna "Art" (SKU)');
    }

    if (log.errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Faltan columnas requeridas en el Excel',
          details: log.errors 
        },
        { status: 400 }
      );
    }

    // Agrupar productos por descripción + marca
    const productsMap = new Map<string, ProductData>();

    // Procesar cada fila de datos (saltear header)
    for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex] as ExcelRow;
      
      try {
        // Obtener valores de la fila
        const description = row[descriptionCol]?.toString().trim() || '';
        const brand = row[brandCol]?.toString().trim() || '';
        const sku = cleanSku(row[skuCol]);
        const size = row[sizeCol]?.toString().trim() || 'Único';
        const color = normalizeText(row[colorCol]?.toString() || '');
        const sold = normalizeText(row[soldCol]?.toString() || '');

        // Filtrar solo productos no vendidos
        if (sold === 'si' || sold === 'sí' || sold === 'yes') {
          log.skippedRows++;
          continue;
        }

        // Validar datos esenciales
        if (!description || !sku) {
          log.warnings.push(`Fila ${rowIndex + 1}: Faltan descripción o SKU`);
          log.skippedRows++;
          continue;
        }

        // Obtener precios de las columnas G, H, I, L
        const priceCash = parseDecimal(row[6]); // Columna G (índice 6)
        const priceDebit = parseDecimal(row[7]); // Columna H (índice 7)
        const priceFinanced = parseDecimal(row[8]); // Columna I (índice 8)
        const costPrice = parseDecimal(row[11]); // Columna L (índice 11)

        // Validar precios
        if (priceCash <= 0 && priceDebit <= 0 && priceFinanced <= 0) {
          log.warnings.push(`Fila ${rowIndex + 1}: Todos los precios son 0 o inválidos`);
        }

        // Crear clave única para agrupar productos
        const productKey = `${normalizeText(description)}_${normalizeText(brand)}`;

        // Si el producto no existe, crearlo
        if (!productsMap.has(productKey)) {
          productsMap.set(productKey, {
            name: description,
            brand: brand,
            category: assignCategory(description),
            variants: []
          });
        }

        // Agregar variante al producto
        const product = productsMap.get(productKey)!;
        product.variants.push({
          size: size,
          color: color || 'sin-color',
          sku: sku,
          costPrice: costPrice,
          priceCash: priceCash,
          priceDebit: priceDebit,
          priceFinanced: priceFinanced,
          stockQuantity: 1 // Por defecto, se puede ajustar después
        });

      } catch (error) {
        log.errors.push(`Error procesando fila ${rowIndex + 1}: ${error}`);
      }
    }

    // Validar que hay productos para importar
    if (productsMap.size === 0) {
      return NextResponse.json(
        { 
          error: 'No se encontraron productos válidos para importar',
          log 
        },
        { status: 400 }
      );
    }

    // Importar a la base de datos usando transacción con timeout extendido
    await prisma.$transaction(async (tx) => {
      for (const productData of productsMap.values()) {
        try {
          // Verificar si el producto ya existe por nombre y marca
          const existingProduct = await tx.product.findFirst({
            where: {
              AND: [
                { name: { equals: productData.name, mode: 'insensitive' } },
                { brand: { equals: productData.brand, mode: 'insensitive' } }
              ]
            }
          });

          let productId: string;

          if (existingProduct) {
            // Actualizar producto existente
            productId = existingProduct.id;
            await tx.product.update({
              where: { id: productId },
              data: {
                category: productData.category,
                updatedAt: new Date()
              }
            });
            log.warnings.push(`Producto existente actualizado: ${productData.name} - ${productData.brand}`);
          } else {
            // Crear nuevo producto
            const newProduct = await tx.product.create({
              data: {
                name: productData.name,
                brand: productData.brand,
                category: productData.category,
                description: `${productData.name} - ${productData.brand}`
              }
            });
            productId = newProduct.id;
            log.productsCreated++;
          }

          // Crear variantes
          for (const variant of productData.variants) {
            try {
              // Verificar si la variante ya existe por SKU
              const existingVariant = await tx.productVariant.findUnique({
                where: { sku: variant.sku }
              });

              if (existingVariant) {
                // Actualizar variante existente
                await tx.productVariant.update({
                  where: { sku: variant.sku },
                  data: {
                    size: variant.size,
                    color: variant.color,
                    costPrice: variant.costPrice,
                    priceCash: variant.priceCash,
                    priceDebit: variant.priceDebit,
                    priceFinanced: variant.priceFinanced,
                    stockQuantity: variant.stockQuantity,
                    updatedAt: new Date()
                  }
                });
                log.warnings.push(`Variante existente actualizada: SKU ${variant.sku}`);
              } else {
                // Crear nueva variante
                await tx.productVariant.create({
                  data: {
                    productId: productId,
                    size: variant.size,
                    color: variant.color,
                    sku: variant.sku,
                    costPrice: variant.costPrice,
                    priceCash: variant.priceCash,
                    priceDebit: variant.priceDebit,
                    priceFinanced: variant.priceFinanced,
                    stockQuantity: variant.stockQuantity,
                    minStockAlert: 1
                  }
                });
                log.variantsCreated++;
              }
            } catch (variantError) {
              log.errors.push(`Error creando variante SKU ${variant.sku}: ${variantError}`);
            }
          }
        } catch (productError) {
          log.errors.push(`Error procesando producto ${productData.name}: ${productError}`);
        }
      }
    }, {
      maxWait: 30000, // 30 segundos máximo de espera
      timeout: 60000, // 60 segundos timeout total
    });

    // Respuesta exitosa con log detallado
    return NextResponse.json({
      success: true,
      message: `Importación completada: ${log.productsCreated} productos creados, ${log.variantsCreated} variantes creadas`,
      log: {
        productsCreated: log.productsCreated,
        variantsCreated: log.variantsCreated,
        skippedRows: log.skippedRows,
        totalErrors: log.errors.length,
        totalWarnings: log.warnings.length,
        errors: log.errors.slice(0, 10), // Mostrar solo los primeros 10 errores
        warnings: log.warnings.slice(0, 10) // Mostrar solo los primeros 10 warnings
      }
    });

  } catch (error) {
    log.errors.push(`Error general: ${error}`);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor durante la importación',
        details: error instanceof Error ? error.message : 'Error desconocido',
        log
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}