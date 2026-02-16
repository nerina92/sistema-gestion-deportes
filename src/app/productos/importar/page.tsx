'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaFileExcel, FaUpload, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

export default function ImportarProductosPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError('');
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Error al importar el archivo');
        if (data.log) {
          setResult(data);
        }
      }
    } catch (err: any) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FaFileExcel className="mr-3 text-green-600" />
          Importar Productos desde Excel
        </h1>
        <p className="mt-2 text-gray-600">
          Importa tu inventario completo desde un archivo Excel
        </p>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-blue-900 flex items-center mb-3">
          <FaInfoCircle className="mr-2" />
          Formato del Archivo
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>El archivo Excel debe tener estas hojas:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Hombre</strong> → Se importa como categoría "Hombres"</li>
            <li><strong>Mujer</strong> → Se importa como categoría "Mujeres"</li>
            <li><strong>Calzado</strong> → Se importa como categoría "Calzado"</li>
            <li><strong>Paletas</strong> → Se importa como categoría "Paletas"</li>
            <li><strong>Accesorios</strong> → Se importa como categoría "Accesorios"</li>
            <li><strong>Niños</strong> → Se importa como categoría "Niños"</li>
          </ul>
          <p className="mt-3"><strong>Estructura de columnas esperada:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Columna B: Descripción (nombre del producto)</li>
            <li>Columna C: Marca</li>
            <li>Columna D: ART (SKU/código único)</li>
            <li>Columna E: Talle</li>
            <li>Columna F: Color</li>
            <li>Columna G: Precio Contado (Cdo)</li>
            <li>Columna I: Precio Débito</li>
            <li>Columna J: Precio Financiado</li>
            <li>Columna M: Costo actualizado</li>
            <li>Columna Q: Vendido? (se omiten los marcados como "Si")</li>
          </ul>
          <p className="mt-3"><strong>Lógica de importación:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Solo importa productos donde "Vendido?" = "No" o esté vacío</li>
            <li>Agrupa productos por nombre + marca</li>
            <li>Cada fila del Excel = 1 variante del producto</li>
            <li>Categoría asignada según la hoja de origen</li>
          </ul>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Seleccionar Archivo Excel
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor-pointer"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Archivo seleccionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Importando...
            </>
          ) : (
            <>
              <FaUpload className="mr-2" />
              Importar Productos
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-600 mr-3" />
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && result.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <FaCheckCircle className="text-green-600 text-2xl mr-3" />
            <div>
              <h3 className="text-green-800 font-bold text-lg">¡Importación Exitosa!</h3>
              <p className="text-green-700">{result.message}</p>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white rounded p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{result.log?.productsCreated || 0}</p>
              <p className="text-sm text-gray-600">Productos Creados</p>
            </div>
            <div className="bg-white rounded p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{result.log?.variantsCreated || 0}</p>
              <p className="text-sm text-gray-600">Variantes Creadas</p>
            </div>
            <div className="bg-white rounded p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{result.log?.skippedRows || 0}</p>
              <p className="text-sm text-gray-600">Filas Omitidas</p>
            </div>
            <div className="bg-white rounded p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{result.log?.totalErrors || 0}</p>
              <p className="text-sm text-gray-600">Errores</p>
            </div>
          </div>

          {/* Warnings */}
          {result.log?.warnings && result.log.warnings.length > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
              <h4 className="font-medium text-yellow-800 mb-2">Advertencias:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {result.log.warnings.map((warning: string, index: number) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Botón para ver productos */}
          <div className="mt-6">
            <button
              onClick={() => router.push('/productos')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg"
            >
              Ver Productos Importados
            </button>
          </div>
        </div>
      )}

      {/* Error Result with Log */}
      {result && !result.success && result.log && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-bold text-lg mb-4">Detalles del Error</h3>

          {result.log.errors && result.log.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-red-700 mb-2">Errores encontrados:</h4>
              <ul className="text-sm text-red-600 space-y-1 bg-white rounded p-3 max-h-60 overflow-y-auto">
                {result.log.errors.map((err: string, index: number) => (
                  <li key={index}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{result.log.productsCreated || 0}</p>
              <p className="text-sm text-gray-600">Productos Creados</p>
            </div>
            <div className="bg-white rounded p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{result.log.variantsCreated || 0}</p>
              <p className="text-sm text-gray-600">Variantes Creadas</p>
            </div>
          </div>
        </div>
      )}

      {/* Documentación */}
      <div className="mt-8 bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Ejemplo de Estructura (Hoja "Hombre")</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">B: Descripción</th>
                <th className="px-3 py-2 text-left">C: Marca</th>
                <th className="px-3 py-2 text-left">D: ART</th>
                <th className="px-3 py-2 text-left">E: Talle</th>
                <th className="px-3 py-2 text-left">F: Color</th>
                <th className="px-3 py-2 text-left">G: Cdo</th>
                <th className="px-3 py-2 text-left">I: Débito</th>
                <th className="px-3 py-2 text-left">J: Fin</th>
                <th className="px-3 py-2 text-left">Q: Vendido?</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-3 py-2">boxer</td>
                <td className="px-3 py-2">XY</td>
                <td className="px-3 py-2">1358</td>
                <td className="px-3 py-2">L</td>
                <td className="px-3 py-2">estamp</td>
                <td className="px-3 py-2">4200</td>
                <td className="px-3 py-2">4450</td>
                <td className="px-3 py-2">5050</td>
                <td className="px-3 py-2">No</td>
              </tr>
              <tr className="border-t">
                <td className="px-3 py-2">boxer</td>
                <td className="px-3 py-2">XY</td>
                <td className="px-3 py-2">1318</td>
                <td className="px-3 py-2">M</td>
                <td className="px-3 py-2">Estamp casette</td>
                <td className="px-3 py-2">5700</td>
                <td className="px-3 py-2">6050</td>
                <td className="px-3 py-2">6850</td>
                <td className="px-3 py-2">No</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          * Las dos filas anteriores se agruparán como un solo producto "boxer XY" con 2 variantes (L y M)
        </p>
        <p className="text-xs text-gray-500 mt-2">
          * Se importarán todas las hojas: Hombre, Mujer, Calzado, Paletas, Accesorios, Niños
        </p>
      </div>
    </div>
  );
}
