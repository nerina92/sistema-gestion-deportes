import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/stock/low - Obtener variantes con stock bajo
 * Retorna variantes donde stock_quantity <= min_stock_alert
 * Ordenadas por diferencia (más críticos primero)
 */
export async function GET() {
  try {
    // Query para obtener variantes con stock bajo junto con info del producto
    const lowStockVariants = await prisma.$queryRaw<Array<{
      variant_id: string;
      product_id: string;
      product_name: string;
      brand: string;
      size: string;
      color: string;
      sku: string;
      stock_quantity: number;
      min_stock_alert: number;
      difference: number;
      cost_price: string;
      price_cash: string;
    }>>`
      SELECT
        pv.id as variant_id,
        p.id as product_id,
        p.name as product_name,
        p.brand,
        pv.size,
        pv.color,
        pv.sku,
        pv.stock_quantity,
        pv.min_stock_alert,
        (pv.stock_quantity - pv.min_stock_alert) as difference,
        pv.cost_price,
        pv.price_cash
      FROM product_variants pv
      INNER JOIN products p ON pv.product_id = p.id
      WHERE pv.stock_quantity <= pv.min_stock_alert
      ORDER BY difference ASC, pv.stock_quantity ASC
    `;

    // Formatear respuesta
    const formattedVariants = lowStockVariants.map(v => ({
      variantId: v.variant_id,
      productId: v.product_id,
      productName: v.product_name,
      brand: v.brand,
      size: v.size,
      color: v.color,
      sku: v.sku,
      stockQuantity: Number(v.stock_quantity),
      minStockAlert: Number(v.min_stock_alert),
      difference: Number(v.difference),
      costPrice: Number(v.cost_price),
      priceCash: Number(v.price_cash),
    }));

    return NextResponse.json({
      success: true,
      data: formattedVariants,
      total: formattedVariants.length
    });

  } catch (error) {
    console.error('Error fetching low stock variants:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor al obtener stock bajo'
      },
      { status: 500 }
    );
  }
}
