'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaHome, 
  FaBox, 
  FaShoppingCart, 
  FaTruck, 
  FaChartLine, 
  FaExclamationTriangle,
  FaArrowRight,
  FaCalendar
} from 'react-icons/fa';

interface DashboardStats {
  salesToday: number;
  salesMonth: number;
  lowStockCount: number;
  totalProducts: number;
}

interface RecentSale {
  id: string;
  saleDate: string;
  totalAmount: string;
  paymentMethod: string;
  itemCount: number;
}

interface LowStockItem {
  id: string;
  productName: string;
  size: string;
  color: string;
  stockQuantity: number;
  minStockAlert: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    salesToday: 0,
    salesMonth: 0,
    lowStockCount: 0,
    totalProducts: 0
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch sales
      const salesRes = await fetch('/api/sales');
      const salesData = await salesRes.json();
      
      // Fetch products
      const productsRes = await fetch('/api/products?page=1&pageSize=1000');
      const productsData = await productsRes.json();

      if (salesData.success && productsData.products) {
        calculateStats(salesData.data, productsData.products);
        setRecentSales(salesData.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (sales: RecentSale[], products: any[]) => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7);

    // Calculate sales
    const salesToday = sales
      .filter(s => s.saleDate.startsWith(today))
      .reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);

    const salesMonth = sales
      .filter(s => s.saleDate.startsWith(thisMonth))
      .reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);

    // Calculate low stock items
    const lowStock: LowStockItem[] = [];
    products.forEach(product => {
      product.variants?.forEach((variant: any) => {
        if (variant.stockQuantity <= variant.minStockAlert) {
          lowStock.push({
            id: variant.id,
            productName: product.name,
            size: variant.size,
            color: variant.color,
            stockQuantity: variant.stockQuantity,
            minStockAlert: variant.minStockAlert
          });
        }
      });
    });

    setLowStockItems(lowStock.slice(0, 5));

    setStats({
      salesToday,
      salesMonth,
      lowStockCount: lowStock.length,
      totalProducts: products.length
    });
  };

  const paymentMethodLabels: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia'
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FaHome className="mr-3 text-blue-600" />
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Resumen general del negocio - {new Date().toLocaleDateString('es-AR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Sales Today */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas de Hoy</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${isLoading ? '...' : stats.salesToday.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total del día</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FaShoppingCart className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Sales Month */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas del Mes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${isLoading ? '...' : stats.salesMonth.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total mensual</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaChartLine className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {isLoading ? '...' : stats.lowStockCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">Productos críticos</p>
            </div>
            <div className={`p-3 rounded-lg ${stats.lowStockCount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <FaExclamationTriangle className={`h-8 w-8 ${stats.lowStockCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
          </div>
          {stats.lowStockCount > 0 && (
            <Link 
              href="/productos?filter=lowStock"
              className="mt-3 text-xs text-red-600 hover:text-red-800 font-medium flex items-center"
            >
              Ver productos <FaArrowRight className="ml-1" />
            </Link>
          )}
        </div>

        {/* Total Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Productos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {isLoading ? '...' : stats.totalProducts}
              </p>
              <p className="text-xs text-gray-500 mt-1">En inventario</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FaBox className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert */}
      {stats.lowStockCount > 0 && (
        <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <FaExclamationTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Alerta: {stats.lowStockCount} producto{stats.lowStockCount !== 1 ? 's' : ''} con stock crítico
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Algunos productos están por debajo del stock mínimo. Considera realizar una orden de compra.
              </p>
              <Link
                href="/compras/nueva"
                className="mt-2 inline-flex items-center text-sm font-medium text-red-800 hover:text-red-900"
              >
                Registrar compra <FaArrowRight className="ml-1" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Últimas Ventas</h3>
            <Link 
              href="/ventas"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              Ver todas <FaArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : recentSales.length === 0 ? (
              <div className="text-center py-8">
                <FaShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No hay ventas registradas</p>
                <Link
                  href="/ventas/nueva"
                  className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Registrar primera venta
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded">
                        <FaShoppingCart className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          ${parseFloat(sale.totalAmount).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(sale.saleDate).toLocaleDateString('es-AR')} • {paymentMethodLabels[sale.paymentMethod]} • {sale.itemCount} items
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/ventas"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Stock Crítico</h3>
            <Link 
              href="/productos?filter=lowStock"
              className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center"
            >
              Ver todos <FaArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : lowStockItems.length === 0 ? (
              <div className="text-center py-8">
                <FaBox className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  ✓ Todos los productos tienen stock adecuado
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`p-2 rounded ${item.stockQuantity === 0 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                        <FaExclamationTriangle className={`h-4 w-4 ${item.stockQuantity === 0 ? 'text-red-600' : 'text-yellow-600'}`} />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.size} - {item.color} • Stock: {item.stockQuantity} (Mín: {item.minStockAlert})
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.stockQuantity === 0 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.stockQuantity === 0 ? 'Sin stock' : 'Bajo'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
          <p className="text-sm text-gray-600 mt-1">
            Accede rápidamente a las funcionalidades principales
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/ventas/nueva"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all text-left group"
            >
              <FaShoppingCart className="h-8 w-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-900">Nueva Venta</h4>
              <p className="text-sm text-gray-600 mt-1">Registrar venta rápidamente</p>
            </Link>

            <Link
              href="/compras/nueva"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-left group"
            >
              <FaTruck className="h-8 w-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-900">Nueva Compra</h4>
              <p className="text-sm text-gray-600 mt-1">Registrar orden de compra</p>
            </Link>

            <Link
              href="/productos/nuevo"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
            >
              <FaBox className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-900">Nuevo Producto</h4>
              <p className="text-sm text-gray-600 mt-1">Agregar producto al inventario</p>
            </Link>

            <Link
              href="/reportes"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all text-left group"
            >
              <FaChartLine className="h-8 w-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-900">Reportes</h4>
              <p className="text-sm text-gray-600 mt-1">Ver análisis y métricas</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}