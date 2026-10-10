import type { TenantDb } from './tenant-db';
import { BUSINESS_TZ, PAYMENT_METHOD_LABELS, PRICE_TYPE_LABELS } from './format';
import { variantLabel } from './variant-label';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Inicio del día YYYY-MM-DD en Argentina (UTC-3, sin horario de verano). */
export function startOfBusinessDay(date: string): Date {
  return new Date(`${date}T00:00:00-03:00`);
}

function businessDateKey(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: BUSINESS_TZ });
}

export interface ReportRange {
  from: string; // YYYY-MM-DD inclusive
  to: string; // YYYY-MM-DD inclusive
}

export interface BreakdownRow {
  key: string;
  label: string;
  revenue: number;
  count: number;
}

export interface SalesReport {
  range: ReportRange;
  kpis: {
    revenue: number;
    salesCount: number;
    avgTicket: number;
    unitsSold: number;
    grossProfit: number;
    marginPct: number;
    purchasesTotal: number;
    purchasesCount: number;
    invoicesCount: number;
  };
  previous: { revenue: number; salesCount: number; avgTicket: number };
  daily: { date: string; revenue: number; count: number }[];
  byPaymentMethod: BreakdownRow[];
  byPriceType: BreakdownRow[];
  byCategory: (BreakdownRow & { units: number })[];
  topProducts: { productId: string; name: string; brand: string | null; units: number; revenue: number; profit: number }[];
  inventory: {
    costValue: number;
    retailValue: number;
    units: number;
    variants: number;
    outOfStock: number;
    lowStock: { name: string; variant: string; sku: string; stock: number; min: number }[];
    noMovement: { name: string; variant: string; sku: string; stock: number; costValue: number }[];
  };
}

const n = (v: unknown) => Number(v ?? 0) || 0;

