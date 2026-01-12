import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    brand: true,
                    category: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!sale) {
      return NextResponse.json(
        {
          success: false,
          error: 'Venta no encontrada'
        },
        { status: 404 }
      );
    }

    // Formatear la respuesta
    const formattedSale = {
      id: sale.id,
      saleDate: sale.saleDate,
      paymentMethod: sale.paymentMethod,
      priceType: sale.priceType,
      totalAmount: sale.totalAmount,
      notes: sale.notes,
      createdAt: sale.createdAt,
      items: sale.items.map(item => ({
        id: item.id,
        productId: item.productVariant.product.id,
        productName: item.productVariant.product.name,
        brand: item.productVariant.product.brand,
        category: item.productVariant.product.category,
        size: item.productVariant.size,
        color: item.productVariant.color,
        sku: item.productVariant.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal
      }))
    };

    return NextResponse.json({
      success: true,
      data: formattedSale
    });
  } catch (error) {
    console.error('Error al obtener detalle de venta:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
