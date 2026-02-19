'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Eye, 
  Package,
  Building2,
  Calendar,
  DollarSign,
  Hash,
  FileText,
  User,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface PurchaseItem {
  id: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  productVariant: {
    id: string;
    size: string;
    color: string;
    sku: string;
    product: {
      name: string;
      brand: string;
    };
  };
}

interface Purchase {
  id: string;
  purchaseDate: string;
  totalAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
  supplier: {
    id: string;
    name: string;
  };
  items: PurchaseItem[];
}

export default function ComprasPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/purchases');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPurchases(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error cargando compras:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const filteredPurchases = purchases.filter(purchase =>
    purchase.supplier.name.toLowerCase().includes(search.toLowerCase()) ||
    purchase.id.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
      'pending': {
        label: 'Pendiente',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      },
      'completed': {
        label: 'Completada',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
      },
      'cancelled': {
        label: 'Cancelada',
        color: 'bg-red-100 text-red-800',
        icon: XCircle
      }
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig['pending'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const viewPurchaseDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Package className="mr-3 text-purple-600" />
          Compras
        </h1>
        <p className="mt-2 text-gray-600">
          Gestiona las compras a proveedores y actualizaciones de stock
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar por proveedor o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPurchases}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>

          <button
            onClick={() => router.push('/compras/nueva')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nueva Compra
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando compras...</p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search ? 'No se encontraron compras' : 'No hay compras registradas'}
            </h3>
            <p className="text-gray-500 mb-4">
              {search 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Registra tu primera compra para comenzar a gestionar el inventario'
              }
            </p>
            {!search && (
              <button
                onClick={() => router.push('/compras/nueva')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Compra
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID / Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{purchase.id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Building2 className="h-3 w-3 mr-1" />
                          {purchase.supplier.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                        {formatDate(purchase.purchaseDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Hash className="h-3 w-3 mr-1 text-gray-400" />
                        {purchase.items.length} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                        {formatPrice(purchase.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(purchase.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => viewPurchaseDetails(purchase)}
                        className="text-purple-600 hover:text-purple-900 inline-flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && selectedPurchase && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-purple-600" />
                    Detalles de Compra #{selectedPurchase.id.slice(-8)}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Creada el {formatDate(selectedPurchase.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">Proveedor:</span>
                    <span className="text-sm font-medium text-gray-900 ml-1">
                      {selectedPurchase.supplier.name}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">Fecha:</span>
                    <span className="text-sm font-medium text-gray-900 ml-1">
                      {formatDate(selectedPurchase.purchaseDate)}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Hash className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">Total items:</span>
                    <span className="text-sm font-medium text-gray-900 ml-1">
                      {selectedPurchase.items.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">Total:</span>
                    <span className="text-lg font-bold text-gray-900 ml-1">
                      {formatPrice(selectedPurchase.totalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center">
                    {getStatusBadge(selectedPurchase.status)}
                  </div>

                  {selectedPurchase.notes && (
                    <div className="flex items-start">
                      <FileText className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <span className="text-sm text-gray-500 block">Notas:</span>
                        <span className="text-sm text-gray-900">{selectedPurchase.notes}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Items de la compra</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Producto
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Variante
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Cantidad
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Costo Unit.
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedPurchase.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{item.productVariant.product.name}</div>
                              <div className="text-gray-500">{item.productVariant.product.brand}</div>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            <div>
                              <div>{item.productVariant.size} - {item.productVariant.color}</div>
                              <div className="text-gray-500 text-xs">{item.productVariant.sku}</div>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            {formatPrice(item.unitCost)}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                            {formatPrice(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}