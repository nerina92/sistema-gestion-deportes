'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  RefreshCw,
  ShoppingCart,
  Package,
  ArrowLeft,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface LowStockVariant {
  variantId: string;
  productId: string;
  productName: string;
  brand: string;
  size: string;
  color: string;
  sku: string;
  stockQuantity: number;
  minStockAlert: number;
  difference: number;
  costPrice: number;
  priceCash: number;
}

export default function StockBajoPage() {
  const [variants, setVariants] = useState<LowStockVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLowStock();
  }, []);

  const fetchLowStock = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stock/low');
      const data = await response.json();

      if (data.success) {
        setVariants(data.data);
      } else {
        throw new Error(data.error || 'Error al cargar datos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  // Contadores para las estadísticas
  const outOfStockCount = variants.filter(v => v.stockQuantity === 0).length;
  const lowStockCount = variants.filter(v => v.stockQuantity > 0).length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Link
                href="/productos"
                className="text-gray-500 hover:text-gray-700 mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <AlertTriangle className="mr-3 text-yellow-500" />
                Stock Bajo
              </h1>
            </div>
            <p className="text-gray-600 ml-7">
              Productos que necesitan reposicion urgente
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchLowStock}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <Link
              href="/compras/nueva"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Nueva Compra
            </Link>
          </div>
        </div>
      </div>

      {/* Estadisticas */}
      {!loading && variants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{variants.length}</p>
                <p className="text-sm text-gray-600">Total variantes</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{outOfStockCount}</p>
                <p className="text-sm text-gray-600">Sin stock</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
                <p className="text-sm text-gray-600">Stock bajo</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla principal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Estado de carga */}
        {loading && (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-yellow-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando stock bajo...</p>
          </div>
        )}

        {/* Estado de error */}
        {error && (
          <div className="p-12 text-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchLowStock}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Estado vacio - sin stock bajo */}
        {!loading && !error && variants.length === 0 && (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Todo en orden
            </h3>
            <p className="text-gray-600 mb-6">
              Todos los productos tienen stock adecuado. No hay variantes que necesiten reposicion.
            </p>
            <Link
              href="/productos"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Productos
            </Link>
          </div>
        )}

        {/* Tabla con variantes */}
        {!loading && !error && variants.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Actual
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Min.
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diferencia
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {variants.map((variant) => (
                  <tr
                    key={variant.variantId}
                    className={variant.stockQuantity === 0 ? 'bg-red-50' : 'hover:bg-gray-50'}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {variant.productName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {variant.brand}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="font-medium">{variant.size}</span>
                        {' - '}
                        <span>{variant.color}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {variant.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-lg font-bold ${
                        variant.stockQuantity === 0
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}>
                        {variant.stockQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {variant.minStockAlert}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-medium ${
                        variant.difference < 0 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {variant.difference}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {variant.stockQuantity === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Sin stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Bajo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/compras/nueva?variantId=${variant.variantId}&productName=${encodeURIComponent(variant.productName)}&size=${encodeURIComponent(variant.size)}&color=${encodeURIComponent(variant.color)}`}
                        className="inline-flex items-center px-3 py-1.5 border border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Comprar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
