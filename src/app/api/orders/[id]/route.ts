import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api-auth';
import { isOrderStatus } from '@/lib/store';

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/orders/[id] — cambiar el estado de un pedido
export async function PATCH(request: NextRequest, context: RouteContext) {
  const ctx = await requireTenant('pedidos');
  if (ctx instanceof NextResponse) return ctx;
  const { id } = await context.params;

  const body = await request.json().catch(() => ({}));
  if (!isOrderStatus(body.status)) {
    return NextResponse.json({ success: false, error: 'Estado inválido' }, { status: 400 });
  }

  const order = await ctx.db.order.findUnique({ where: { id }, select: { saleId: true } });
  if (!order) return NextResponse.json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
  if (body.status === 'cancelled' && order.saleId) {
    return NextResponse.json(
      { success: false, error: 'Este pedido ya se registró como venta: anulá la venta antes de cancelarlo' },
      { status: 409 }
    );
  }

  const updated = await ctx.db.order.update({ where: { id }, data: { status: body.status } });
  return NextResponse.json({ success: true, status: updated.status });
}
