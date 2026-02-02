import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// Hojas válidas para importar (cada una es una categoría)
const VALID_SHEETS = ['Hombre', 'Mujer', 'Calzado', 'Paletas', 'Accesorios', 'Niños'];

// Tipos para manejo de datos Excel
interface ExcelRow {
  [key: number]: string | number | undefined;
}

// Normalizar texto
function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text.toString().trim().toLowerCase();
}

// Capitalizar primera letra
function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Convertir valor de celda a número decimal
function parseDecimal(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
  return isNaN(num) ? 0 : num;
}

// Limpiar SKU
function cleanSku(sku: unknown, rowIndex: number, sheetName: string): string {
  if (!sku) return `${sheetName.substring(0, 3).toUpperCase()}-${rowIndex}`;
  return sku.toString().trim().replace(/[^a-zA-Z0-9-_]/g, '') || `${sheetName.substring(0, 3).toUpperCase()}-${rowIndex}`;
}

// Detectar índice de columna por nombre (case-insensitive, con variantes)
function findColumnIndex(headers: Record<number, string>, ...keywords: string[]): number {
  const headerValues = Object.values(headers);
  for (let i = 0; i < headerValues.length; i++) {
    const normalized = normalizeText(headerValues[i]);
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return i;
      }
    }
  }
  return -1;
}

interface ImportLog {
  productsCreated: number;
  variantsCreated: number;
  errors: string[];
  warnings: string[];
  skippedRows: number;
  sheetStats: { [sheet: string]: { rows: number; imported: number; skipped: number } };
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

interface SheetColumnMapping {
  description: number;
  brand: number;
  sku: number;
  size: number;
  color: number;
  priceCash: number;
  priceDebit: number;
  priceFinanced: number;
  costPrice: number;
  sold: number;
}

// Detectar columnas de una hoja
function detectColumns(headers: Record<number, string>): SheetColumnMapping {
  return {
    description: findColumnIndex(headers, 'descripcion', 'descripción'),
    brand: findColumnIndex(headers, 'marca'),
    sku: findColumnIndex(headers, 'art'),
    size: findColumnIndex(headers, 'talle'),
    color: findColumnIndex(headers, 'color'),
    priceCash: findColumnIndex(headers, 'cdo'), // Precio Contado
    priceDebit: findColumnIndex(headers, 'débito', 'debito'),
    priceFinanced: findColumnIndex(headers, 'financiado'),
    costPrice: findColumnIndex(headers, 'costo actualizado', 'costo de compra', 'costo'),
    sold: findColumnIndex(headers, 'vendido'),
  };
}

export async function POST(request: NextRequest) {
  const log: ImportLog = {
    productsCreated: 0,
    variantsCreated: 0,
    errors: [],
    warnings: [],
    skippedRows: 0,
    sheetStats: {}
  };

  try {
    // Obtener el archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const selectedSheets = formData.get('sheets')?.toString().split(',') || VALID_SHEETS;

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

    // Filtrar hojas válidas que existen en el archivo
    const sheetsToProcess = selectedSheets.filter(
      sheet => VALID_SHEETS.includes(sheet) && workbook.SheetNames.includes(sheet)
    );

    if (sheetsToProcess.length === 0) {
      return NextResponse.json(
        {
          error: 'No se encontraron hojas válidas para importar',
          availableSheets: workbook.SheetNames,
          validSheets: VALID_SHEETS
        },
        { status: 400 }
      );
    }

    // Agrupar productos por descripción + marca
    const productsMap = new Map<string, ProductData>();

    // Procesar cada hoja
    for (const sheetName of sheetsToProcess) {
      log.sheetStats[sheetName] = { rows: 0, imported: 0, skipped: 0 };

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: false
      }) as ExcelRow[];

      if (data.length < 2) {
        log.warnings.push(`Hoja "${sheetName}" está vacía o no tiene datos`);
        continue;
      }

      // Detectar columnas
      const headers = data[0] as Record<number, string>;
      const cols = detectColumns(headers);

      // Validar columnas esenciales
      if (cols.description === -1) {
        log.errors.push(`Hoja "${sheetName}": No se encontró columna de descripción`);
        continue;
      }

      log.sheetStats[sheetName].rows = data.length - 1;

      // Procesar cada fila de datos (saltear header)
      for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex] as ExcelRow;

