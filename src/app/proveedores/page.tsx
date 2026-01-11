import { FaUsers, FaPlus, FaPhone, FaEnvelope } from 'react-icons/fa';

export default function ProveedoresPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header de la página */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaUsers className="mr-3 text-indigo-600" />
              Proveedores
            </h1>
            <p className="mt-2 text-gray-600">
              Administra tu red de proveedores y sus datos de contacto
            </p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
            <FaPlus className="mr-2 h-4 w-4" />
            Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FaUsers className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Proveedores</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaUsers className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaPhone className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Con Contacto</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FaEnvelope className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Con Email</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Área principal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-24 w-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaUsers className="h-12 w-12 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Gestión de Proveedores
            </h3>
            <p className="text-gray-600 mb-6">
              El directorio de proveedores estará disponible próximamente. Podrás gestionar 
              información de contacto, historial de compras y evaluación de proveedores.
            </p>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-indigo-800">
                <strong>Funcionalidades planeadas:</strong><br />
                • Directorio completo de proveedores<br />
                • Información de contacto y términos<br />
                • Historial de órdenes y pagos<br />
                • Evaluación y rating de proveedores
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}