import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { computeVariantPrices } from '@/lib/pricing';

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
      where.product = { ...where.product, categoryId: category };
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
            category: { select: { name: true } },
            categoryId: true,
            marginCash: true,
            surchargeDebit: true,
            surchargeFinanced: true,
          },
        },
      },
      orderBy: [
        { product: { categoryId: 'asc' } },
        { product: { name: 'asc' } },
        { size: 'asc' },
      ],
    });

    // Obtener categorías y marcas únicas para los filtros
    const categoriesList = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    const productsForBrands = await prisma.product.findMany({ select: { brand: true } });
    const brands = [...new Set(productsForBrands.map((p) => p.brand).filter(Boolean))].sort();

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
        category: v.product.category?.name ?? '',
        categoryId: v.product.categoryId,
        marginCash: Number(v.product.marginCash),
        surchargeDebit: Number(v.product.surchargeDebit),
        surchargeFinanced: Number(v.product.surchargeFinanced),
      },
    }));

    return NextResponse.json({
      success: true,
      variants: formatted,
      filters: { categories: categoriesList, brands },
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
      updates: { id: string; costPrice: number }[];
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
      const planned = await Promise.all(batch.map(async (u) => {
        const variant = await prisma.productVariant.findUnique({
          where: { id: u.id },
          include: { product: { select: { marginCash: true, surchargeDebit: true, surchargeFinanced: true } } },
        });
        if (!variant) return null;
        const pct = {
          marginCash: Number(variant.product.marginCash),
          surchargeDebit: Number(variant.product.surchargeDebit),
          surchargeFinanced: Number(variant.product.surchargeFinanced),
        };
        const prices = computeVariantPrices(u.costPrice, pct);
        return { id: u.id, costPrice: u.costPrice, prices };
      }));
      const ops = planned
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((p) =>
          prisma.productVariant.update({
            where: { id: p.id },
            data: { costPrice: p.costPrice, priceCash: p.prices.priceCash, priceDebit: p.prices.priceDebit, priceFinanced: p.prices.priceFinanced },
          })
        );
      await prisma.$transaction(ops);
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
