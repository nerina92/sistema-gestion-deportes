'use client';

import { FaHome, FaBox, FaShoppingCart, FaTruck, FaChartLine, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FaHome className="mr-3 text-blue-600" />
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Resumen general del sistema de gestión de Deportes Laboulaye
        </p>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaBox className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Productos</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Total en inventario</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ventas Hoy</p>
              <p className="text-2xl font-bold text-gray-900">$0</p>
              <p className="text-xs text-gray-500">Total del día</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FaTruck className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Compras</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Órdenes activas</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FaChartLine className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ingresos</p>
              <p className="text-2xl font-bold text-gray-900">$0</p>
              <p className="text-xs text-gray-500">Este mes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado del Sistema */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FaCheckCircle className="mr-2 text-green-500" />
              Estado del Sistema
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaCheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-sm text-gray-600">Autenticación</span>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Activo</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaCheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-sm text-gray-600">API de Productos</span>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Operativo</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaCheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-sm text-gray-600">Base de Datos</span>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Conectada</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaExclamationTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                <span className="text-sm text-gray-600">Integraciones AFIP</span>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pendiente</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaExclamationTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                <span className="text-sm text-gray-600">Tienda Nube</span>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pendiente</span>
            </div>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaChartLine className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">
                No hay actividad reciente para mostrar
              </p>
              <p className="text-gray-400 text-xs mt-2">
                La actividad aparecerá aquí cuando comiences a usar el sistema
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Acciones Rápidas</h3>
          <p className="text-sm text-gray-600 mt-1">
            Funcionalidades principales para gestionar tu negocio
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
              <FaBox className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-medium text-gray-900">Gestionar Productos</h4>
              <p className="text-sm text-gray-600 mt-1">Agregar, editar y organizar productos</p>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left">
              <FaShoppingCart className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="font-medium text-gray-900">Registrar Venta</h4>
              <p className="text-sm text-gray-600 mt-1">Procesar ventas rápidamente</p>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left">
              <FaTruck className="h-8 w-8 text-purple-600 mb-3" />
              <h4 className="font-medium text-gray-900">Orden de Compra</h4>
              <p className="text-sm text-gray-600 mt-1">Crear órdenes a proveedores</p>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-left">
              <FaChartLine className="h-8 w-8 text-orange-600 mb-3" />
              <h4 className="font-medium text-gray-900">Ver Reportes</h4>
              <p className="text-sm text-gray-600 mt-1">Análisis de ventas y inventario</p>
            </button>
          </div>
        </div>
      </div>

      {/* Información del Proyecto */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">DL</span>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-blue-900">
              ¡Bienvenido al Sistema de Gestión de Deportes Laboulaye!
            </h3>
            <p className="mt-2 text-blue-800">
              El sistema está configurado y listo para usar. Todas las funcionalidades de autenticación 
              y APIs de productos están operativas. Las demás secciones se irán activando progresivamente.
            </p>
            <div className="mt-4">
              <h4 className="font-medium text-blue-900 mb-2">Funcionalidades Activas:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Sistema de autenticación completo</li>
                <li>• APIs de productos (CRUD completo)</li>
                <li>• Layout responsivo con navegación</li>
                <li>• Base de datos configurada y funcionando</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}