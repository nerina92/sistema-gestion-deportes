import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api-auth';
import { getBusinessSettings } from '@/lib/settings';

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

  await ctx.db.tenantSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  return NextResponse.json({ success: true, settings: await getBusinessSettings(ctx.db) });
}
