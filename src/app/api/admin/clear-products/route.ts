import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/clear-products
 * Elimina TODOS los productos y datos relacionados de la base de datos.
 * Requiere header X-Confirm: "DELETE_ALL_PRODUCTS" para ejecutar.
 */
export async function POST(request: Request) {
  try {
    // Verificar header de confirmación
    const confirmHeader = request.headers.get('X-Confirm');
    if (confirmHeader !== 'DELETE_ALL_PRODUCTS') {
      return NextResponse.json({
        error: 'Se requiere header X-Confirm: "DELETE_ALL_PRODUCTS" para ejecutar esta operación'
      }, { status: 400 });
    }

    // Contar registros antes de eliminar
    const [
      productsCount,
      variantsCount,
      salesCount,
      saleItemsCount,
      purchasesCount,
      purchaseItemsCount
    ] = await Promise.all([
      prisma.product.count(),
      prisma.productVariant.count(),
      prisma.sale.count(),
      prisma.saleItem.count(),
      prisma.purchase.count(),
      prisma.purchaseItem.count()
    ]);

    // Eliminar en orden correcto (respetando foreign keys)
    // 1. Eliminar items de ventas (tienen FK a product_variants)
    await prisma.$executeRaw`DELETE FROM sale_items`;

    // 2. Eliminar ventas
    await prisma.$executeRaw`DELETE FROM sales`;

    // 3. Eliminar items de compras (tienen FK a product_variants)
    await prisma.$executeRaw`DELETE FROM purchase_items`;

    // 4. Eliminar compras
    await prisma.$executeRaw`DELETE FROM purchases`;

    // 5. Eliminar variantes de productos
    await prisma.$executeRaw`DELETE FROM product_variants`;

    // 6. Eliminar productos
    await prisma.$executeRaw`DELETE FROM products`;

    return NextResponse.json({
      success: true,
      message: 'Base de datos limpiada exitosamente',
      deleted: {
        products: productsCount,
        variants: variantsCount,
        sales: salesCount,
        saleItems: saleItemsCount,
        purchases: purchasesCount,
        purchaseItems: purchaseItemsCount
      }
    });

  } catch (error) {
    console.error('Error limpiando base de datos:', error);
    return NextResponse.json({
      error: 'Error al limpiar la base de datos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
