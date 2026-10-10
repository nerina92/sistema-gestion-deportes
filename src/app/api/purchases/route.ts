import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Tipo para el body del POST
interface CreatePurchaseItem {
  productVariantId: string;
  quantity: number;
  unitCost: number;
}

interface CreatePurchaseBody {
  supplierId: string;
  purchaseDate: string;
  notes?: string;
  items: CreatePurchaseItem[];
}

export async function GET(request: NextRequest) {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        purchaseDate: 'desc'
      }
    });

    // Formatear response para incluir datos calculados
    const formattedPurchases = purchases.map(purchase => ({
      id: purchase.id,
      purchaseDate: purchase.purchaseDate,
      supplier: {
        id: purchase.supplier.id,
        name: purchase.supplier.name
      },
      totalAmount: purchase.totalAmount,
      status: purchase.status,
      itemCount: purchase.items.length,
      notes: purchase.notes,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
      items: purchase.items
    }));

    return NextResponse.json({
      success: true,
      data: formattedPurchases
    });
  } catch (error) {
    console.error('Error al obtener compras:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePurchaseBody = await request.json();
    const { supplierId, purchaseDate, notes, items } = body;

    // Validaciones básicas
    if (!supplierId || !purchaseDate || !items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan campos requeridos: supplierId, purchaseDate, items'
        },
        { status: 400 }
      );
    }

    // Validar fecha
    const parsedDate = new Date(purchaseDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Formato de fecha inválido'
        },
        { status: 400 }
      );
    }

    // Validar items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productVariantId || item.quantity <= 0 || item.unitCost <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Item ${i + 1}: productVariantId es requerido, quantity y unitCost deben ser mayores a 0`
          },
          { status: 400 }
        );
      }
    }

    // Verificar que el proveedor existe y está activo
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, isActive: true, name: true }
    });

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          error: 'Proveedor no encontrado'
        },
        { status: 404 }
      );
    }

    if (!supplier.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'El proveedor no está activo'
        },
        { status: 400 }
      );
    }

    // Verificar que todas las variantes de producto existen
    const variantIds = items.map(item => item.productVariantId);
    const existingVariants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true }
    });

    if (existingVariants.length !== variantIds.length) {
      const foundIds = existingVariants.map(v => v.id);
      const missingIds = variantIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        {
          success: false,
          error: `Variantes de producto no encontradas: ${missingIds.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Calcular total
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    // Crear compra con transacción
    const purchase = await prisma.$transaction(async (tx) => {
      // 1. Crear Purchase
      const newPurchase = await tx.purchase.create({
        data: {
          supplierId,
          purchaseDate: parsedDate,
          totalAmount,
          notes: notes || null,
          status: 'completed'
        }
      });

      // 2. Crear items y actualizar stock
      for (const item of items) {
        const subtotal = item.quantity * item.unitCost;

        // Crear PurchaseItem
        await tx.purchaseItem.create({
          data: {
            purchaseId: newPurchase.id,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            subtotal
          }
        });

        // Actualizar stock y costo de la variante
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

      // 3. Retornar purchase con datos completos
      return await tx.purchase.findUnique({
        where: { id: newPurchase.id },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          items: {
            include: {
              productVariant: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });
    });

    return NextResponse.json(
      {
        success: true,
        data: purchase
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error al crear compra:', error);

    // Manejar errores específicos de Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          {
            success: false,
            error: 'Registro no encontrado'
          },
          { status: 404 }
        );
      }
      if (error.code === 'P2002') {
        return NextResponse.json(
          {
            success: false,
            error: 'Conflicto de datos únicos'
          },
          { status: 400 }
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