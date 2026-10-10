import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Exportar stock local a Tienda Nube
export async function POST() {
  try {
    const config = await prisma.tiendanubeConfig.findFirst({
      where: { isActive: true }
    });

    if (!config) {
      return NextResponse.json({ error: 'Tienda Nube no configurada' }, { status: 400 });
    }

    // Obtener productos con mapeo a TN
    const variants = await prisma.productVariant.findMany({
      where: {
        tiendanubeVariantId: { not: null }
      },
      include: {
        product: true
      }
    });

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Actualizar cada variante en TN
    for (const variant of variants) {
      try {
        const response = await fetch(
          `https://api.tiendanube.com/v1/${config.storeId}/products/${variant.tiendanubeProductId}/variants/${variant.tiendanubeVariantId}`,
          {
            method: 'PUT',
            headers: {
              'Authentication': `bearer ${config.accessToken}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Sistema Gestion Deportes'
            },
            body: JSON.stringify({
              stock: variant.stockQuantity
            })
          }
        );

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
          const errorText = await response.text();
          errors.push(`${variant.product.name} - ${variant.sku}: ${response.statusText} - ${errorText}`);
        }
      } catch (error: any) {
        errorCount++;
        errors.push(`${variant.product.name} - ${variant.sku}: ${error.message}`);
      }
    }

    // Registrar en logs
    await prisma.syncLog.create({
      data: {
        action: 'export',
        status: errorCount === 0 ? 'success' : 'error',
        details: `Exportados: ${successCount}, Errores: ${errorCount}`,
        errorMessage: errors.length > 0 ? errors.join('\n') : null
      }
    });

    // Actualizar última sincronización
    await prisma.tiendanubeConfig.update({
      where: { id: config.id },
      data: { lastSyncAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      exported: successCount,
      errors: errorCount,
      errorDetails: errors
    });
  } catch (error: any) {
    console.error('Error al exportar stock:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
