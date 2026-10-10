/**
 * Helpers puros de la tienda online (sin DB): se usan en el servidor y en el
 * navegador. Ver src/lib/storefront.ts para el acceso a datos.
 */

export const STORE_PRICE_TYPES = ['cash', 'debit', 'financed'] as const;
export type StorePriceType = (typeof STORE_PRICE_TYPES)[number];

export const STORE_PRICE_TYPE_LABELS: Record<StorePriceType, string> = {
  cash: 'Precio contado / efectivo',
  debit: 'Precio débito',
  financed: 'Precio financiado',
};

export const ORDER_STATUSES = ['pending', 'confirmed', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export type DeliveryMethod = 'pickup' | 'delivery';

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  pickup: 'Retiro en el local',
  delivery: 'Envío a domicilio',
};

export function isStorePriceType(v: unknown): v is StorePriceType {
  return typeof v === 'string' && (STORE_PRICE_TYPES as readonly string[]).includes(v);
}

export function isOrderStatus(v: unknown): v is OrderStatus {
  return typeof v === 'string' && (ORDER_STATUSES as readonly string[]).includes(v);
}

/** Deja solo dígitos. `+54 9 3385 12-3456` → `5493385123456`. */
export function normalizeWhatsapp(input: string): string {
  return (input ?? '').replace(/\D/g, '');
}

/** Un número internacional razonable: 8 a 15 dígitos, sin 0 inicial. */
export function isValidWhatsapp(digits: string): boolean {
  return /^[1-9]\d{7,14}$/.test(digits);
}

export function whatsappUrl(phoneDigits: string, text: string): string {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`;
}

export function formatMoney(amount: number): string {
  return `$ ${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export interface OrderMessageInput {
  businessName: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  address?: string | null;
  notes?: string | null;
  items: { productName: string; variantLabel: string; quantity: number; unitPrice: number; subtotal: number }[];
  total: number;
  priceType: StorePriceType;
}

/** Texto del pedido que se manda por WhatsApp al negocio. */
export function buildOrderMessage(o: OrderMessageInput): string {
  const lines: string[] = [];
  lines.push(`Hola ${o.businessName}! Quiero hacer este pedido (#${o.orderNumber}):`);
  lines.push('');
  for (const it of o.items) {
    const variant = it.variantLabel && it.variantLabel !== 'Único' ? ` (${it.variantLabel})` : '';
    lines.push(`• ${it.quantity} x ${it.productName}${variant} — ${formatMoney(it.subtotal)}`);
  }
  lines.push('');
  lines.push(`Total: ${formatMoney(o.total)} (${STORE_PRICE_TYPE_LABELS[o.priceType].toLowerCase()})`);
  lines.push('');
  lines.push(`Nombre: ${o.customerName}`);
  lines.push(`Teléfono: ${o.customerPhone}`);
  lines.push(`Entrega: ${DELIVERY_LABELS[o.deliveryMethod]}`);
  if (o.deliveryMethod === 'delivery' && o.address) lines.push(`Dirección: ${o.address}`);
  if (o.notes) lines.push(`Notas: ${o.notes}`);
  return lines.join('\n');
}

export const ORDER_LIMITS = {
  maxItems: 50,
  maxQuantity: 999,
  maxName: 100,
  maxPhone: 30,
  maxAddress: 200,
  maxNotes: 500,
} as const;

export interface OrderRequestItem {
  productVariantId: string;
  quantity: number;
}

export interface OrderRequest {
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  address: string | null;
  notes: string | null;
  items: OrderRequestItem[];
}

function cleanText(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.replace(/\s+/g, ' ').trim();
  if (!t) return null;
  return t.slice(0, max);
}

/**
 * Valida el cuerpo de un pedido público. Devuelve el pedido limpio o un
 * mensaje de error para mostrar al cliente. Suma cantidades repetidas de la
 * misma variante.
 */
export function parseOrderRequest(
  body: unknown,
  opts: { pickup: boolean; delivery: boolean }
): { ok: true; order: OrderRequest } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Pedido inválido' };
  const b = body as Record<string, unknown>;

  const customerName = cleanText(b.customerName, ORDER_LIMITS.maxName);
  if (!customerName) return { ok: false, error: 'Ingresá tu nombre' };

  const customerPhone = cleanText(b.customerPhone, ORDER_LIMITS.maxPhone);
  if (!customerPhone || normalizeWhatsapp(customerPhone).length < 6) {
    return { ok: false, error: 'Ingresá un teléfono válido' };
  }

  const deliveryMethod = b.deliveryMethod;
  if (deliveryMethod !== 'pickup' && deliveryMethod !== 'delivery') {
    return { ok: false, error: 'Elegí cómo querés recibir el pedido' };
  }
  if (deliveryMethod === 'pickup' && !opts.pickup) return { ok: false, error: 'El retiro en el local no está disponible' };
  if (deliveryMethod === 'delivery' && !opts.delivery) return { ok: false, error: 'El envío a domicilio no está disponible' };

  const address = cleanText(b.address, ORDER_LIMITS.maxAddress);
  if (deliveryMethod === 'delivery' && !address) return { ok: false, error: 'Ingresá la dirección de entrega' };

  const notes = cleanText(b.notes, ORDER_LIMITS.maxNotes);

  if (!Array.isArray(b.items) || b.items.length === 0) return { ok: false, error: 'El carrito está vacío' };
  if (b.items.length > ORDER_LIMITS.maxItems) return { ok: false, error: 'Demasiados productos en un solo pedido' };

  const merged = new Map<string, number>();
  for (const raw of b.items) {
    const it = raw as Record<string, unknown>;
    const id = typeof it?.productVariantId === 'string' ? it.productVariantId : '';
    const qty = Number(it?.quantity);
    if (!id || id.length > 64 || !Number.isInteger(qty) || qty <= 0) {
      return { ok: false, error: 'Hay un producto inválido en el carrito' };
    }
    merged.set(id, (merged.get(id) ?? 0) + qty);
  }
  for (const qty of merged.values()) {
    if (qty > ORDER_LIMITS.maxQuantity) return { ok: false, error: 'Cantidad demasiado alta' };
  }

  return {
    ok: true,
    order: {
      customerName,
      customerPhone,
      deliveryMethod,
      address: deliveryMethod === 'delivery' ? address : null,
      notes,
      items: [...merged].map(([productVariantId, quantity]) => ({ productVariantId, quantity })),
    },
  };
}
