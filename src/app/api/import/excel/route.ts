import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { computeVariantPrices } from '@/lib/pricing';
import { defaultPricing, getBusinessSettings, type BusinessSettings } from '@/lib/settings';
import { requireTenant } from '@/lib/api-auth';
import type { TenantDb } from '@/lib/tenant-db';


// Planilla genérica: cualquier hoja cuya primera fila tenga encabezados
// reconocibles. Cada fila = 1 variante; las filas se agrupan en productos por
// Nombre + Marca. Si no hay columna Categoría se usa el nombre de la hoja.
type ColumnKey = 'name' | 'brand' | 'category' | 'sku' | 'barcode' | 'size' | 'color' | 'costPrice' | 'stock';

const HEADER_ALIASES: Record<ColumnKey, string[]> = {
  name: ['nombre', 'producto', 'descripcion', 'articulo'],
  brand: ['marca'],
  category: ['categoria', 'rubro', 'familia'],
  sku: ['sku', 'codigo', 'cod', 'art', 'codigo interno'],
  barcode: ['codigo de barras', 'cod barras', 'barcode', 'ean'],
  size: ['talle', 'atributo 1', 'atributo1', 'variante', 'medida', 'tamano'],
  color: ['color', 'atributo 2', 'atributo2', 'presentacion'],
  costPrice: ['costo', 'precio costo', 'precio de costo', 'costo unitario'],
  stock: ['stock', 'cantidad', 'existencia'],
};

function normalizeHeader(text: unknown): string {
  return (text ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Detecta las columnas a partir de la fila de encabezados. */
function detectColumns(
  headerRow: ExcelRow,
  settings: BusinessSettings
): Partial<Record<ColumnKey, number>> {
  const aliases: Record<ColumnKey, string[]> = {
    ...HEADER_ALIASES,
    // Las etiquetas configuradas del negocio también valen como encabezado.
    size: [...HEADER_ALIASES.size, normalizeHeader(settings.variantAttr1Label)],
    color: [...HEADER_ALIASES.color, normalizeHeader(settings.variantAttr2Label)],
  };
  const cols: Partial<Record<ColumnKey, number>> = {};
  Object.entries(headerRow).forEach(([index, value]) => {
    const header = normalizeHeader(value);
    if (!header) return;
    for (const key of Object.keys(aliases) as ColumnKey[]) {
      if (cols[key] === undefined && aliases[key].includes(header)) {
        cols[key] = Number(index);
        return;
      }
    }
  });
  return cols;
}

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
  barcode: string | null;
  variants: VariantData[];
}

interface VariantData {
  size: string;
  color: string;
  sku: string;
  costPrice: number;
  stockQuantity: number;
}

// Procesar una sola hoja del Excel y devolver los productos agrupados
function parseSheet(
  sheetName: string,
  data: ExcelRow[],
  cols: Partial<Record<ColumnKey, number>>,
  log: ImportLog
): Map<string, ProductData> {
  const sheetProductsMap = new Map<string, ProductData>();
  let autoSkuCounter = Date.now();
  const cell = (row: ExcelRow, key: ColumnKey) =>
    cols[key] === undefined ? '' : row[cols[key]!]?.toString().trim() || '';

  for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex] as ExcelRow;

    try {
      const name = cell(row, 'name');
      const brand = cell(row, 'brand');
      const category = cell(row, 'category') || sheetName;
      let sku = cleanSku(cell(row, 'sku'));
      const barcode = cell(row, 'barcode') || null;
      const size = cell(row, 'size');
      const color = cell(row, 'color');
      const costPrice = parseDecimal(cell(row, 'costPrice'));
      const stockQuantity = cols.stock === undefined ? 0 : Math.max(0, Math.round(parseDecimal(cell(row, 'stock'))));

      if (!name) {
        log.skippedRows++;
        continue;
      }

      if (!sku) {
        autoSkuCounter++;
        sku = generateSku(name, brand, size, color, autoSkuCounter);
      }

      const productKey = `${normalizeText(name)}_${normalizeText(brand)}`;
      if (!sheetProductsMap.has(productKey)) {
        sheetProductsMap.set(productKey, { name, brand, category, barcode, variants: [] });
      }
      const product = sheetProductsMap.get(productKey)!;

      if (product.variants.some(v => v.sku === sku)) {
        autoSkuCounter++;
        sku = generateSku(name, brand, size, color, autoSkuCounter);
      }

      product.variants.push({ size, color, sku, costPrice, stockQuantity });
    } catch (error: any) {
      log.errors.push(`Hoja "${sheetName}", Fila ${rowIndex + 1}: ${error.message}`);
    }
  }

  return sheetProductsMap;
}