function breakdown(map: Map<string, { revenue: number; count: number }>, labels: Record<string, string>): BreakdownRow[] {
  return [...map.entries()]
    .map(([key, v]) => ({ key, label: labels[key] ?? key, ...v }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function buildSalesReport(db: TenantDb, range: ReportRange): Promise<SalesReport> {
  const start = startOfBusinessDay(range.from);
  const end = new Date(startOfBusinessDay(range.to).getTime() + DAY_MS);
  const lengthMs = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - lengthMs);

  const [sales, prevAgg, purchasesAgg, invoicesCount, variants] = await Promise.all([
    db.sale.findMany({
      where: { saleDate: { gte: start, lt: end } },
      select: {
        saleDate: true,
        paymentMethod: true,
        priceType: true,
        totalAmount: true,
        items: {
          select: {
            quantity: true,
            subtotal: true,
            productVariantId: true,
            productVariant: {
              select: {
                costPrice: true,
                product: { select: { id: true, name: true, brand: true, category: { select: { name: true } } } },
              },
            },
          },
        },
      },
    }),
    db.sale.aggregate({
      where: { saleDate: { gte: prevStart, lt: start } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    db.purchase.aggregate({
      where: { purchaseDate: { gte: start, lt: end }, status: { not: 'cancelled' } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    db.invoice.count({ where: { invoiceDate: { gte: start, lt: end }, status: 'issued' } }),
    db.productVariant.findMany({
      select: {
        id: true,
        sku: true,
        size: true,
        color: true,
        stockQuantity: true,
        minStockAlert: true,
        costPrice: true,
        priceCash: true,
        product: { select: { name: true } },
      },
    }),
  ]);

  // Serie diaria con todos los días del rango (los días sin ventas en cero).
  const daily = new Map<string, { revenue: number; count: number }>();
  for (let t = start.getTime(); t < end.getTime(); t += DAY_MS) {
    daily.set(businessDateKey(new Date(t + 12 * 60 * 60 * 1000)), { revenue: 0, count: 0 });
  }

  const byPayment = new Map<string, { revenue: number; count: number }>();
  const byPrice = new Map<string, { revenue: number; count: number }>();
  const byCategory = new Map<string, { revenue: number; count: number; units: number }>();
  const byProduct = new Map<string, { name: string; brand: string | null; units: number; revenue: number; profit: number }>();
  const soldVariantIds = new Set<string>();

  let revenue = 0;
  let unitsSold = 0;
  let cost = 0;

  for (const sale of sales) {
    const total = n(sale.totalAmount);
    revenue += total;
    const day = daily.get(businessDateKey(sale.saleDate));
    if (day) {
      day.revenue += total;
      day.count += 1;
    }
    const pm = byPayment.get(sale.paymentMethod) ?? { revenue: 0, count: 0 };
    pm.revenue += total;
    pm.count += 1;
    byPayment.set(sale.paymentMethod, pm);
    const pt = byPrice.get(sale.priceType) ?? { revenue: 0, count: 0 };
    pt.revenue += total;
    pt.count += 1;
    byPrice.set(sale.priceType, pt);

    for (const item of sale.items) {
      const sub = n(item.subtotal);
      const itemCost = n(item.productVariant.costPrice) * item.quantity;
      unitsSold += item.quantity;
      cost += itemCost;
      soldVariantIds.add(item.productVariantId);

      const product = item.productVariant.product;
      const catName = product.category?.name ?? 'Sin categoría';
      const cat = byCategory.get(catName) ?? { revenue: 0, count: 0, units: 0 };
      cat.revenue += sub;
      cat.units += item.quantity;
      cat.count += 1;
      byCategory.set(catName, cat);

      const prod = byProduct.get(product.id) ?? { name: product.name, brand: product.brand, units: 0, revenue: 0, profit: 0 };
      prod.units += item.quantity;
      prod.revenue += sub;
      prod.profit += sub - itemCost;
      byProduct.set(product.id, prod);
    }
  }

  const salesCount = sales.length;
  const prevRevenue = n(prevAgg._sum.totalAmount);
  const prevCount = prevAgg._count;

  // Inventario actual
  let costValue = 0;
  let retailValue = 0;
  let units = 0;
  let outOfStock = 0;
  const lowStock: SalesReport['inventory']['lowStock'] = [];
  const noMovement: SalesReport['inventory']['noMovement'] = [];
  for (const v of variants) {
    const stock = v.stockQuantity;
    const label = variantLabel(v.size, v.color);
    if (stock <= 0) outOfStock += 1;
    if (stock > 0) {
      units += stock;
      costValue += n(v.costPrice) * stock;
      retailValue += n(v.priceCash) * stock;
      if (!soldVariantIds.has(v.id)) {
        noMovement.push({ name: v.product.name, variant: label, sku: v.sku, stock, costValue: n(v.costPrice) * stock });
      }
    }
    if (stock <= v.minStockAlert) {
      lowStock.push({ name: v.product.name, variant: label, sku: v.sku, stock, min: v.minStockAlert });
    }
  }

  return {
    range,
    kpis: {
      revenue,
      salesCount,
      avgTicket: salesCount ? revenue / salesCount : 0,
      unitsSold,
      grossProfit: revenue - cost,
      marginPct: revenue ? (revenue - cost) / revenue : 0,
      purchasesTotal: n(purchasesAgg._sum.totalAmount),
      purchasesCount: purchasesAgg._count,
      invoicesCount,
    },
    previous: { revenue: prevRevenue, salesCount: prevCount, avgTicket: prevCount ? prevRevenue / prevCount : 0 },
    daily: [...daily.entries()].map(([date, v]) => ({ date, ...v })),
    byPaymentMethod: breakdown(byPayment, PAYMENT_METHOD_LABELS),
    byPriceType: breakdown(byPrice, PRICE_TYPE_LABELS),
    byCategory: [...byCategory.entries()]
      .map(([key, v]) => ({ key, label: key, ...v }))
      .sort((a, b) => b.revenue - a.revenue),
    topProducts: [...byProduct.entries()]
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
    inventory: {
      costValue,
      retailValue,
      units,
      variants: variants.length,
      outOfStock,
      lowStock: lowStock.sort((a, b) => a.stock - b.stock).slice(0, 15),
      noMovement: noMovement.sort((a, b) => b.costValue - a.costValue).slice(0, 10),
    },
  };
}
