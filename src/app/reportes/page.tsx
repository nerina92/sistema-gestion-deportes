'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Download,
  Minus,
  PackageX,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Button, Card, CardHeader, EmptyState, PageHeader, Skeleton, StatCard } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatMoney, formatNumber, formatPercent, todayISODate } from '@/lib/format';
import type { BreakdownRow, SalesReport } from '@/lib/reports';

const SalesChart = dynamic(() => import('@/components/charts/SalesChart'), { ssr: false, loading: () => <Skeleton className="h-72 w-full" /> });

type PresetKey = '7d' | '30d' | '90d' | 'month' | 'prevMonth' | 'custom';

const PRESETS: { key: Exclude<PresetKey, 'custom'>; label: string }[] = [
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: '90d', label: '90 días' },
  { key: 'month', label: 'Este mes' },
  { key: 'prevMonth', label: 'Mes anterior' },
];

function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function presetRange(key: Exclude<PresetKey, 'custom'>): { from: string; to: string } {
  const today = todayISODate();
  const [y, m] = today.split('-').map(Number);
  switch (key) {
    case '7d':
      return { from: shiftDate(today, -6), to: today };
    case '30d':
      return { from: shiftDate(today, -29), to: today };
    case '90d':
      return { from: shiftDate(today, -89), to: today };
    case 'month':
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case 'prevMonth': {
      const first = new Date(Date.UTC(m === 1 ? y - 1 : y, m === 1 ? 11 : m - 2, 1));
      const last = new Date(Date.UTC(y, m - 1, 0));
      return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) };
    }
  }
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (!previous) return <span className="text-xs text-zinc-400">Sin datos del período anterior</span>;
  const change = (current - previous) / previous;
  const flat = Math.abs(change) < 0.005;
  const up = change > 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        flat ? 'text-zinc-500' : up ? 'text-emerald-700' : 'text-red-700'
      )}
    >
      <Icon className="size-3.5" />
      {flat ? 'Igual' : `${up ? '+' : ''}${formatPercent(change)}`}
      <span className="font-normal text-zinc-500">vs. período anterior</span>
    </span>
  );
}

/** Lista de barras horizontales de un solo color: para pocas categorías ordenadas. */
function BreakdownList({ rows, total, emptyText }: { rows: BreakdownRow[]; total: number; emptyText: string }) {
  if (rows.length === 0) return <p className="px-5 py-8 text-center text-sm text-zinc-500">{emptyText}</p>;
  const max = Math.max(...rows.map((r) => r.revenue), 1);
  return (
    <ul className="space-y-3 p-5">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-zinc-800">{r.label}</span>
            <span className="shrink-0 text-zinc-900 tabular">
              {formatMoney(r.revenue)}
              <span className="ml-2 text-xs text-zinc-500">{total ? formatPercent(r.revenue / total) : '—'}</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100">
            <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(r.revenue / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

async function exportToExcel(report: SalesReport) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const k = report.kpis;
  const add = (name: string, rows: Record<string, unknown>[]) =>
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{ '': 'Sin datos' }]), name);
  add('Resumen', [
    { Indicador: 'Período', Valor: `${report.range.from} a ${report.range.to}` },
    { Indicador: 'Ventas ($)', Valor: k.revenue },
    { Indicador: 'Cantidad de ventas', Valor: k.salesCount },
    { Indicador: 'Ticket promedio ($)', Valor: Math.round(k.avgTicket) },
    { Indicador: 'Unidades vendidas', Valor: k.unitsSold },
    { Indicador: 'Ganancia bruta estimada ($)', Valor: Math.round(k.grossProfit) },
    { Indicador: 'Margen bruto (%)', Valor: Math.round(k.marginPct * 1000) / 10 },
    { Indicador: 'Compras ($)', Valor: k.purchasesTotal },
    { Indicador: 'Facturas emitidas', Valor: k.invoicesCount },
    { Indicador: 'Stock valorizado a costo ($)', Valor: Math.round(report.inventory.costValue) },
    { Indicador: 'Stock valorizado a precio contado ($)', Valor: Math.round(report.inventory.retailValue) },
  ]);
  add('Ventas por día', report.daily.map((d) => ({ Fecha: d.date, 'Ventas ($)': d.revenue, Cantidad: d.count })));
  add('Productos', report.topProducts.map((p) => ({ Producto: p.name, Marca: p.brand ?? '', Unidades: p.units, 'Ventas ($)': p.revenue, 'Ganancia est. ($)': Math.round(p.profit) })));
  add('Categorías', report.byCategory.map((c) => ({ Categoría: c.label, Unidades: c.units, 'Ventas ($)': c.revenue })));
  add('Medios de pago', report.byPaymentMethod.map((r) => ({ 'Medio de pago': r.label, Ventas: r.count, 'Total ($)': r.revenue })));
  add('Stock bajo', report.inventory.lowStock.map((r) => ({ Producto: r.name, Variante: r.variant, SKU: r.sku, Stock: r.stock, Mínimo: r.min })));
  add('Sin movimiento', report.inventory.noMovement.map((r) => ({ Producto: r.name, Variante: r.variant, SKU: r.sku, Stock: r.stock, 'Valor a costo ($)': Math.round(r.costValue) })));
  XLSX.writeFile(wb, `reporte-${report.range.from}-a-${report.range.to}.xlsx`);
}

