import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            isActive: true
          }
        },
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    description: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!purchase) {
      return NextResponse.json(
        {
          success: false,
          error: 'Compra no encontrada'
        },
        { status: 404 }
      );
    }

    // Formatear response con datos calculados
    const formattedPurchase = {
      ...purchase,
      itemCount: purchase.items.length,
      itemsSummary: purchase.items.map(item => ({
        id: item.id,
        productName: item.productVariant.product.name,
        variantSku: item.productVariant.sku,
        variantSize: item.productVariant.size,
        variantColor: item.productVariant.color,
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal: item.subtotal
      }))
    };

    return NextResponse.json({
      success: true,
      data: formattedPurchase
    });

  } catch (error) {
    console.error('Error al obtener compra:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar que la compra existe
    const existingPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            productVariant: true
          }
        }
      }
    });

    if (!existingPurchase) {
      return NextResponse.json(
        {
          success: false,
          error: 'Compra no encontrada'
        },
        { status: 404 }
      );
    }

    // Solo permitir cancelar compras pendientes
    if (existingPurchase.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: 'Solo se pueden cancelar compras pendientes'
        },
        { status: 400 }
      );
    }

    // Cancelar compra con transacción (opcionalmente revertir stock)
    const cancelledPurchase = await prisma.$transaction(async (tx) => {
      // Cambiar status a cancelled
      const updatedPurchase = await tx.purchase.update({
        where: { id },
        data: {
          status: 'cancelled'
        }
      });

      // OPCIONAL: Revertir stock (comentado para MVP simple)
      /*
      for (const item of existingPurchase.items) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }
      */

      return updatedPurchase;
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Compra cancelada correctamente',
        purchase: cancelledPurchase
      }
    });

  } catch (error) {
    console.error('Error al cancelar compra:', error);

    // Manejar errores específicos de Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          {
            success: false,
            error: 'Compra no encontrada'
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

// Endpoint adicional para aprobar compras pendientes (bonus)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action !== 'approve') {
      return NextResponse.json(
        {
          success: false,
          error: 'Acción no válida. Use "approve"'
        },
        { status: 400 }
      );
    }

    // Verificar que la compra existe y está pendiente
    const existingPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!existingPurchase) {
      return NextResponse.json(
        {
          success: false,
          error: 'Compra no encontrada'
        },
        { status: 404 }
      );
    }

    if (existingPurchase.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: 'Solo se pueden aprobar compras pendientes'
        },
        { status: 400 }
      );
    }

    // Aprobar compra y actualizar stock
    const approvedPurchase = await prisma.$transaction(async (tx) => {
      // Cambiar status a completed
      const updatedPurchase = await tx.purchase.update({
        where: { id },
        data: {
          status: 'completed'
        }
      });

      // Actualizar stock de todas las variantes
      for (const item of existingPurchase.items) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: {
            stockQuantity: {
              increment: item.quantity
            },
            costPrice: item.unitCost
          }
        });
      }

      return updatedPurchase;
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Compra aprobada y stock actualizado',
        purchase: approvedPurchase
      }
    });

  } catch (error) {
    console.error('Error al aprobar compra:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}