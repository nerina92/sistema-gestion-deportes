'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaSave, FaSearch, FaSync, FaTag } from 'react-icons/fa';
import { computeVariantPrices } from '@/lib/pricing';

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
  // campo editado localmente (solo el costo)
  _costPrice: string;
  _modified: boolean;
}

interface CategoryOption {
  id: string;
  name: string;
}

export default function PreciosPage() {
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtros
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Solo mostrar modificados
  const [showOnlyModified, setShowOnlyModified] = useState(false);

  const fetchVariants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set('categoryId', filterCategory);
      if (filterBrand) params.set('brand', filterBrand);
      if (search) params.set('search', search);

      const res = await fetch(`/api/products/bulk-prices?${params.toString()}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      const rows: VariantRow[] = data.variants.map((v: any) => ({
        ...v,
        _costPrice: String(v.costPrice),
        _modified: false,
      }));

      setVariants(rows);
      setCategories(data.filters.categories);
      setBrands(data.filters.brands);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterBrand, search]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  // Calcula los precios a mostrar (solo lectura) a partir del costo y los
  // porcentajes del producto. Se usa para la previsualización en vivo.
  function previewPrices(row: VariantRow) {
    return computeVariantPrices(Number(row._costPrice) || 0, {
      marginCash: row.product.marginCash,
      surchargeDebit: row.product.surchargeDebit,
      surchargeFinanced: row.product.surchargeFinanced,
    });
  }

  // Al cambiar el costo, marcamos la fila como modificada. Los precios se
  // recalculan en el render (read-only) a partir del costo.
  function handleCostChange(id: string, rawValue: string) {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        return { ...v, _costPrice: rawValue, _modified: rawValue !== String(v.costPrice) };
      })
    );
  }

  // Guardar todos los modificados
  async function handleSave() {
    const modified = variants.filter((v) => v._modified);
    if (modified.length === 0) {
      setError('No hay cambios para guardar.');
      return;
    }

    // Validar que todos los costos tengan valores numéricos válidos
    const invalid = modified.filter((v) => {
      const c = parseFloat(v._costPrice);
      return isNaN(c) || c < 0;
    });
    if (invalid.length > 0) {
      setError(`Hay ${invalid.length} fila(s) con valores inválidos. Revisalas antes de guardar.`);
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updates = modified.map((v) => ({
        id: v.id,
        costPrice: parseFloat(v._costPrice),
      }));

      const res = await fetch('/api/products/bulk-prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSuccess(data.message);
      // Marcar como no modificados, sincronizando costo y precios recalculados
      setVariants((prev) =>
        prev.map((v) => {
          const cost = parseFloat(v._costPrice);
          const prices = computeVariantPrices(Number(cost) || 0, {
            marginCash: v.product.marginCash,
            surchargeDebit: v.product.surchargeDebit,
            surchargeFinanced: v.product.surchargeFinanced,
          });
          return {
            ...v,
            costPrice: cost,
            priceCash: prices.priceCash,
            priceDebit: prices.priceDebit,
            priceFinanced: prices.priceFinanced,
            _modified: false,
          };
        })
      );
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  // Revertir cambios de una fila
  function revertRow(id: string) {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        return {
          ...v,
          _costPrice: String(v.costPrice),
          _modified: false,
        };
      })
    );
  }

  const displayed = showOnlyModified ? variants.filter((v) => v._modified) : variants;
  const modifiedCount = variants.filter((v) => v._modified).length;

  return (
    <div className="p-4 md:p-6 max-w-full">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaTag className="text-blue-600" />
            Actualización masiva de precios
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Editá el precio de costo. Los precios de venta se calculan automáticamente según los porcentajes de cada producto. Guardá todos los cambios de una vez.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchVariants}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium disabled:opacity-50"
          >
            <FaSync className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || modifiedCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            <FaSave className="h-4 w-4" />
            {saving ? 'Guardando...' : `Guardar${modifiedCount > 0 ? ` (${modifiedCount})` : ''}`}
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-4 text-sm">
          ✅ {success}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las marcas</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyModified}
              onChange={(e) => setShowOnlyModified(e.target.checked)}
              className="rounded"
            />
            Ver solo modificados
          </label>
          <span className="text-sm text-gray-500">
            {displayed.length} variante{displayed.length !== 1 ? 's' : ''}
            {modifiedCount > 0 && (
              <span className="ml-2 text-orange-600 font-medium">
                ({modifiedCount} con cambios sin guardar)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">
          <FaSync className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-400" />
          <p>Cargando variantes...</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FaTag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg">No se encontraron variantes</p>
          <p className="text-sm">Probá con otros filtros</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Producto</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">SKU</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Talle/Color</th>
                  <th className="text-right px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">
                    Costo
                  </th>
                  <th className="text-right px-3 py-3 font-semibold text-green-700 whitespace-nowrap">
                    Contado
                  </th>
                  <th className="text-right px-3 py-3 font-semibold text-blue-700 whitespace-nowrap">
                    Débito
                  </th>
                  <th className="text-right px-3 py-3 font-semibold text-purple-700 whitespace-nowrap">
                    Financiado
                  </th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Stock</th>
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayed.map((v) => {
                  const prices = previewPrices(v);
                  return (
                  <tr
                    key={v.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      v._modified ? 'bg-orange-50 hover:bg-orange-50' : ''
                    }`}
                  >
                    {/* Producto */}
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900 max-w-[200px] truncate" title={v.product.name}>
                        {v.product.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {v.product.category}
                        {v.product.brand ? ` · ${v.product.brand}` : ''}
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-3 py-2 text-gray-500 font-mono text-xs whitespace-nowrap">
                      {v.sku}
                    </td>

                    {/* Talle / Color */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-gray-700">{v.size}</span>
                      {v.color && v.color !== v.size && (
                        <span className="text-gray-400"> / {v.color}</span>
                      )}
                    </td>

                    {/* Costo */}
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-gray-400 text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={v._costPrice}
                          onChange={(e) => handleCostChange(v.id, e.target.value)}
                          className="w-24 text-right border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm text-gray-900"
                        />
                      </div>
                    </td>

                    {/* Contado (solo lectura, calculado) */}
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1 text-right text-gray-500">
                        <span className="text-gray-400 text-xs">$</span>
                        <span className="w-24 inline-block text-right bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm tabular-nums">
                          {prices.priceCash.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </td>

                    {/* Débito (solo lectura, calculado) */}
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1 text-right text-gray-500">
                        <span className="text-gray-400 text-xs">$</span>
                        <span className="w-24 inline-block text-right bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm tabular-nums">
                          {prices.priceDebit.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </td>

                    {/* Financiado (solo lectura, calculado) */}
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1 text-right text-gray-500">
                        <span className="text-gray-400 text-xs">$</span>
                        <span className="w-24 inline-block text-right bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm tabular-nums">
                          {prices.priceFinanced.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          v.stockQuantity <= 0
                            ? 'bg-red-100 text-red-700'
                            : v.stockQuantity <= 3
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {v.stockQuantity}
                      </span>
                    </td>

                    {/* Revertir */}
                    <td className="px-3 py-2 text-center">
                      {v._modified && (
                        <button
                          onClick={() => revertRow(v.id)}
                          title="Descartar cambios de esta fila"
                          className="text-gray-400 hover:text-red-500 transition-colors text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer con botón guardar */}
          {modifiedCount > 0 && (
            <div className="border-t border-orange-200 bg-orange-50 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-orange-700 font-medium">
                {modifiedCount} variante{modifiedCount !== 1 ? 's' : ''} con cambios sin guardar
              </span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                <FaSave className="h-4 w-4" />
                {saving ? 'Guardando...' : `Guardar ${modifiedCount} cambio${modifiedCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
