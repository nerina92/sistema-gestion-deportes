import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// Hojas a procesar y su categoría correspondiente
const SHEETS_TO_IMPORT = {
  'Hombre': 'Hombres',
  'Mujer': 'Mujeres',
  'Calzado': 'Calzado',
  'Paletas': 'Paletas',
  'Accesorios': 'Accesorios',
  'Niños': 'Niños'
};

// Paletas tiene una estructura de columnas diferente (sin Talle ni Color)
const PALETAS_COLUMN_MAP = {
  description: 1,    // B
  brand: 2,           // C
  sku: 3,             // D (Art)
  priceCash: 4,       // E (Cdo)
  priceDebit: 6,      // G (Débito)
  priceFinanced: 7,   // H (Financiado)
  costPrice: 10,      // K (Costo actualizado)
  sold: 13,           // N (Vendido?)
};

// Columnas estándar para las demás hojas
const STANDARD_COLUMN_MAP = {
  description: 1,    // B
  brand: 2,           // C
  sku: 3,             // D (ART)
  size: 4,            // E (Talle)
  color: 5,           // F (Color)
  priceCash: 6,       // G (Cdo)
  priceDebit: 8,      // I (Débito)
  priceFinanced: 9,   // J (Financiado)
  costPrice: 12,      // M (Costo actualizado)
  sold: 16,           // Q (Vendido?)
};

interface ExcelRow {
  [key: number]: string | number | undefined;
}

function normalizeText(text: string): string {
  if (!text) return '';
  return text.toString().trim().toLowerCase();
}

function parseDecimal(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
  return isNaN(num) ? 0 : num;
}

function cleanSku(sku: unknown): string {
  if (!sku) return '';
  return sku.toString().trim().replace(/[^a-zA-Z0-9\-_. ]/g, '').replace(/\s+/g, '-');
}

// Generar SKU automático cuando no existe
function generateSku(name: string, brand: string, size: string, color: string, index: number): string {
  const namePart = name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const brandPart = brand.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const sizePart = size.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'U';
  const colorPart = color.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'X';
  return `${namePart}-${brandPart}-${sizePart}-${colorPart}-${index}`;
}

