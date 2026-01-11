import { FaTruck, FaPlus, FaFileInvoiceDollar } from 'react-icons/fa';

export default function ComprasPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header de la página */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaTruck className="mr-3 text-purple-600" />
              Compras
            </h1>
            <p className="mt-2 text-gray-600">
              Gestiona pedidos a proveedores y actualiza el inventario
            </p>
          </div>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
            <FaPlus className="mr-2 h-4 w-4" />
            Nueva Compra
          </button>
        </div>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaTruck className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Compras Mes</p>
              <p className="text-2xl font-bold text-gray-900">$0</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaFileInvoiceDollar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Órdenes Activas</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FaTruck className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Compras</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Área principal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-24 w-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaTruck className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Gestión de Compras
            </h3>
            <p className="text-gray-600 mb-6">
              El sistema de compras estará disponible próximamente. Permitirá gestionar 
              órdenes de compra, controlar recepciones y actualizar inventario automáticamente.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                <strong>Funcionalidades planeadas:</strong><br />
                • Órdenes de compra a proveedores<br />
                • Control de recepciones<br />
                • Actualización automática de stock<br />
                • Seguimiento de costos y proveedores
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}