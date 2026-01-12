import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Tipo para el body del POST
interface CreateSaleItem {
  productVariantId: string;
  quantity: number;
}

interface CreateSaleBody {
  saleDate: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  priceType: 'cash' | 'debit' | 'financed';
  notes?: string;
  items: CreateSaleItem[];
}

export async function GET(request: NextRequest) {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    brand: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        saleDate: 'desc'
      }
    });

    // Formatear response
    const formattedSales = sales.map(sale => ({
      id: sale.id,
      saleDate: sale.saleDate,
      paymentMethod: sale.paymentMethod,
      priceType: sale.priceType,
      totalAmount: sale.totalAmount,
      itemCount: sale.items.length,
      notes: sale.notes,
      createdAt: sale.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: formattedSales
    });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
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
    const body: CreateSaleBody = await request.json();
    const { saleDate, paymentMethod, priceType, notes, items } = body;

    // Validaciones básicas
    if (!saleDate || !paymentMethod || !priceType || !items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan campos requeridos: saleDate, paymentMethod, priceType, items'
        },
        { status: 400 }
      );
    }

    // Validar fecha
    const parsedDate = new Date(saleDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fecha inválida'
        },
        { status: 400 }
      );
    }

    // Validar paymentMethod
    const validPaymentMethods = ['cash', 'card', 'transfer'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Método de pago inválido. Valores permitidos: cash, card, transfer'
        },
        { status: 400 }
      );
    }

    // Validar priceType
    const validPriceTypes = ['cash', 'debit', 'financed'];
    if (!validPriceTypes.includes(priceType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tipo de precio inválido. Valores permitidos: cash, debit, financed'
        },
        { status: 400 }
      );
    }

    // Validar items
    for (const item of items) {
      if (!item.productVariantId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cada item debe tener productVariantId y quantity > 0'
          },
          { status: 400 }
        );
      }
    }

    // Usar transacción para garantizar atomicidad
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verificar stock y obtener precios para cada variante
      const itemsWithPrices: Array<{
        productVariantId: string;
        quantity: number;
        unitPrice: Decimal;
        subtotal: Decimal;
        productName: string;
        variantDetails: string;
      }> = [];

      for (const item of items) {
        // Obtener la variante con su stock actual
        const variant = await tx.productVariant.findUnique({
          where: { id: item.productVariantId },
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        });

        if (!variant) {
          throw new Error(`Variante no encontrada: ${item.productVariantId}`);
        }

        // Validar stock disponible
        if (variant.stockQuantity < item.quantity) {
          throw new Error(
            `Stock insuficiente para ${variant.product.name} (${variant.size} - ${variant.color}). ` +
            `Disponible: ${variant.stockQuantity}, Solicitado: ${item.quantity}`
          );
        }

        // Determinar el precio según priceType
        let unitPrice: Decimal;
        if (priceType === 'cash') {
          unitPrice = variant.priceCash;
        } else if (priceType === 'debit') {
          unitPrice = variant.priceDebit;
        } else {
          unitPrice = variant.priceFinanced;
        }

        const subtotal = unitPrice.mul(item.quantity);

        itemsWithPrices.push({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          unitPrice,
          subtotal,
          productName: variant.product.name,
          variantDetails: `${variant.size} - ${variant.color}`
        });
      }

      // 2. Calcular el total
      const totalAmount = itemsWithPrices.reduce(
        (sum, item) => sum.add(item.subtotal),
        new Decimal(0)
      );

      // 3. Crear la venta
      const sale = await tx.sale.create({
        data: {
          saleDate: parsedDate,
          paymentMethod,
          priceType,
          totalAmount,
          notes: notes || null,
          items: {
            create: itemsWithPrices.map(item => ({
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal
            }))
          }
        },
        include: {
          items: {
            include: {
              productVariant: {
                include: {
                  product: true
                }
              }
            }
          }
        }
      });

      // 4. Actualizar el stock de cada variante (decrementar)
      for (const item of itemsWithPrices) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: {
            stockQuantity: {
              decrement: item.quantity
            }
          }
        });
      }

      return sale;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Venta registrada exitosamente',
        data: {
          id: result.id,
          saleDate: result.saleDate,
          paymentMethod: result.paymentMethod,
          priceType: result.priceType,
          totalAmount: result.totalAmount,
          notes: result.notes,
          items: result.items.map(item => ({
            id: item.id,
            productName: item.productVariant.product.name,
            variant: `${item.productVariant.size} - ${item.productVariant.color}`,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal
          }))
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear venta:', error);
    
    // Si es un error de validación de negocio (stock insuficiente, etc.)
    if (error instanceof Error && error.message.includes('Stock insuficiente')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('no encontrada')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor al crear la venta'
      },
      { status: 500 }
    );
  }
}
