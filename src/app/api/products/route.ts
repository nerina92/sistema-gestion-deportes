import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Product, ProductVariant } from '@prisma/client';
import { validateProductInput, sanitizeProductInput, validateProductsQueryParams } from '@/lib/validation';
import { ProductInput, ProductsListResponse } from '@/types/products';

type ProductWithVariants = Product & { variants: ProductVariant[] };

const prisma = new PrismaClient();

/**
 * GET /api/products - Listar productos con paginación y filtros
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);
    const { page, limit, search, category, brand, lowStock } = validateProductsQueryParams(params);

    // Construir filtros de búsqueda
    const where: any = {};

    // Filtro de búsqueda en nombre, marca y código de barras
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtros específicos
    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' };
    }

    // Calcular offset para paginación
    const skip = (page - 1) * limit;

    // Si se solicita filtro de stock bajo, necesitamos usar una consulta más compleja
    let products: ProductWithVariants[];
    let total: number;

    if (lowStock) {
      // Para stock bajo, usar consulta raw para comparar campos
      const lowStockProductIds = await prisma.$queryRaw<{ id: string }[]>`
        SELECT DISTINCT p.id FROM products p
        INNER JOIN product_variants pv ON p.id = pv.product_id
        WHERE pv.stock_quantity <= pv.min_stock_alert
      `;

      if (lowStockProductIds.length === 0) {
        products = [];
        total = 0;
      } else {
        const productIds = lowStockProductIds.map(p => p.id);
        const whereWithLowStock = {
          ...where,
          id: { in: productIds }
        };

        const [productsResult, totalResult] = await Promise.all([
          prisma.product.findMany({
            where: whereWithLowStock,
            include: {
              variants: true
            },
            skip,
            take: limit,
            orderBy: { updatedAt: 'desc' }
          }),
          prisma.product.count({ where: whereWithLowStock })
        ]);

        products = productsResult;
        total = totalResult;
      }
    } else {
      // Búsqueda normal
      const [productsResult, totalResult] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            variants: true
          },
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' }
        }),
        prisma.product.count({ where })
      ]);

      products = productsResult;
      total = totalResult;
    }

    // Formatear respuesta
    const formattedProducts = products.map(product => ({
      ...product,
      variants: product.variants.map(variant => ({
        ...variant,
        costPrice: Number(variant.costPrice),
        priceCash: Number(variant.priceCash),
        priceDebit: Number(variant.priceDebit),
        priceFinanced: Number(variant.priceFinanced)
      }))
    }));

    const response: ProductsListResponse = {
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener productos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products - Crear producto con variantes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Sanitizar datos de entrada
    const sanitizedData = sanitizeProductInput(body);
    
    // Validar datos de entrada
    const validation = validateProductInput(sanitizedData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Datos de entrada inválidos', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    const productData: ProductInput = sanitizedData;

    // Verificar que los SKUs sean únicos
    const existingSKUs = await prisma.productVariant.findMany({
      where: {
        sku: {
          in: productData.variants.map(v => v.sku)
        }
      },
      select: { sku: true }
    });

    if (existingSKUs.length > 0) {
      return NextResponse.json(
        { 
          error: 'SKUs duplicados',
          details: [`Los siguientes SKUs ya existen: ${existingSKUs.map(s => s.sku).join(', ')}`]
        },
        { status: 400 }
      );
    }

    // Crear producto y variantes en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear el producto
      const product = await tx.product.create({
        data: {
          name: productData.name,
          brand: productData.brand,
          category: productData.category,
          description: productData.description,
          barcode: productData.barcode,
          imageUrl: productData.imageUrl,
        }
      });

      // Crear las variantes
      const variants = await Promise.all(
        productData.variants.map(variant =>
          tx.productVariant.create({
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
              minStockAlert: variant.minStockAlert,
            }
          })
        )
      );

      return { ...product, variants };
    });

    // Formatear precios para respuesta
    const formattedResult = {
      ...result,
      variants: result.variants.map(variant => ({
        ...variant,
        costPrice: Number(variant.costPrice),
        priceCash: Number(variant.priceCash),
        priceDebit: Number(variant.priceDebit),
        priceFinanced: Number(variant.priceFinanced)
      }))
    };

    return NextResponse.json(formattedResult, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    
    // Manejo específico para errores de Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Violación de restricción única (SKU o código de barras duplicado)' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor al crear producto' },
      { status: 500 }
    );
  }
}