// Insertar productos en DB en batches pequeños
async function insertProducts(
  prisma: TenantDb,
  settings: BusinessSettings,
  sheetProductsMap: Map<string, ProductData>,
  sheetName: string,
  log: ImportLog
): Promise<void> {
  const productEntries = Array.from(sheetProductsMap.entries());
  const BATCH_SIZE = 20; // Reducido a 20 para evitar timeouts

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
          const categoryRow = await tx.category.upsert({
            where: { name: productData.category },
            update: {},
            create: { name: productData.category },
          });
          const barcodeTaken = productData.barcode
            ? await tx.product.findUnique({ where: { barcode: productData.barcode }, select: { id: true } })
            : null;
          product = await tx.product.create({
            data: {
              name: productData.name,
              brand: productData.brand || null,
              categoryId: categoryRow.id,
              barcode: barcodeTaken ? null : productData.barcode,
              marginCash: settings.defaultMarginCash,
              surchargeDebit: settings.defaultSurchargeDebit,
              surchargeFinanced: settings.defaultSurchargeFinanced,
            }
          });
          log.productsCreated++;
        }

        for (const variant of productData.variants) {
          const existingVariant = await tx.productVariant.findUnique({
            where: { sku: variant.sku }
          });

          if (existingVariant) {
            const prices = computeVariantPrices(variant.costPrice, defaultPricing(settings), settings.priceRounding);
            await tx.productVariant.update({
              where: { sku: variant.sku },
              data: {
                size: variant.size,
                color: variant.color,
                costPrice: variant.costPrice,
                priceCash: prices.priceCash,
                priceDebit: prices.priceDebit,
                priceFinanced: prices.priceFinanced,
                // Si ya tiene stock > 0 no lo pisamos para no perder ajustes manuales
                stockQuantity: existingVariant.stockQuantity > 0
                  ? existingVariant.stockQuantity
                  : variant.stockQuantity,
                minStockAlert: settings.defaultMinStockAlert
              }
            });
          } else {
            const prices = computeVariantPrices(variant.costPrice, defaultPricing(settings), settings.priceRounding);
            await tx.productVariant.create({
              data: {
                productId: product.id,
                size: variant.size,
                color: variant.color,
                sku: variant.sku,
                costPrice: variant.costPrice,
                priceCash: prices.priceCash,
                priceDebit: prices.priceDebit,
                priceFinanced: prices.priceFinanced,
                stockQuantity: variant.stockQuantity,
                minStockAlert: settings.defaultMinStockAlert
              }
            });
            log.variantsCreated++;
          }
        }
      }
    }, {
      maxWait: 15000,
      timeout: 50000,
    });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireTenant('productos-editar');
  if (ctx instanceof NextResponse) return ctx;
  const prisma = ctx.db;

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
    // sheetName opcional: si se pasa, solo procesa esa hoja
    const sheetNameParam = formData.get('sheetName') as string | null;

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

    const settings = await getBusinessSettings(prisma);

    // Lee cada hoja y detecta sus columnas por los encabezados de la fila 1.
    const readSheet = (name: string) => {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
        header: 1,
        defval: '',
        raw: false
      }) as ExcelRow[];
      return { rows, cols: rows.length > 0 ? detectColumns(rows[0], settings) : {} };
    };
    const importableSheets = workbook.SheetNames.filter(name => readSheet(name).cols.name !== undefined);

    // Si se pide listar hojas disponibles
    if (sheetNameParam === '__list__') {
      return NextResponse.json({
        success: true,
        sheets: importableSheets
      });
    }

    // Determinar qué hojas procesar
    const sheetsToProcess = sheetNameParam && importableSheets.includes(sheetNameParam)
      ? [sheetNameParam]
      : importableSheets;

    if (sheetsToProcess.length === 0) {
      return NextResponse.json(
        {
          error: 'No se encontró ninguna hoja con encabezados reconocibles. La primera fila debe tener al menos una columna "Nombre".',
          details: `Hojas encontradas: ${workbook.SheetNames.join(', ')}`
        },
        { status: 400 }
      );
    }

    for (const sheetName of sheetsToProcess) {
      const { rows: data, cols } = readSheet(sheetName);

      if (data.length < 2) {
        log.warnings.push(`Hoja "${sheetName}" está vacía`);
        continue;
      }

      const sheetProductsMap = parseSheet(sheetName, data, cols, log);

      try {
        await insertProducts(prisma, settings, sheetProductsMap, sheetName, log);
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