interface ImportLog {
  productsCreated: number;
  variantsCreated: number;
  errors: string[];
  warnings: string[];
  skippedRows: number;
  totalErrors: number;
  totalWarnings: number;
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
    skippedRows: 0,
    totalErrors: 0,
    totalWarnings: 0
  };

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'El archivo debe ser formato Excel (.xlsx o .xls)' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const availableSheets = workbook.SheetNames.filter(name => name in SHEETS_TO_IMPORT);

    if (availableSheets.length === 0) {
      return NextResponse.json(
        {
          error: 'No se encontraron las hojas esperadas (Hombre, Mujer, Calzado, Paletas, Accesorios, Niños)',
          details: `Hojas encontradas: ${workbook.SheetNames.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Contador global para SKUs auto-generados
    let autoSkuCounter = Date.now();

    for (const sheetName of availableSheets) {
      const category = SHEETS_TO_IMPORT[sheetName as keyof typeof SHEETS_TO_IMPORT];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: false
      }) as ExcelRow[];

      if (data.length < 2) {
        log.warnings.push(`Hoja "${sheetName}" está vacía`);
        continue;
      }

      const sheetProductsMap = new Map<string, ProductData>();
      const isPaletas = sheetName === 'Paletas';
      const cols = isPaletas ? PALETAS_COLUMN_MAP : STANDARD_COLUMN_MAP;

      for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex] as ExcelRow;

        try {
          const description = row[cols.description]?.toString().trim() || '';
          const brand = row[cols.brand]?.toString().trim() || '';
          let sku = cleanSku(row[cols.sku]);
          const size = isPaletas ? 'Único' : (row[(cols as any).size]?.toString().trim() || 'Único');
          const color = isPaletas ? '' : (row[(cols as any).color]?.toString().trim() || '');
          const priceCash = parseDecimal(row[cols.priceCash]);
          const priceDebit = parseDecimal(row[cols.priceDebit]);
          const priceFinanced = parseDecimal(row[cols.priceFinanced]);
          const costPrice = parseDecimal(row[cols.costPrice]);
          const sold = normalizeText(row[cols.sold]?.toString() || '');

          // Validar campos obligatorios
          if (!description) {
            log.skippedRows++;
            continue;
          }

          if (!brand) {
            log.skippedRows++;
            continue;
          }

          // Filtrar vendidos, devueltos, retirados
          if (sold === 'si' || sold === 'sí' || sold === 'yes' || sold === 'devuelta' || sold === 'retirado') {
            log.skippedRows++;
            continue;
          }

          // Auto-generar SKU si no tiene
          if (!sku) {
            autoSkuCounter++;
            sku = generateSku(description, brand, size, color, autoSkuCounter);
            log.warnings.push(`Hoja "${sheetName}", Fila ${rowIndex + 1}: SKU auto-generado "${sku}" para "${description}"`);
          }

          // Crear clave única para agrupar productos
          const productKey = `${normalizeText(description)}_${normalizeText(brand)}`;

          if (!sheetProductsMap.has(productKey)) {
            sheetProductsMap.set(productKey, {
              name: description,
              brand: brand,
              category: category,
              variants: []
            });
          }

          const product = sheetProductsMap.get(productKey)!;

          // Verificar que no haya SKU duplicado dentro del mismo producto
          const existingVariant = product.variants.find(v => v.sku === sku);
          if (existingVariant) {
            // SKU duplicado en el mismo producto, generar uno nuevo
            autoSkuCounter++;
            sku = generateSku(description, brand, size, color, autoSkuCounter);
          }

          product.variants.push({
            size,
            color,
            sku,
            costPrice,
            priceCash,
            priceDebit,
            priceFinanced,
            stockQuantity: 1
          });

        } catch (error: any) {
          log.errors.push(`Hoja "${sheetName}", Fila ${rowIndex + 1}: ${error.message}`);
        }
      }

      // Insertar productos en batches más pequeños para evitar timeout
      try {
        const productEntries = Array.from(sheetProductsMap.entries());
        const BATCH_SIZE = 50;

        for (let i = 0; i < productEntries.length; i += BATCH_SIZE) {
          const batch = productEntries.slice(i, i + BATCH_SIZE);

          await prisma.$transaction(async (tx) => {
            for (const [, productData] of batch) {
              let product = await tx.product.findFirst({
                where: {
                  name: productData.name,
                  brand: productData.brand
                }
              });

              if (!product) {
                product = await tx.product.create({
                  data: {
                    name: productData.name,
                    brand: productData.brand,
                    category: productData.category,
                  }
                });
                log.productsCreated++;
              }

              for (const variant of productData.variants) {
                const existingVariant = await tx.productVariant.findUnique({
                  where: { sku: variant.sku }
                });

                if (existingVariant) {
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
                      minStockAlert: 5
                    }
                  });
                } else {
                  await tx.productVariant.create({
                    data: {
                      productId: product.id,
                      size: variant.size,
                      color: variant.color,
                      sku: variant.sku,
                      costPrice: variant.costPrice,
                      priceCash: variant.priceCash,
                      priceDebit: variant.priceDebit,
                      priceFinanced: variant.priceFinanced,
                      stockQuantity: variant.stockQuantity,
                      minStockAlert: 5
                    }
                  });
                  log.variantsCreated++;
                }
              }
            }
          }, {
            maxWait: 20000,
            timeout: 120000,
          });
        }

        log.warnings.push(`✓ Hoja "${sheetName}" procesada: ${sheetProductsMap.size} productos`);
      } catch (error: any) {
        log.errors.push(`Error al procesar hoja "${sheetName}": ${error.message}`);
      }
    }

    log.totalErrors = log.errors.length;
    log.totalWarnings = log.warnings.length;

    return NextResponse.json({
      success: true,
      message: `Importación completada: ${log.productsCreated} productos creados, ${log.variantsCreated} variantes creadas`,
      log
    });

  } catch (error: any) {
    log.errors.push(`Error general: ${error.message}`);
    log.totalErrors = log.errors.length;

    return NextResponse.json(
      {
        error: 'Error al procesar el archivo Excel',
        details: error.message,
        log
      },
      { status: 500 }
    );
  }
}
