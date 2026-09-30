import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api-auth';
import { isOrderStatus } from '@/lib/store';

// GET /api/orders?status=pending — pedidos de la tienda online (más nuevos primero)
export async function GET(request: NextRequest) {
  const ctx = await requireTenant('pedidos');
  if (ctx instanceof NextResponse) return ctx;

  const status = request.nextUrl.searchParams.get('status');
  const where = status && isOrderStatus(status) ? { status } : {};

  try {
    const [orders, pendingCount] = await Promise.all([
      ctx.db.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      ctx.db.order.count({ where: { status: 'pending' } }),
    ]);

    return NextResponse.json({
      success: true,
      pendingCount,
      data: orders.map((o) => ({
        id: o.id,
        number: o.number,
        status: o.status,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        deliveryMethod: o.deliveryMethod,
        address: o.address,
        notes: o.notes,
        priceType: o.priceType,
        totalAmount: o.totalAmount.toNumber(),
        saleId: o.saleId,
        createdAt: o.createdAt,
        items: o.items.map((i) => ({
          id: i.id,
          productVariantId: i.productVariantId,
          productName: i.productName,
          variantLabel: i.variantLabel,
          quantity: i.quantity,
          unitPrice: i.unitPrice.toNumber(),
          subtotal: i.subtotal.toNumber(),
        })),
      })),
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