export default function ReportesPage() {
  const [preset, setPreset] = useState<PresetKey>('30d');
  const [range, setRange] = useState(() => presetRange('30d'));
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (r: { from: string; to: string }) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/reports?from=${r.from}&to=${r.to}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'No se pudo generar el reporte');
      setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el reporte');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [load, range]);

  const choosePreset = (key: Exclude<PresetKey, 'custom'>) => {
    setPreset(key);
    setRange(presetRange(key));
  };

  const k = report?.kpis;
  const hasSales = (k?.salesCount ?? 0) > 0;
  const best = useMemo(
    () => report?.daily.reduce((a, b) => (b.revenue > a.revenue ? b : a), report.daily[0]),
    [report]
  );

  return (
    <div>
      <PageHeader
        icon={BarChart3}
        title="Reportes"
        description="Cómo viene el negocio: ventas, productos y stock."
        actions={
          <Button variant="secondary" onClick={() => report && exportToExcel(report)} disabled={!report || loading}>
            <Download /> Exportar Excel
          </Button>
        }
      />

      {/* Filtros de período */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex w-full overflow-x-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-xs lg:w-auto">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => choosePreset(p.key)}
              className={cn(
                'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition',
                preset === p.key ? 'bg-brand-600 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-100'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            className="field-input w-auto"
            value={range.from}
            max={range.to}
            onChange={(e) => {
              setPreset('custom');
              setRange((r) => ({ ...r, from: e.target.value }));
            }}
            aria-label="Desde"
          />
          <span className="text-zinc-400">a</span>
          <input
            type="date"
            className="field-input w-auto"
            value={range.to}
            min={range.from}
            max={todayISODate()}
            onChange={(e) => {
              setPreset('custom');
              setRange((r) => ({ ...r, to: e.target.value }));
            }}
            aria-label="Hasta"
          />
        </div>
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {loading && !report
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32" />)
          : k && (
              <>
                <StatCard label="Ventas" icon={Wallet} value={formatMoney(k.revenue)}>
                  <div className="mt-2">
                    <Delta current={k.revenue} previous={report!.previous.revenue} />
                  </div>
                </StatCard>
                <StatCard label="Cantidad de ventas" icon={ShoppingCart} value={formatNumber(k.salesCount)}>
                  <div className="mt-2">
                    <Delta current={k.salesCount} previous={report!.previous.salesCount} />
                  </div>
                </StatCard>
                <StatCard label="Ticket promedio" icon={Receipt} value={formatMoney(Math.round(k.avgTicket))}>
                  <div className="mt-2">
                    <Delta current={k.avgTicket} previous={report!.previous.avgTicket} />
                  </div>
                </StatCard>
                <StatCard
                  label="Ganancia bruta estimada"
                  icon={TrendingUp}
                  value={formatMoney(Math.round(k.grossProfit))}
                  hint={`Margen ${formatPercent(k.marginPct)} · calculado con el costo actual`}
                />
              </>
            )}
      </div>

      {/* Ventas por día */}
      <Card className={cn('mt-6', loading && 'opacity-60')}>
        <CardHeader
          title="Ventas por día"
          description={
            hasSales && best
              ? `Mejor día: ${best.date.split('-').reverse().slice(0, 2).join('/')} con ${formatMoney(best.revenue)} · ${formatNumber(k!.unitsSold)} unidades vendidas en el período`
              : undefined
          }
        />
        <div className="p-4">
          {report && hasSales ? (
            <SalesChart data={report.daily} />
          ) : report ? (
            <EmptyState icon={BarChart3} title="No hay ventas en este período" description="Probá con un rango de fechas más amplio." />
          ) : (
            <Skeleton className="h-72 w-full" />
          )}
        </div>
      </Card>

      {report && hasSales && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader title="Medios de pago" />
              <BreakdownList rows={report.byPaymentMethod} total={k!.revenue} emptyText="Sin datos" />
            </Card>
            <Card>
              <CardHeader title="Tipo de precio" />
              <BreakdownList rows={report.byPriceType} total={k!.revenue} emptyText="Sin datos" />
            </Card>
            <Card>
              <CardHeader title="Categorías" />
              <BreakdownList rows={report.byCategory.slice(0, 6)} total={k!.revenue} emptyText="Sin datos" />
            </Card>
          </div>

          {/* Productos más vendidos */}
          <Card className="mt-6 overflow-hidden">
            <CardHeader title="Productos más vendidos" description="Top 10 por facturación en el período" />
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="!text-right">Unidades</th>
                    <th className="!text-right">Ventas</th>
                    <th className="!text-right">Ganancia est.</th>
                    <th className="w-40">Participación</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topProducts.map((p) => (
                    <tr key={p.productId}>
                      <td>
                        <p className="font-medium text-zinc-900">{p.name}</p>
                        {p.brand && <p className="text-xs text-zinc-500">{p.brand}</p>}
                      </td>
                      <td className="text-right">{formatNumber(p.units)}</td>
                      <td className="text-right font-medium text-zinc-900">{formatMoney(p.revenue)}</td>
                      <td className="text-right">{formatMoney(Math.round(p.profit))}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-zinc-100">
                            <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${(p.revenue / k!.revenue) * 100}%` }} />
                          </div>
                          <span className="w-12 text-right text-xs text-zinc-500">{formatPercent(p.revenue / k!.revenue)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Inventario */}
      {report && (
        <>
          <h2 className="mb-3 mt-10 text-lg font-semibold tracking-tight text-zinc-900">Inventario actual</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard label="Stock valorizado a costo" value={formatMoney(Math.round(report.inventory.costValue))} hint="Capital invertido en mercadería" />
            <StatCard label="Stock a precio contado" value={formatMoney(Math.round(report.inventory.retailValue))} hint="Si se vendiera todo al contado" />
            <StatCard label="Unidades en stock" value={formatNumber(report.inventory.units)} hint={`${formatNumber(report.inventory.variants)} variantes`} />
            <StatCard
              label="Variantes sin stock"
              icon={PackageX}
              tone={report.inventory.outOfStock > 0 ? 'danger' : 'neutral'}
              value={formatNumber(report.inventory.outOfStock)}
              hint={report.inventory.outOfStock > 0 ? 'Conviene reponerlas' : 'Ninguna variante agotada'}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <CardHeader title="Stock bajo" description="En o por debajo del mínimo configurado" />
              {report.inventory.lowStock.length === 0 ? (
                <EmptyState title="Todo el stock está por encima del mínimo" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th className="!text-right">Stock</th>
                        <th className="!text-right">Mínimo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.inventory.lowStock.map((r) => (
                        <tr key={r.sku}>
                          <td>
                            <p className="font-medium text-zinc-900">{r.name}</p>
                            <p className="text-xs text-zinc-500">
                              {r.variant} · {r.sku}
                            </p>
                          </td>
                          <td className={cn('text-right font-medium', r.stock <= 0 ? 'text-red-700' : 'text-amber-700')}>{r.stock}</td>
                          <td className="text-right">{r.min}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
            <Card className="overflow-hidden">
              <CardHeader title="Sin ventas en el período" description="Mercadería inmovilizada, ordenada por valor a costo" />
              {report.inventory.noMovement.length === 0 ? (
                <EmptyState title="Todos los productos con stock tuvieron ventas" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th className="!text-right">Stock</th>
                        <th className="!text-right">Valor a costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.inventory.noMovement.map((r) => (
                        <tr key={r.sku}>
                          <td>
                            <p className="font-medium text-zinc-900">{r.name}</p>
                            <p className="text-xs text-zinc-500">
                              {r.variant} · {r.sku}
                            </p>
                          </td>
                          <td className="text-right">{r.stock}</td>
                          <td className="text-right font-medium text-zinc-900">{formatMoney(Math.round(r.costValue))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
