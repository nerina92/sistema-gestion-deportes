import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/tenant';
import { getStorefront, variantPrice } from '@/lib/storefront';
import { buildOrderMessage, parseOrderRequest, whatsappUrl } from '@/lib/store';
import { variantLabel } from '@/lib/variant-label';

type RouteContext = { params: Promise<{ slug: string }> };

// Límite simple por IP en memoria (una instancia): evita spam de pedidos.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ORDERS_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_ORDERS_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

class OrderError extends Error {}

function error(status: number, message: string) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// POST /api/tienda/[slug]/pedidos — pedido público desde la tienda online.
// Crea el pedido (sin descontar stock) y devuelve el link de WhatsApp.
export async function POST(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const store = await getStorefront(slug);
  if (!store) return error(404, 'Tienda no encontrada');

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(`${slug}:${ip}`)) {
    return error(429, 'Hiciste muchos pedidos seguidos. Esperá unos minutos o escribinos por WhatsApp.');
  }

  const body = await request.json().catch(() => null);
  // Campo trampa para bots: los humanos no lo ven ni lo completan.
  if (body && typeof body === 'object' && (body as Record<string, unknown>).website) {
    return error(400, 'Pedido inválido');
  }

  const parsed = parseOrderRequest(body, {
    pickup: store.settings.storePickup,
    delivery: store.settings.storeDelivery,
  });
  if (!parsed.ok) return error(400, parsed.error);
  const req = parsed.order;

  try {
    const order = await store.db.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: { id: { in: req.items.map((i) => i.productVariantId) } },
        include: { product: { select: { name: true } } },
      });
      const byId = new Map(variants.map((v) => [v.id, v]));

      const items = req.items.map((it) => {
        const v = byId.get(it.productVariantId);
        if (!v) throw new OrderError('Un producto del carrito ya no está disponible. Actualizá la página.');
        const unit = variantPrice(v, store.priceType);
        if (unit <= 0) throw new OrderError(`${v.product.name} no está disponible para la venta online.`);
        if (v.stockQuantity < it.quantity) {
          const label = variantLabel(v.size, v.color);
          throw new OrderError(
            v.stockQuantity > 0
              ? `Solo quedan ${v.stockQuantity} de ${v.product.name} (${label}).`
              : `${v.product.name} (${label}) está sin stock.`
          );
        }
        const unitPrice = new Prisma.Decimal(unit);
        return {
          productVariantId: v.id,
          productName: v.product.name,
          variantLabel: variantLabel(v.size, v.color),
          quantity: it.quantity,
          unitPrice,
          subtotal: unitPrice.mul(it.quantity),
        };
      });

      const totalAmount = items.reduce((sum, i) => sum.add(i.subtotal), new Prisma.Decimal(0));

      return tx.order.create({
        data: {
          customerName: req.customerName,
          customerPhone: req.customerPhone,
          deliveryMethod: req.deliveryMethod,
          address: req.address,
          notes: req.notes,
          priceType: store.priceType,
          totalAmount,
          items: { create: items },
        },
        include: { items: true },
      });
    });

    const message = buildOrderMessage({
      businessName: store.settings.businessName || store.tenant.name,
      orderNumber: order.number,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryMethod: req.deliveryMethod,
      address: order.address,
      notes: order.notes,
      priceType: store.priceType,
      total: order.totalAmount.toNumber(),
      items: order.items.map((i) => ({
        productName: i.productName,
        variantLabel: i.variantLabel,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toNumber(),
        subtotal: i.subtotal.toNumber(),
      })),
    });

    return NextResponse.json({
      success: true,
      order: { number: order.number, total: order.totalAmount.toNumber() },
      whatsappUrl: whatsappUrl(store.settings.storeWhatsapp, message),
    });
  } catch (err) {
    if (err instanceof OrderError) return error(409, err.message);
    console.error('Error al crear pedido de la tienda:', err);
    return error(500, 'No pudimos registrar el pedido. Probá de nuevo en un momento.');
  }
}