        try {
          // Obtener valores de la fila
          const description = row[cols.description]?.toString().trim() || '';
          const brand = cols.brand !== -1 ? (row[cols.brand]?.toString().trim() || '') : '';
          const sku = cleanSku(row[cols.sku], rowIndex, sheetName);
          const size = cols.size !== -1 ? (row[cols.size]?.toString().trim() || 'Único') : 'Único';
          const color = cols.color !== -1 ? capitalize(row[cols.color]?.toString().trim() || '') : '';
          const soldValue = cols.sold !== -1 ? normalizeText(row[cols.sold]?.toString() || '') : '';

          // Filtrar solo productos no vendidos (Vendido = "No" o vacío)
          if (soldValue === 'si' || soldValue === 'sí' || soldValue === 'yes') {
            log.skippedRows++;
            log.sheetStats[sheetName].skipped++;
            continue;
          }

          // También saltar "devuelta", "retirado", etc.
          if (soldValue && soldValue !== 'no' && soldValue !== '') {
            log.skippedRows++;
            log.sheetStats[sheetName].skipped++;
            continue;
          }

          // Validar datos esenciales
          if (!description) {
            log.warnings.push(`${sheetName} fila ${rowIndex + 1}: Sin descripción`);
            log.skippedRows++;
            log.sheetStats[sheetName].skipped++;
            continue;
          }

          // Obtener precios
          const priceCash = cols.priceCash !== -1 ? parseDecimal(row[cols.priceCash]) : 0;
          const priceDebit = cols.priceDebit !== -1 ? parseDecimal(row[cols.priceDebit]) : 0;
          const priceFinanced = cols.priceFinanced !== -1 ? parseDecimal(row[cols.priceFinanced]) : 0;
          const costPrice = cols.costPrice !== -1 ? parseDecimal(row[cols.costPrice]) : 0;

          // Crear clave única para agrupar productos
          const productKey = `${normalizeText(description)}_${normalizeText(brand)}`;

          // Si el producto no existe, crearlo con la categoría = nombre de hoja
          if (!productsMap.has(productKey)) {
            productsMap.set(productKey, {
              name: description,
              brand: brand,
              category: sheetName, // Usar nombre de hoja como categoría
              variants: []
            });
          }

          // Agregar variante al producto
          const product = productsMap.get(productKey)!;
          product.variants.push({
            size: size,
            color: color || 'Sin color',
            sku: sku,
            costPrice: costPrice,
            priceCash: priceCash,
            priceDebit: priceDebit,
            priceFinanced: priceFinanced,
            stockQuantity: 1 // Por defecto 1 unidad en stock
          });

          log.sheetStats[sheetName].imported++;

        } catch (error) {
          log.errors.push(`${sheetName} fila ${rowIndex + 1}: ${error}`);
          log.sheetStats[sheetName].skipped++;
        }
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

    // Convertir Map a Array para procesar en lotes
    const productsArray = Array.from(productsMap.values());
    const BATCH_SIZE = 50; // Procesar 50 productos por lote

    // Procesar en lotes para evitar timeout de transacción
    for (let i = 0; i < productsArray.length; i += BATCH_SIZE) {
      const batch = productsArray.slice(i, i + BATCH_SIZE);

      // Cada lote en su propia transacción
      await prisma.$transaction(async (tx) => {
        for (const productData of batch) {
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
            } else {
              // Crear nuevo producto
              const newProduct = await tx.product.create({
                data: {
                  name: productData.name,
                  brand: productData.brand,
                  category: productData.category,
                  description: productData.brand ? `${productData.name} - ${productData.brand}` : productData.name
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
                log.errors.push(`Error variante SKU ${variant.sku}: ${variantError}`);
              }
            }
          } catch (productError) {
            log.errors.push(`Error producto ${productData.name}: ${productError}`);
          }
        }
      }, {
        maxWait: 30000,
        timeout: 60000,
      });
    }

    // Respuesta exitosa con log detallado
    return NextResponse.json({
      success: true,
      message: `Importación completada: ${log.productsCreated} productos, ${log.variantsCreated} variantes`,
      log: {
        productsCreated: log.productsCreated,
        variantsCreated: log.variantsCreated,
        skippedRows: log.skippedRows,
        totalErrors: log.errors.length,
        totalWarnings: log.warnings.length,
        sheetStats: log.sheetStats,
        errors: log.errors.slice(0, 20),
        warnings: log.warnings.slice(0, 20)
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

// GET endpoint para obtener información de hojas disponibles
export async function GET() {
  return NextResponse.json({
    validSheets: VALID_SHEETS,
    description: 'Hojas válidas para importar. Cada hoja se usará como categoría.'
  });
}
