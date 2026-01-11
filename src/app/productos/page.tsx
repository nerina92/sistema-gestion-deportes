import { FaBox, FaPlus, FaSearch } from 'react-icons/fa';

export default function ProductosPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header de la página */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaBox className="mr-3 text-blue-600" />
              Productos
            </h1>
            <p className="mt-2 text-gray-600">
              Gestiona tu inventario de productos y variantes
            </p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
            <FaPlus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Área de contenido principal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Barra de búsqueda y filtros */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-3">
              <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Todas las categorías</option>
                <option value="remeras">Remeras</option>
                <option value="pantalones">Pantalones</option>
                <option value="zapatillas">Zapatillas</option>
              </select>
              <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Todas las marcas</option>
                <option value="nike">Nike</option>
                <option value="adidas">Adidas</option>
                <option value="puma">Puma</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estado de "próximamente" */}
        <div className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaBox className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Gestión de Productos
            </h3>
            <p className="text-gray-600 mb-6">
              La interfaz completa de gestión de productos estará disponible próximamente. 
              Por ahora puedes usar las APIs para gestionar productos.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>APIs disponibles:</strong><br />
                • POST /api/products - Crear productos<br />
                • GET /api/products - Listar productos<br />
                • PUT /api/products/:id - Actualizar productos<br />
                • DELETE /api/products/:id - Eliminar productos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}