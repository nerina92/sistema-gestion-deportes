import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api-auth';
import { BUSINESS_TZ, todayISODate } from '@/lib/format';
import { startOfBusinessDay } from '@/lib/reports';
import { variantLabel } from '@/lib/variant-label';

const DAY_MS = 24 * 60 * 60 * 1000;
const n = (v: unknown) => Number(v ?? 0) || 0;

// GET /api/dashboard — resumen del día para la pantalla de inicio
export async function GET() {
  const ctx = await requireTenant('dashboard');
  if (ctx instanceof NextResponse) return ctx;
  const db = ctx.db;

  const today = todayISODate();
  const todayStart = startOfBusinessDay(today);
  const tomorrowStart = new Date(todayStart.getTime() + DAY_MS);
  const yesterdayStart = new Date(todayStart.getTime() - DAY_MS);
  const seriesStart = new Date(todayStart.getTime() - 13 * DAY_MS);
  const monthStart = startOfBusinessDay(`${today.slice(0, 7)}-01`);

  const [todayAgg, yesterdayAgg, monthAgg, seriesSales, recent, variants, pendingOrders, productsCount] = await Promise.all([
    db.sale.aggregate({ where: { saleDate: { gte: todayStart, lt: tomorrowStart } }, _sum: { totalAmount: true }, _count: true }),
    db.sale.aggregate({ where: { saleDate: { gte: yesterdayStart, lt: todayStart } }, _sum: { totalAmount: true }, _count: true }),
    db.sale.aggregate({ where: { saleDate: { gte: monthStart, lt: tomorrowStart } }, _sum: { totalAmount: true }, _count: true }),
    db.sale.findMany({ where: { saleDate: { gte: seriesStart, lt: tomorrowStart } }, select: { saleDate: true, totalAmount: true } }),
    db.sale.findMany({
      orderBy: { saleDate: 'desc' },
      take: 6,
      select: { id: true, saleDate: true, totalAmount: true, paymentMethod: true, _count: { select: { items: true } } },
    }),
    db.productVariant.findMany({
      select: { id: true, size: true, color: true, stockQuantity: true, minStockAlert: true, product: { select: { id: true, name: true } } },
    }),
    db.order.count({ where: { status: 'pending' } }),
    db.product.count(),
  ]);

  const daily = new Map<string, { revenue: number; count: number }>();
  for (let i = 0; i < 14; i++) {
    const key = new Date(seriesStart.getTime() + i * DAY_MS + 12 * 3600 * 1000).toLocaleDateString('en-CA', { timeZone: BUSINESS_TZ });
    daily.set(key, { revenue: 0, count: 0 });
  }
  for (const s of seriesSales) {
    const d = daily.get(s.saleDate.toLocaleDateString('en-CA', { timeZone: BUSINESS_TZ }));
    if (d) {
      d.revenue += n(s.totalAmount);
      d.count += 1;
    }
  }

  const lowStock = variants
    .filter((v) => v.stockQuantity <= v.minStockAlert)
    .sort((a, b) => a.stockQuantity - b.stockQuantity)
    .map((v) => ({
      id: v.id,
      productId: v.product.id,
      name: v.product.name,
      variant: variantLabel(v.size, v.color),
      stock: v.stockQuantity,
      min: v.minStockAlert,
    }));

  return NextResponse.json({
    success: true,
    today: { revenue: n(todayAgg._sum.totalAmount), count: todayAgg._count },
    yesterday: { revenue: n(yesterdayAgg._sum.totalAmount), count: yesterdayAgg._count },
    month: { revenue: n(monthAgg._sum.totalAmount), count: monthAgg._count },
    daily: [...daily.entries()].map(([date, v]) => ({ date, ...v })),
    recentSales: recent.map((s) => ({
      id: s.id,
      saleDate: s.saleDate,
      totalAmount: n(s.totalAmount),
      paymentMethod: s.paymentMethod,
      itemCount: s._count.items,
    })),
    lowStock: { count: lowStock.length, items: lowStock.slice(0, 6) },
    pendingOrders,
    productsCount,
  });
}
