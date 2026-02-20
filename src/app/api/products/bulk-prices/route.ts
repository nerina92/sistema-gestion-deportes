import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: obtener todas las variantes con info del producto para el actualizador de precios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');

    const where: any = {};

    if (category) {
      where.product = { ...where.product, category };
    }
    if (brand) {
      where.product = { ...where.product, brand };
    }
    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const variants = await prisma.productVariant.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
            category: true,
          },
        },
      },
      orderBy: [
        { product: { category: 'asc' } },
        { product: { name: 'asc' } },
        { size: 'asc' },
      ],
    });

    // Obtener categorías y marcas únicas para los filtros
    const products = await prisma.product.findMany({
      select: { category: true, brand: true },
      distinct: ['category', 'brand'],
    });

    const categories = [...new Set(products.map((p) => p.category))].sort();
    const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();

    const formatted = variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      costPrice: Number(v.costPrice),
      priceCash: Number(v.priceCash),
      priceDebit: Number(v.priceDebit),
      priceFinanced: Number(v.priceFinanced),
      stockQuantity: v.stockQuantity,
      product: {
        id: v.product.id,
        name: v.product.name,
        brand: v.product.brand,
        category: v.product.category,
      },
    }));

    return NextResponse.json({
      success: true,
      variants: formatted,
      filters: { categories, brands },
    });
  } catch (error: any) {
    console.error('Error GET bulk-prices:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT: actualizar precios de múltiples variantes
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body as {
      updates: {
        id: string;
        costPrice: number;
        priceCash: number;
        priceDebit: number;
        priceFinanced: number;
      }[];
    };

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay actualizaciones para procesar' },
        { status: 400 }
      );
    }

    // Actualizar en transacción, de a lotes de 50 para no agotar el timeout
    const BATCH_SIZE = 50;
    let totalUpdated = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((u) =>
          prisma.productVariant.update({
            where: { id: u.id },
            data: {
              costPrice: u.costPrice,
              priceCash: u.priceCash,
              priceDebit: u.priceDebit,
              priceFinanced: u.priceFinanced,
            },
          })
        )
      );
      totalUpdated += batch.length;
    }

    return NextResponse.json({
      success: true,
      updated: totalUpdated,
      message: `Se actualizaron ${totalUpdated} variantes correctamente.`,
    });
  } catch (error: any) {
    console.error('Error PUT bulk-prices:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
