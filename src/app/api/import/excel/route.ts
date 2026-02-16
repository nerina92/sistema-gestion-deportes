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

// Tipos para manejo de datos Excel
interface ExcelRow {
  [key: number]: string | number | undefined;
}

// Normalizar texto
function normalizeText(text: string): string {
  if (!text) return '';
  return text.toString().trim().toLowerCase();
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

    // Verificar que existan las hojas requeridas
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

    // Agrupar productos por descripción + marca
    const productsMap = new Map<string, ProductData>();

    // Procesar cada hoja
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

      // Estructura de columnas según tu Excel:
      // Columna A (0): Index
      // Columna B (1): Descripcion
      // Columna C (2): Marca
      // Columna D (3): ART (SKU)
      // Columna E (4): Talle
      // Columna F (5): Color
      // Columna G (6): Cdo (Precio Contado)
      // Columna H (7): Precio Lista
      // Columna I (8): Débito
      // Columna J (9): Financiado
      // Columna K (10): Fecha Ingreso
      // Columna L (11): Costo de compra
      // Columna M (12): Costo actualizado
      // Columna Q (16): Vendido?

      // Procesar cada fila de datos (saltear header que está en fila 1)
      for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex] as ExcelRow;

        try {
          // Obtener valores de la fila usando los índices correctos
          const description = row[1]?.toString().trim() || '';  // Columna B
          const brand = row[2]?.toString().trim() || '';        // Columna C
          const sku = cleanSku(row[3]);                         // Columna D
          const size = row[4]?.toString().trim() || 'Único';    // Columna E
          const color = row[5]?.toString().trim() || '';        // Columna F
          const priceCash = parseDecimal(row[6]);               // Columna G (Cdo)
          const priceDebit = parseDecimal(row[8]);              // Columna I (Débito)
          const priceFinanced = parseDecimal(row[9]);           // Columna J (Financiado)
          const costPrice = parseDecimal(row[12]);              // Columna M (Costo actualizado)
          const sold = normalizeText(row[16]?.toString() || ''); // Columna Q (Vendido?)

          // Validaciones básicas
          if (!description || !brand) {
            log.skippedRows++;
            continue;
          }

          if (!sku) {
            log.warnings.push(`Hoja "${sheetName}", Fila ${rowIndex + 1}: SKU vacío para "${description}"`);
            log.skippedRows++;
            continue;
          }

          // Filtrar solo productos no vendidos
          if (sold === 'si' || sold === 'sí' || sold === 'yes') {
            log.skippedRows++;
            continue;
          }

          // Validar precios
          if (priceCash === 0 && priceDebit === 0 && priceFinanced === 0) {
            log.warnings.push(`Hoja "${sheetName}", Fila ${rowIndex + 1}: Todos los precios son 0 para "${description}"`);
          }

          // Crear clave única para agrupar productos
          const productKey = `${normalizeText(description)}_${normalizeText(brand)}`;

          // Si el producto no existe, crearlo
          if (!productsMap.has(productKey)) {
            productsMap.set(productKey, {
              name: description,
              brand: brand,
              category: category,
              variants: []
            });
          }

          // Agregar variante al producto
          const product = productsMap.get(productKey)!;
          product.variants.push({
            size,
            color,
            sku,
            costPrice,
            priceCash,
            priceDebit,
            priceFinanced,
            stockQuantity: 1  // Por defecto 1, se puede ajustar
          });

        } catch (error: any) {
          log.errors.push(`Hoja "${sheetName}", Fila ${rowIndex + 1}: ${error.message}`);
        }
      }
    }

    // Insertar productos en la base de datos
    await prisma.$transaction(async (tx) => {
      for (const [, productData] of productsMap) {
        // Verificar si el producto ya existe
        let product = await tx.product.findFirst({
          where: {
            name: productData.name,
            brand: productData.brand
          }
        });

        // Si no existe, crear el producto
        if (!product) {
          product = await tx.product.create({
            data: {
              name: productData.name,
              brand: productData.brand,
              category: productData.category,
            }
          });
          log.productsCreated++;
        } else {
          log.warnings.push(`Producto existente actualizado: ${product.name}`);
        }

        // Insertar variantes
        for (const variant of productData.variants) {
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
                minStockAlert: 5 // Valor por defecto
              }
            });
            log.warnings.push(`Variante existente actualizada: SKU ${variant.sku}`);
          } else {
            // Crear nueva variante
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
                minStockAlert: 5 // Valor por defecto
              }
            });
            log.variantsCreated++;
          }
        }
      }
    }, {
      maxWait: 20000, // Esperar hasta 20 segundos para que comience la transacción
      timeout: 60000, // Permitir hasta 60 segundos para completar la transacción
    });

    // Calcular totales
    log.totalErrors = log.errors.length;
    log.totalWarnings = log.warnings.length;

    // Retornar resultado exitoso
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
