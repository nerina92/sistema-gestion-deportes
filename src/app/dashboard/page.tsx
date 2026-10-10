'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ClipboardList,
  Package,
  PackagePlus,
  Plus,
  ShoppingCart,
  Truck,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardHeader, EmptyState, LinkButton, Skeleton, StatCard } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatDate, formatMoney, formatNumber, formatPercent, PAYMENT_METHOD_LABELS } from '@/lib/format';
import { getModulesForRoles, type ModuleKey } from '@/lib/role-permissions';

const SalesChart = dynamic(() => import('@/components/charts/SalesChart'), {
  ssr: false,
  loading: () => <Skeleton className="h-52 w-full" />,
});

interface DashboardData {
  today: { revenue: number; count: number };
  yesterday: { revenue: number; count: number };
  month: { revenue: number; count: number };
  daily: { date: string; revenue: number; count: number }[];
  recentSales: { id: string; saleDate: string; totalAmount: number; paymentMethod: string; itemCount: number }[];
  lowStock: { count: number; items: { id: string; productId: string; name: string; variant: string; stock: number; min: number }[] };
  pendingOrders: number;
  productsCount: number;
}

const QUICK_ACTIONS: { href: string; label: string; description: string; icon: LucideIcon; module: ModuleKey }[] = [
  { href: '/ventas/nueva', label: 'Nueva venta', description: 'Registrar una venta', icon: ShoppingCart, module: 'ventas' },
  { href: '/compras/nueva', label: 'Nueva compra', description: 'Cargar mercadería', icon: Truck, module: 'compras' },
  { href: '/productos/nuevo', label: 'Nuevo producto', description: 'Sumar al catálogo', icon: PackagePlus, module: 'productos-editar' },
  { href: '/reportes', label: 'Reportes', description: 'Ver cómo viene el mes', icon: BarChart3, module: 'reportes' },
];

function greeting() {
  const h = Number(new Date().toLocaleString('es-AR', { hour: 'numeric', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' }));
  return h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  const activeTenant = session?.tenants.find((t) => t.tenantId === session.tenantId);
  const modules = getModulesForRoles(activeTenant?.roles ?? []);
  const rawName = session?.user?.name ?? '';
  const firstName = rawName.includes('@') ? '' : rawName.split(' ')[0];

  useEffect(() => {
    fetch('/api/dashboard', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => (d.success ? setData(d) : setError(d.error || 'No se pudo cargar el resumen')))
      .catch(() => setError('No se pudo cargar el resumen'));
  }, [session?.tenantId]);

  const todayVsYesterday =
    data && data.yesterday.revenue > 0 ? (data.today.revenue - data.yesterday.revenue) / data.yesterday.revenue : null;
  const fortnight = data?.daily.reduce((a, d) => a + d.revenue, 0) ?? 0;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500 first-letter:uppercase">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
        </div>
        {modules.has('ventas') && (
          <LinkButton href="/ventas/nueva">
            <Plus /> Nueva venta
          </LinkButton>
        )}
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {!data ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatCard
              label="Ventas de hoy"
              icon={Wallet}
              value={formatMoney(data.today.revenue)}
              hint={
                <span className="inline-flex flex-wrap items-center gap-1">
                  {formatNumber(data.today.count)} {data.today.count === 1 ? 'venta' : 'ventas'}
                  {todayVsYesterday !== null && (
                    <span className={cn('inline-flex items-center font-medium', todayVsYesterday >= 0 ? 'text-emerald-700' : 'text-red-700')}>
                      · {todayVsYesterday >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                      {formatPercent(Math.abs(todayVsYesterday))} vs. ayer
                    </span>
                  )}
                </span>
              }
            />
            <StatCard
              label="Ventas del mes"
              icon={BarChart3}
              value={formatMoney(data.month.revenue)}
              hint={`${formatNumber(data.month.count)} ventas · ticket promedio ${formatMoney(Math.round(data.month.count ? data.month.revenue / data.month.count : 0))}`}
            />
            {modules.has('pedidos') ? (
              <Link href="/pedidos" className="block">
                <StatCard
                  label="Pedidos pendientes"
                  icon={ClipboardList}
                  tone={data.pendingOrders > 0 ? 'warning' : 'neutral'}
                  value={formatNumber(data.pendingOrders)}
                  hint={data.pendingOrders > 0 ? 'Tienda online · revisalos' : 'Tienda online · al día'}
                  className="h-full transition hover:border-zinc-300"
                />
              </Link>
            ) : (
              <StatCard label="Productos" icon={Package} value={formatNumber(data.productsCount)} hint="En el catálogo" />
            )}
            <Link href="/productos?lowStock=1" className="block">
              <StatCard
                label="Stock bajo"
                icon={AlertTriangle}
                tone={data.lowStock.count > 0 ? 'danger' : 'neutral'}
                value={formatNumber(data.lowStock.count)}
                hint={data.lowStock.count > 0 ? 'Variantes en o bajo el mínimo' : 'Todo por encima del mínimo'}
                className="h-full transition hover:border-zinc-300"
              />
            </Link>
          </>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Últimos 14 días"
          description={data ? `${formatMoney(fortnight)} vendidos en dos semanas` : undefined}
          actions={
            modules.has('reportes') ? (
              <Link href="/reportes" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-900">
                Ver reportes <ArrowRight className="size-4" />
              </Link>
            ) : undefined
          }
        />
        <div className="p-4">{data ? <SalesChart data={data.daily} height={208} /> : <Skeleton className="h-52 w-full" />}</div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader
            title="Últimas ventas"
            actions={
              <Link href="/ventas" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-900">
                Ver todas <ArrowRight className="size-4" />
              </Link>
            }
          />
          {!data ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : data.recentSales.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="Todavía no hay ventas" description="Cuando registres una venta va a aparecer acá." />
          ) : (
            <ul className="divide-y divide-zinc-100">
              {data.recentSales.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{PAYMENT_METHOD_LABELS[s.paymentMethod] ?? s.paymentMethod}</p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(s.saleDate)} · {s.itemCount} {s.itemCount === 1 ? 'ítem' : 'ítems'}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 tabular">{formatMoney(s.totalAmount)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Para reponer"
            description="Variantes con stock en o por debajo del mínimo"
            actions={
              modules.has('compras') ? (
                <Link href="/compras/nueva" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-900">
                  Registrar compra <ArrowRight className="size-4" />
                </Link>
              ) : undefined
            }
          />
          {!data ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : data.lowStock.items.length === 0 ? (
            <EmptyState icon={Package} title="Todo el stock está en orden" />
          ) : (
            <ul className="divide-y divide-zinc-100">
              {data.lowStock.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">{item.name}</p>
                    <p className="text-xs text-zinc-500">{item.variant}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                      item.stock <= 0 ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-amber-50 text-amber-800 ring-amber-200'
                    )}
                  >
                    {item.stock <= 0 ? 'Sin stock' : `Quedan ${item.stock}`} · mín. {item.min}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Accesos rápidos según el rol */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {QUICK_ACTIONS.filter((a) => modules.has(a.module)).map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="group rounded-card border border-zinc-200 bg-white p-4 shadow-card transition hover:border-brand-300"
            >
              <Icon className="size-5 text-brand-600" />
              <p className="mt-3 text-sm font-semibold text-zinc-900">{a.label}</p>
              <p className="text-xs text-zinc-500">{a.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
