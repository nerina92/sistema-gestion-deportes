import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api-auth';
import { getBusinessSettings } from '@/lib/settings';

// Respuesta de la API de Tienda Nube (solo los campos que usamos). Los textos
// pueden venir como objeto por idioma ({ es: "..." }) o como string.
type Localized = string | Record<string, string> | null | undefined;
interface TnVariant {
  id: number;
  product_id: number;
  sku: string | null;
  price: string | null;
  stock: number | null;
  values?: Localized[];
}
interface TnProduct {
  id: number;
  name: Localized;
  brand?: string | null;
  categories?: { name: Localized }[];
  variants: TnVariant[];
}

// Sobrescribible solo para pruebas locales contra un servidor simulado.
const API_BASE = process.env.TIENDANUBE_API_URL ?? 'https://api.tiendanube.com';
const PER_PAGE = 200;
const MAX_PAGES = 50;

function text(value: Localized): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  return (value.es ?? Object.values(value)[0] ?? '').trim();
}

async function fetchAllProducts(storeId: string, token: string): Promise<TnProduct[]> {
  const all: TnProduct[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(`${API_BASE}/v1/${storeId}/products?page=${page}&per_page=${PER_PAGE}`, {
      headers: {
        Authentication: `bearer ${token}`,
        'User-Agent': 'Gestion Comercial (contacto.plexolabs@gmail.com)',
      },
      cache: 'no-store',
    });
    // Tienda Nube responde 404 cuando se pide una página más allá de la última.
    if (res.status === 404 && page > 1) break;
    if (!res.ok) throw new Error(`Tienda Nube respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const batch = (await res.json()) as TnProduct[];
    all.push(...batch);
    if (batch.length < PER_PAGE) break;
  }
  return all;
}

// POST /api/integrations/tiendanube/sync/import  { createMissing?: boolean }
// Vincula por SKU las variantes locales con las de Tienda Nube y, si se pide,
// crea en el sistema los productos que solo existen en Tienda Nube.
export async function POST(request: NextRequest) {
  const ctx = await requireTenant('integraciones');
  if (ctx instanceof NextResponse) return ctx;
  const prisma = ctx.db;
  const { createMissing = false } = await request.json().catch(() => ({}));

  const config = await prisma.tiendanubeConfig.findFirst({ where: { isActive: true } });
  if (!config) return NextResponse.json({ success: false, error: 'Tienda Nube no está configurada' }, { status: 400 });

  try {
    const [products, settings, locals] = await Promise.all([
      fetchAllProducts(config.storeId, config.accessToken),
      getBusinessSettings(prisma),
      prisma.productVariant.findMany({ select: { id: true, sku: true, tiendanubeVariantId: true } }),
    ]);
    const bySku = new Map(locals.map((v) => [v.sku.trim().toLowerCase(), v]));
    // Las variantes ya vinculadas se reconocen por su id de Tienda Nube aunque no tengan SKU.
    const byTnId = new Map(locals.filter((v) => v.tiendanubeVariantId).map((v) => [v.tiendanubeVariantId!, v]));

    let linked = 0;
    let alreadyLinked = 0;
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const tnProduct of products) {
      const name = text(tnProduct.name) || `Producto ${tnProduct.id}`;
      const missing: TnVariant[] = [];

      for (const tv of tnProduct.variants ?? []) {
        const local = byTnId.get(String(tv.id)) ?? (tv.sku ? bySku.get(tv.sku.trim().toLowerCase()) : undefined);
        if (!local) {
          missing.push(tv);
          continue;
        }
        if (local.tiendanubeVariantId === String(tv.id)) {
          alreadyLinked++;
          continue;
        }
        await prisma.productVariant.update({
          where: { id: local.id },
          data: { tiendanubeProductId: String(tnProduct.id), tiendanubeVariantId: String(tv.id) },
        });
        linked++;
      }

      if (missing.length === 0) continue;
      if (!createMissing) {
        skipped += missing.length;
        continue;
      }

      try {
        const categoryName = text(tnProduct.categories?.[0]?.name) || 'Tienda Nube';
        const category = await prisma.category.upsert({
          where: { name: categoryName },
          update: {},
          create: { name: categoryName },
        });
        const product =
          (await prisma.product.findFirst({ where: { name, brand: tnProduct.brand || null } })) ??
          (await prisma.product.create({
            data: {
              name,
              brand: tnProduct.brand || null,
              categoryId: category.id,
              marginCash: settings.defaultMarginCash,
              surchargeDebit: settings.defaultSurchargeDebit,
              surchargeFinanced: settings.defaultSurchargeFinanced,
            },
          }));

        for (const tv of missing) {
          // El precio de Tienda Nube se toma como precio contado; el costo se
          // estima con el margen por defecto y los demás precios con los recargos.
          const priceCash = Number(tv.price ?? 0) || 0;
          const costPrice = Math.round((priceCash / (1 + settings.defaultMarginCash / 100)) * 100) / 100;
          let sku = (tv.sku ?? '').trim() || `TN-${tv.id}`;
          if (bySku.has(sku.toLowerCase())) sku = `TN-${tv.id}`;
          const values = (tv.values ?? []).map(text);
          const createdVariant = await prisma.productVariant.create({
            data: {
              productId: product.id,
              size: values[0] ?? '',
              color: values[1] ?? '',
              sku,
              costPrice,
              priceCash,
              priceDebit: Math.round(priceCash * (1 + settings.defaultSurchargeDebit / 100)),
              priceFinanced: Math.round(priceCash * (1 + settings.defaultSurchargeFinanced / 100)),
              stockQuantity: Math.max(0, tv.stock ?? 0),
              minStockAlert: settings.defaultMinStockAlert,
              tiendanubeProductId: String(tnProduct.id),
              tiendanubeVariantId: String(tv.id),
            },
          });
          const entry = { id: createdVariant.id, sku, tiendanubeVariantId: String(tv.id) };
          bySku.set(sku.toLowerCase(), entry);
          byTnId.set(String(tv.id), entry);
          created++;
        }
      } catch (error) {
        errors.push(`${name}: ${error instanceof Error ? error.message : 'error al crear'}`);
      }
    }

    const summary = `Vinculadas: ${linked}, ya vinculadas: ${alreadyLinked}, creadas: ${created}, sin coincidencia: ${skipped}`;
    await prisma.syncLog.create({
      data: {
        action: 'import',
        status: errors.length ? 'error' : 'success',
        details: summary,
        errorMessage: errors.length ? errors.join('\n') : null,
      },
    });
    await prisma.tiendanubeConfig.update({ where: { id: config.id }, data: { lastSyncAt: new Date() } });

    return NextResponse.json({ success: true, products: products.length, linked, alreadyLinked, created, skipped, errors });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al importar';
    await prisma.syncLog.create({ data: { action: 'import', status: 'error', details: 'Importación fallida', errorMessage: message } });
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
