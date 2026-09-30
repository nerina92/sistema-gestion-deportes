import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api-auth';
import { getBusinessSettings } from '@/lib/settings';
import { isStorePriceType, isValidWhatsapp, normalizeWhatsapp } from '@/lib/store';

// GET /api/tenant/settings — configuración del negocio activo (cualquier usuario del negocio)
export async function GET() {
  const ctx = await requireTenant();
  if (ctx instanceof NextResponse) return ctx;
  const settings = await getBusinessSettings(ctx.db);
  return NextResponse.json({ success: true, settings, tenant: { name: ctx.tenant.name, slug: ctx.tenant.slug } });
}

const STRING_FIELDS = ['businessName', 'businessType', 'address', 'city', 'taxCondition', 'variantAttr1Label', 'variantAttr2Label'] as const;
const PERCENT_FIELDS = ['defaultMarginCash', 'defaultSurchargeDebit', 'defaultSurchargeFinanced'] as const;
const INT_FIELDS = ['priceRounding', 'defaultMinStockAlert'] as const;

// PUT /api/tenant/settings — actualizar (solo administradores)
export async function PUT(request: NextRequest) {
  const ctx = await requireTenant('configuracion');
  if (ctx instanceof NextResponse) return ctx;

  const body = await request.json().catch(() => ({}));
  const data: Record<string, string | number | boolean> = {};

  for (const f of STRING_FIELDS) {
    if (body[f] === undefined) continue;
    if (typeof body[f] !== 'string' || body[f].length > 200) {
      return NextResponse.json({ success: false, error: `Valor inválido para ${f}` }, { status: 400 });
    }
    data[f] = body[f].trim();
  }
  for (const f of PERCENT_FIELDS) {
    if (body[f] === undefined) continue;
    const n = Number(body[f]);
    if (!Number.isFinite(n) || n < 0 || n > 1000) {
      return NextResponse.json({ success: false, error: `Porcentaje inválido para ${f}` }, { status: 400 });
    }
    data[f] = n;
  }
  for (const f of INT_FIELDS) {
    if (body[f] === undefined) continue;
    const n = Number(body[f]);
    if (!Number.isInteger(n) || n < 0 || n > 100000) {
      return NextResponse.json({ success: false, error: `Valor inválido para ${f}` }, { status: 400 });
    }
    data[f] = n;
  }
  if (body.useVariants !== undefined) data.useVariants = Boolean(body.useVariants);

  // Tienda online
  for (const f of ['storeEnabled', 'storeShowOutOfStock', 'storePickup', 'storeDelivery'] as const) {
    if (body[f] !== undefined) data[f] = Boolean(body[f]);
  }
  if (body.storeWhatsapp !== undefined) {
    const digits = normalizeWhatsapp(String(body.storeWhatsapp));
    if (digits && !isValidWhatsapp(digits)) {
      return NextResponse.json(
        { success: false, error: 'Número de WhatsApp inválido: usá el formato internacional, ej. 5493385123456' },
        { status: 400 }
      );
    }
    data.storeWhatsapp = digits;
  }
  if (body.storePriceType !== undefined) {
    if (!isStorePriceType(body.storePriceType)) {
      return NextResponse.json({ success: false, error: 'Lista de precios inválida' }, { status: 400 });
    }
    data.storePriceType = body.storePriceType;
  }
  if (body.storeMessage !== undefined) {
    if (typeof body.storeMessage !== 'string' || body.storeMessage.length > 1000) {
      return NextResponse.json({ success: false, error: 'El mensaje de la tienda es demasiado largo' }, { status: 400 });
    }
    data.storeMessage = body.storeMessage.trim();
  }

  // Validaciones cruzadas con los valores resultantes.
  const current = await getBusinessSettings(ctx.db);
  const next = { ...current, ...data } as typeof current;
  if (next.storeEnabled && !next.storeWhatsapp) {
    return NextResponse.json(
      { success: false, error: 'Para activar la tienda cargá el número de WhatsApp que recibe los pedidos' },
      { status: 400 }
    );
  }
  if (next.storeEnabled && !next.storePickup && !next.storeDelivery) {
    return NextResponse.json(
      { success: false, error: 'Habilitá al menos una forma de entrega (retiro o envío)' },
      { status: 400 }
    );
  }

  await ctx.db.tenantSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  return NextResponse.json({ success: true, settings: await getBusinessSettings(ctx.db) });
}
