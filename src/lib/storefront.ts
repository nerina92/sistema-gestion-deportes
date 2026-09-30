import { platformDb } from './platform-db';
import { getTenantDb, type TenantDb } from './tenant-db';
import { getBusinessSettings, type BusinessSettings } from './settings';
import { SLUG_RE } from './tenants';
import { isStorePriceType, type StorePriceType } from './store';
import { variantLabel } from './variant-label';

/**
 * Acceso a datos de la tienda online pública. Todo lo que sale de acá es
 * visible para cualquiera: nunca incluir costos, márgenes ni datos internos.
 */

export interface Storefront {
  tenant: { id: string; slug: string; name: string };
  db: TenantDb;
  settings: BusinessSettings;
  priceType: StorePriceType;
}

/** Negocio activo con la tienda habilitada, o null (→ 404). */
export async function getStorefront(slug: string): Promise<Storefront | null> {
  if (!SLUG_RE.test(slug)) return null;
  const tenant = await platformDb.tenant.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, schemaName: true, isActive: true },
  });
  if (!tenant || !tenant.isActive) return null;

  const db = getTenantDb(tenant.schemaName);
  let settings: BusinessSettings;
  try {
    settings = await getBusinessSettings(db);
  } catch {
    // Schema sin migrar todavía: tratar como tienda deshabilitada.
    return null;
  }
  if (!settings.storeEnabled || !settings.storeWhatsapp) return null;

  return {
    tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
    db,
    settings,
    priceType: isStorePriceType(settings.storePriceType) ? settings.storePriceType : 'cash',
  };
}

export interface CatalogVariant {
  id: string;
  label: string;
  attr1: string;
  attr2: string;
  price: number;
  stock: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  imageUrl: string | null;
  categoryId: string;
  categoryName: string;
  variants: CatalogVariant[];
}

export function variantPrice(
  v: { priceCash: { toNumber(): number }; priceDebit: { toNumber(): number }; priceFinanced: { toNumber(): number } },
  priceType: StorePriceType
): number {
  if (priceType === 'debit') return v.priceDebit.toNumber();
  if (priceType === 'financed') return v.priceFinanced.toNumber();
  return v.priceCash.toNumber();
}

/** Catálogo público: productos con al menos una variante visible y con precio. */
export async function getCatalog(store: Storefront): Promise<CatalogProduct[]> {
  const products = await store.db.product.findMany({
    include: {
      category: { select: { name: true } },
      variants: { orderBy: [{ size: 'asc' }, { color: 'asc' }] },
    },
    orderBy: { name: 'asc' },
  });

  const showOutOfStock = store.settings.storeShowOutOfStock;
  const result: CatalogProduct[] = [];
  for (const p of products) {
    const variants = p.variants
      .map((v) => ({
        id: v.id,
        label: variantLabel(v.size, v.color),
        attr1: v.size,
        attr2: v.color,
        price: variantPrice(v, store.priceType),
        stock: Math.max(0, v.stockQuantity),
      }))
      .filter((v) => v.price > 0 && (showOutOfStock || v.stock > 0));
    if (variants.length === 0) continue;
    result.push({
      id: p.id,
      name: p.name,
      brand: p.brand,
      description: p.description,
      imageUrl: p.imageUrl,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      variants,
    });
  }
  return result;
}
