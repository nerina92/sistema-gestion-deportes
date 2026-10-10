import { FaChartBar, FaChartLine, FaChartPie, FaExclamationTriangle } from 'react-icons/fa';

export default function ReportesPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header de la página */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaChartBar className="mr-3 text-gray-400" />
              Reportes
              <span className="ml-3 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Próximamente
              </span>
            </h1>
            <p className="mt-2 text-gray-600">
              Análisis de ventas, inventario y rendimiento del negocio
            </p>
          </div>
        </div>
      </div>

      {/* Aviso de funcionalidad no disponible */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <div className="flex items-center">
          <FaExclamationTriangle className="h-6 w-6 text-yellow-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">
              Funcionalidad en Desarrollo
            </h3>
            <p className="mt-1 text-yellow-700">
              El módulo de reportes estará disponible en una próxima actualización. 
              Se está desarrollando un sistema completo de análisis y visualización de datos.
            </p>
          </div>
        </div>
      </div>

      {/* Preview de reportes futuros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Reporte de Ventas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 opacity-60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FaChartLine className="mr-2 text-green-500" />
              Ventas
            </h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Próximamente</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Análisis detallado de ventas por período, producto y método de pago.
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Ventas diarias, semanales, mensuales</li>
            <li>• Productos más vendidos</li>
            <li>• Análisis de rentabilidad</li>
            <li>• Comparativas de períodos</li>
          </ul>
        </div>

        {/* Reporte de Inventario */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 opacity-60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FaChartBar className="mr-2 text-blue-500" />
              Inventario
            </h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Próximamente</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Control y análisis del estado del inventario y rotación de productos.
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Stock actual por producto</li>
            <li>• Productos con stock bajo</li>
            <li>• Rotación de inventario</li>
            <li>• Valorización de stock</li>
          </ul>
        </div>

        {/* Reporte Financiero */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 opacity-60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FaChartPie className="mr-2 text-purple-500" />
              Financiero
            </h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Próximamente</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Resumen financiero del negocio con ingresos, gastos y ganancias.
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Ingresos vs gastos</li>
            <li>• Margen de ganancia</li>
            <li>• Flujo de caja</li>
            <li>• ROI por producto</li>
          </ul>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaChartBar className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Sistema de Reportes
            </h3>
            <p className="text-gray-600 mb-6">
              El sistema de reportes incluirá dashboards interactivos, exportación a Excel/PDF 
              y programación automática de reportes por email.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-800">
                <strong>Características planificadas:</strong><br />
                • Dashboards interactivos con gráficos<br />
                • Filtros avanzados por fecha y categoría<br />
                • Exportación a Excel y PDF<br />
                • Reportes programados automáticos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}