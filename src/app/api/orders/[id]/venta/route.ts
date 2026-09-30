import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/tenant';
import { requireTenant } from '@/lib/api-auth';
import { hasModule } from '@/lib/role-permissions';

type RouteContext = { params: Promise<{ id: string }> };

const PAYMENT_METHODS = ['cash', 'card', 'transfer'] as const;

class ConvertError extends Error {
  constructor(message: string, public status = 409) {
    super(message);
  }
}

// POST /api/orders/[id]/venta — registra el pedido como venta: crea la venta
// con los precios del pedido y descuenta el stock (misma lógica que /api/sales).
export async function POST(request: NextRequest, context: RouteContext) {
  const ctx = await requireTenant('pedidos');
  if (ctx instanceof NextResponse) return ctx;
  if (!hasModule(ctx.roles, 'ventas')) {
    return NextResponse.json({ success: false, error: 'Tu rol no puede registrar ventas' }, { status: 403 });
  }
  const { id } = await context.params;

  const body = await request.json().catch(() => ({}));
  const paymentMethod = body.paymentMethod;
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return NextResponse.json({ success: false, error: 'Elegí el medio de pago' }, { status: 400 });
  }

  try {
    const sale = await ctx.db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) throw new ConvertError('Pedido no encontrado', 404);
      if (order.saleId) throw new ConvertError('Este pedido ya se registró como venta');
      if (order.status === 'cancelled') throw new ConvertError('El pedido está cancelado');

      // Descuento condicional: falla si no alcanza el stock (evita carreras).
      for (const item of order.items) {
        const res = await tx.productVariant.updateMany({
          where: { id: item.productVariantId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        if (res.count === 0) {
          const v = await tx.productVariant.findUnique({
            where: { id: item.productVariantId },
            select: { stockQuantity: true },
          });
          throw new ConvertError(
            `Stock insuficiente para ${item.productName} (${item.variantLabel}). ` +
              `Disponible: ${v?.stockQuantity ?? 0}, pedido: ${item.quantity}`
          );
        }
      }

      const sale = await tx.sale.create({
        data: {
          saleDate: new Date(),
          paymentMethod,
          priceType: order.priceType,
          totalAmount: order.totalAmount,
          notes: `Pedido online #${order.number} — ${order.customerName} (${order.customerPhone})`,
          items: {
            create: order.items.map((i) => ({
              productVariantId: i.productVariantId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              subtotal: i.subtotal,
            })),
          },
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { saleId: sale.id, status: order.status === 'pending' ? 'confirmed' : order.status },
      });
      return sale;
    });

    return NextResponse.json({ success: true, saleId: sale.id });
  } catch (err) {
    if (err instanceof ConvertError) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.status });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Este pedido ya se registró como venta' }, { status: 409 });
    }
    console.error('Error al registrar pedido como venta:', err);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
