import { FaCog, FaUser, FaStore, FaShieldAlt, FaDatabase, FaBell } from 'react-icons/fa';

export default function ConfiguracionPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header de la página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FaCog className="mr-3 text-gray-600" />
          Configuración
        </h1>
        <p className="mt-2 text-gray-600">
          Administra la configuración del sistema y tu perfil de usuario
        </p>
      </div>

      {/* Grid de configuraciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Perfil de Usuario */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FaUser className="mr-2 text-blue-500" />
              Perfil de Usuario
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona tu información personal y credenciales
            </p>
          </div>
          <div className="p-6">
            <ul className="space-y-3">
              <li className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cambiar contraseña</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Próximamente</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Actualizar perfil</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Próximamente</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Preferencias de usuario</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Próximamente</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Configuración del Negocio */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FaStore className="mr-2 text-green-500" />
              Datos del Negocio
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Información de tu tienda y configuración comercial
            </p>
          </div>
          <div className="p-6">
            <ul className="space-y-3">
              <li className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Información de la tienda</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Próximamente</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Métodos de pago</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Próximamente</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Configuración de precios</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Próximamente</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Seguridad */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FaShieldAlt className="mr-2 text-red-500" />
              Seguridad
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Configuración de seguridad y respaldos
            </p>
          </div>
          <div className="p-6">
            <ul className="space-y-3">
              <li className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Autenticación de dos factores</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Próximamente</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Respaldos automáticos</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Próximamente</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Logs de actividad</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Próximamente</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Integraciones */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FaDatabase className="mr-2 text-purple-500" />
              Integraciones
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Conexiones con sistemas externos
            </p>
          </div>
          <div className="p-6">
            <ul className="space-y-3">
              <li className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AFIP - Facturación electrónica</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Próximamente</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tienda Nube</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Próximamente</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Importar desde Excel</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Disponible</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Notificaciones y Alertas */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FaBell className="mr-2 text-orange-500" />
            Notificaciones y Alertas
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Configura qué notificaciones quieres recibir
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Alertas de Inventario</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-gray-600">Stock bajo</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Próximamente</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-600">Productos agotados</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Próximamente</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Reportes Automáticos</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-gray-600">Reporte diario de ventas</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Próximamente</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-600">Resumen semanal</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Próximamente</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Información del Sistema */}
      <div className="mt-8 bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Versión:</span>
            <span className="ml-2 font-medium">1.0.0</span>
          </div>
          <div>
            <span className="text-gray-600">Última actualización:</span>
            <span className="ml-2 font-medium">Enero 2026</span>
          </div>
          <div>
            <span className="text-gray-600">Estado:</span>
            <span className="ml-2 font-medium text-green-600">Operativo</span>
          </div>
        </div>
      </div>
    </div>
  );
}