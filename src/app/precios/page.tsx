'use client';

import { useState, useEffect, useMemo } from 'react';
import { Percent, RefreshCw, RotateCcw, Save, Search, Tag, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Badge, Button, Card, CardBody, EmptyState, PageHeader, SkeletonRows } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { computeVariantPrices, type ComputedPrices } from '@/lib/pricing';
import { useBusinessSettings } from '@/lib/use-business-settings';

interface VariantRow {
  id: string;
  sku: string;
  size: string;
  color: string;
  costPrice: number;
  priceCash: number;
  priceDebit: number;
  priceFinanced: number;
  stockQuantity: number;
  product: {
    id: string;
    name: string;
    brand: string | null;
    category: string;
    categoryId: string | null;
    marginCash: number;
    surchargeDebit: number;
    surchargeFinanced: number;
  };
  // Costo editado localmente (los precios de venta se derivan de él)
  _costPrice: string;
  _modified: boolean;
}

interface CategoryOption {
  id: string;
  name: string;
}

const QUICK_PERCENTS = [5, 10, 15, 20];

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export default function PreciosPage() {
  const settings = useBusinessSettings();
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtros (se aplican en el navegador para no perder cambios sin guardar)
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [showOnlyModified, setShowOnlyModified] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Ajuste por porcentaje
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [percent, setPercent] = useState('');

  async function fetchVariants() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/products/bulk-prices');
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setVariants(
        data.variants.map((v: Omit<VariantRow, '_costPrice' | '_modified'>) => ({
          ...v,
          _costPrice: String(v.costPrice),
          _modified: false,
        }))
      );
      setCategories(data.filters.categories);
      setBrands(data.filters.brands);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVariants();
  }, []);

  function pricesFor(row: VariantRow, cost: number): ComputedPrices {
    return computeVariantPrices(
      cost,
      {
        marginCash: row.product.marginCash,
        surchargeDebit: row.product.surchargeDebit,
        surchargeFinanced: row.product.surchargeFinanced,
      },
      settings.priceRounding
    );
  }

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    return variants.filter((v) => {
      if (filterCategory && v.product.categoryId !== filterCategory) return false;
      if (filterBrand && v.product.brand !== filterBrand) return false;
      if (q && !normalize(`${v.product.name} ${v.sku}`).includes(q)) return false;
      return true;
    });
  }, [variants, search, filterCategory, filterBrand]);

  const displayed = showOnlyModified ? filtered.filter((v) => v._modified) : filtered;
  const modifiedCount = variants.filter((v) => v._modified).length;
  const hasFilters = Boolean(search || filterCategory || filterBrand);
  const percentValue = Number(percent.replace(',', '.'));
  const percentValid = Number.isFinite(percentValue) && percentValue > 0 && (direction === 'up' || percentValue < 100);

  function setCost(id: string, rawValue: string) {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, _costPrice: rawValue, _modified: rawValue !== String(v.costPrice) } : v))
    );
  }

  // Aplica el % sobre el costo ORIGINAL de cada variante filtrada (no acumula
  // si se aplica dos veces). Los precios de venta se recalculan con el margen.
  function applyPercent() {
    if (!percentValid) return;
    const factor = direction === 'up' ? 1 + percentValue / 100 : 1 - percentValue / 100;
    const ids = new Set(filtered.map((v) => v.id));
    setVariants((prev) =>
      prev.map((v) => {
        if (!ids.has(v.id)) return v;
        const next = String(Math.round(v.costPrice * factor * 100) / 100);
        return { ...v, _costPrice: next, _modified: next !== String(v.costPrice) };
      })
    );
    setSuccess('');
    setError('');
  }

  function revertRow(id: string) {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, _costPrice: String(v.costPrice), _modified: false } : v)));
  }

  function revertAll() {
    setVariants((prev) => prev.map((v) => ({ ...v, _costPrice: String(v.costPrice), _modified: false })));
  }

  async function handleSave() {
    const modified = variants.filter((v) => v._modified);
    if (modified.length === 0) return;

    const invalid = modified.filter((v) => {
      const c = parseFloat(v._costPrice);
      return isNaN(c) || c < 0;
    });
    if (invalid.length > 0) {
      setError(`Hay ${invalid.length} fila(s) con un costo inválido. Revisalas antes de guardar.`);
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/products/bulk-prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: modified.map((v) => ({ id: v.id, costPrice: parseFloat(v._costPrice) })) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSuccess(data.message);
      setVariants((prev) =>
        prev.map((v) => {
          if (!v._modified) return v;
          const cost = parseFloat(v._costPrice);
          return { ...v, costPrice: cost, ...pricesFor(v, cost), _costPrice: String(cost), _modified: false };
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-20">
      <PageHeader
        icon={Tag}
        title="Precios"
        description="Editá costos o ajustalos por porcentaje. Los precios de venta se recalculan con el margen de cada producto."
        actions={
          <>
            <Button variant="secondary" onClick={fetchVariants} disabled={loading || saving}>
              <RefreshCw className={cn(loading && 'animate-spin')} />
              Recargar
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={modifiedCount === 0}>
              {!saving && <Save />}
              Guardar{modifiedCount > 0 ? ` (${modifiedCount})` : ''}
            </Button>
          </>
        }
      />

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Filtros */}
        <Card className="lg:col-span-3">
          <CardBody className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="field-input pl-9"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="field-input">
                <option value="">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="field-input">
                <option value="">Todas las marcas</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-zinc-600">
                <input
                  type="checkbox"
                  checked={showOnlyModified}
                  onChange={(e) => setShowOnlyModified(e.target.checked)}
                  className="accent-brand-600"
                />
                Ver solo modificados
              </label>
              <span className="text-zinc-500">
                {displayed.length} variante{displayed.length !== 1 ? 's' : ''}
              </span>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setFilterCategory('');
                    setFilterBrand('');
                  }}
                  className="text-brand-700 hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Ajuste por porcentaje */}
        <Card className="lg:col-span-2">
          <CardBody className="space-y-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <Percent className="size-4 text-brand-600" /> Ajuste por porcentaje
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Se aplica a {hasFilters ? 'las' : 'todas las'} <strong className="text-zinc-700">{filtered.length}</strong> variante
                {filtered.length !== 1 ? 's' : ''} {hasFilters ? 'filtradas' : 'del catálogo'}. Podés revisar antes de guardar.
              </p>
            </div>
            <div className="flex gap-2">
              <div className="inline-flex rounded-lg border border-zinc-300 p-0.5">
                {(['up', 'down'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDirection(d)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition',
                      direction === d ? 'bg-brand-600 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                    )}
                  >
                    {d === 'up' ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                    {d === 'up' ? 'Aumentar' : 'Bajar'}
                  </button>
                ))}
              </div>
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value.replace(/[^0-9.,]/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && applyPercent()}
                  className="field-input pr-8 text-right tabular-nums"
                  aria-label="Porcentaje"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">%</span>
              </div>
              <Button onClick={applyPercent} disabled={!percentValid || filtered.length === 0 || loading}>
                Aplicar
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PERCENTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPercent(String(p))}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs transition',
                    percent === String(p)
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  )}
                >
                  {p}%
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabla */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-5">
            <SkeletonRows rows={8} />
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState icon={Tag} title="No se encontraron variantes" description="Probá con otros filtros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>
                    {settings.variantAttr1Label}/{settings.variantAttr2Label}
                  </th>
                  <th className="text-right!">Costo</th>
                  <th className="text-right!">Contado</th>
                  <th className="text-right!">Débito</th>
                  <th className="text-right!">Financiado</th>
                  <th className="text-center!">Stock</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {displayed.map((v) => {
                  const cost = Number(v._costPrice) || 0;
                  const next = pricesFor(v, cost);
                  const change = v._modified && v.costPrice > 0 ? (cost / v.costPrice - 1) * 100 : null;
                  return (
                    <tr key={v.id} className={cn(v._modified && '[&>td]:bg-amber-50/70')}>
                      <td>
                        <div className="max-w-[240px] truncate font-medium text-zinc-900" title={v.product.name}>
                          {v.product.name}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {v.product.category}
                          {v.product.brand ? ` · ${v.product.brand}` : ''} · <span className="font-mono">{v.sku}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        {v.size || '—'}
                        {v.color && v.color !== v.size && <span className="text-zinc-400"> / {v.color}</span>}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          {change !== null && (
                            <Badge tone={change >= 0 ? 'warning' : 'info'}>
                              {change >= 0 ? '+' : ''}
                              {change.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%
                            </Badge>
                          )}
                          <div className="relative">
                            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">$</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={v._costPrice}
                              onChange={(e) => setCost(v.id, e.target.value)}
                              className="field-input w-28 py-1 pl-5 text-right tabular-nums"
                              aria-label={`Costo de ${v.product.name}`}
                            />
                          </div>
                        </div>
                      </td>
                      {(['priceCash', 'priceDebit', 'priceFinanced'] as const).map((key) => (
                        <td key={key} className="whitespace-nowrap text-right tabular-nums">
                          <div className={cn(v._modified ? 'font-medium text-zinc-900' : 'text-zinc-600')}>{formatMoney(next[key])}</div>
                          {v._modified && next[key] !== v[key] && (
                            <div className="text-xs text-zinc-400 line-through">{formatMoney(v[key])}</div>
                          )}
                        </td>
                      ))}
                      <td className="text-center">
                        <Badge tone={v.stockQuantity <= 0 ? 'danger' : v.stockQuantity <= 3 ? 'warning' : 'success'}>
                          {v.stockQuantity}
                        </Badge>
                      </td>
                      <td className="text-center">
                        {v._modified && (
                          <button
                            onClick={() => revertRow(v.id)}
                            title="Descartar el cambio de esta fila"
                            className="rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600"
                          >
                            <X className="size-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Barra de cambios pendientes */}
      {modifiedCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur lg:left-64">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <span className="text-sm text-zinc-700">
              <strong>{modifiedCount}</strong> variante{modifiedCount !== 1 ? 's' : ''} con cambios sin guardar
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={revertAll} disabled={saving}>
                <RotateCcw /> Descartar
              </Button>
              <Button onClick={handleSave} loading={saving}>
                {!saving && <Save />}
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
