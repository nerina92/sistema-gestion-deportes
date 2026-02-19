'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaFileExcel, FaUpload, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaSpinner } from 'react-icons/fa';

interface SheetResult {
  sheetName: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  productsCreated: number;
  variantsCreated: number;
  skippedRows: number;
  errors: string[];
  warnings: string[];
}

export default function ImportarProductosPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [sheetResults, setSheetResults] = useState<SheetResult[]>([]);
  const [globalError, setGlobalError] = useState<string>('');
  const [done, setDone] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSheetResults([]);
      setGlobalError('');
      setDone(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setGlobalError('Por favor selecciona un archivo');
      return;
    }

    setImporting(true);
    setGlobalError('');
    setDone(false);

    try {
      // Paso 1: obtener lista de hojas del Excel
      const listFormData = new FormData();
      listFormData.append('file', file);
      listFormData.append('sheetName', '__list__');

      const listRes = await fetch('/api/import/excel', {
        method: 'POST',
        body: listFormData,
      });

      if (!listRes.ok) {
        const err = await listRes.json().catch(() => ({ error: 'Error leyendo el archivo' }));
        setGlobalError(err.error || 'No se pudo leer el archivo Excel');
        setImporting(false);
        return;
      }

      const listData = await listRes.json();
      const sheets: string[] = listData.sheets || [];

      if (sheets.length === 0) {
        setGlobalError('No se encontraron hojas válidas (Hombre, Mujer, Calzado, Paletas, Accesorios, Niños)');
        setImporting(false);
        return;
      }

      // Inicializar resultados por hoja
      const initialResults: SheetResult[] = sheets.map(s => ({
        sheetName: s,
        status: 'pending',
        productsCreated: 0,
        variantsCreated: 0,
        skippedRows: 0,
        errors: [],
        warnings: []
      }));
      setSheetResults(initialResults);

      // Paso 2: importar hoja por hoja
      for (let i = 0; i < sheets.length; i++) {
        const sheetName = sheets[i];

        // Marcar como procesando
        setSheetResults(prev => prev.map(r =>
          r.sheetName === sheetName ? { ...r, status: 'processing' } : r
        ));

        try {
          const sheetFormData = new FormData();
          sheetFormData.append('file', file);
          sheetFormData.append('sheetName', sheetName);

          const res = await fetch('/api/import/excel', {
            method: 'POST',
            body: sheetFormData,
          });

          const data = await res.json().catch(() => ({ success: false, error: 'Respuesta inválida del servidor' }));

          if (data.success) {
            setSheetResults(prev => prev.map(r =>
              r.sheetName === sheetName ? {
                ...r,
                status: 'done',
                productsCreated: data.log?.productsCreated || 0,
                variantsCreated: data.log?.variantsCreated || 0,
                skippedRows: data.log?.skippedRows || 0,
                errors: data.log?.errors || [],
                warnings: data.log?.warnings || []
              } : r
            ));
          } else {
            setSheetResults(prev => prev.map(r =>
              r.sheetName === sheetName ? {
                ...r,
                status: 'error',
                errors: [data.error || 'Error desconocido']
              } : r
            ));
          }
        } catch (err: any) {
          setSheetResults(prev => prev.map(r =>
            r.sheetName === sheetName ? {
              ...r,
              status: 'error',
              errors: [err.message || 'Error de conexión']
            } : r
          ));
        }
      }

      setDone(true);
    } catch (err: any) {
      setGlobalError('Error de conexión: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const totalProducstCreated = sheetResults.reduce((s, r) => s + r.productsCreated, 0);
  const totalVariantsCreated = sheetResults.reduce((s, r) => s + r.variantsCreated, 0);
  const totalSkipped = sheetResults.reduce((s, r) => s + r.skippedRows, 0);
  const totalErrors = sheetResults.reduce((s, r) => s + r.errors.length, 0);
  const hasAnyError = sheetResults.some(r => r.status === 'error');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FaFileExcel className="mr-3 text-green-600" />
          Importar Productos desde Excel
        </h1>
        <p className="mt-2 text-gray-600">
          Importa tu inventario completo desde un archivo Excel. Se procesa hoja por hoja.
        </p>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-blue-900 flex items-center mb-3">
          <FaInfoCircle className="mr-2" />
          Formato del Archivo
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Hojas que se importan:</strong> Hombre → Hombres, Mujer → Mujeres, Calzado, Paletas, Accesorios, Niños</p>
          <p><strong>Lógica:</strong> Cada fila = 1 variante. Se agrupan por Nombre + Marca. Vendidos/Devueltos se omiten. SKUs sin código se auto-generan.</p>
        </div>
      </div>

      {/* Upload */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Seleccionar Archivo Excel
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={importing}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor-pointer disabled:opacity-50"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Archivo: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {importing ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Importando... no cerres esta página
            </>
          ) : (
            <>
              <FaUpload className="mr-2" />
              Importar Productos
            </>
          )}
        </button>
      </div>

      {/* Error global */}
      {globalError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-600 mr-3 flex-shrink-0" />
            <p className="text-red-700 text-sm">{globalError}</p>
          </div>
        </div>
      )}

      {/* Progreso por hoja */}
      {sheetResults.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Progreso de importación</h3>
          <div className="space-y-3">
            {sheetResults.map((result) => (
              <div key={result.sheetName} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {result.status === 'pending' && (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3" />
                    )}
                    {result.status === 'processing' && (
                      <FaSpinner className="text-blue-500 animate-spin mr-3 w-5 h-5" />
                    )}
                    {result.status === 'done' && (
                      <FaCheckCircle className="text-green-500 mr-3 w-5 h-5" />
                    )}
                    {result.status === 'error' && (
                      <FaExclamationTriangle className="text-red-500 mr-3 w-5 h-5" />
                    )}
                    <span className="font-medium text-gray-900">Hoja: {result.sheetName}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    result.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                    result.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    result.status === 'done' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {result.status === 'pending' ? 'Esperando' :
                     result.status === 'processing' ? 'Procesando...' :
                     result.status === 'done' ? 'Completado' : 'Error'}
                  </span>
                </div>

                {result.status === 'done' && (
                  <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                    <div className="text-center bg-green-50 rounded p-2">
                      <p className="font-bold text-green-700">{result.productsCreated}</p>
                      <p className="text-gray-600 text-xs">Productos</p>
                    </div>
                    <div className="text-center bg-blue-50 rounded p-2">
                      <p className="font-bold text-blue-700">{result.variantsCreated}</p>
                      <p className="text-gray-600 text-xs">Variantes</p>
                    </div>
                    <div className="text-center bg-yellow-50 rounded p-2">
                      <p className="font-bold text-yellow-700">{result.skippedRows}</p>
                      <p className="text-gray-600 text-xs">Omitidas</p>
                    </div>
                  </div>
                )}

                {result.status === 'error' && result.errors.length > 0 && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 rounded p-2">
                    {result.errors[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen final */}
      {done && (
        <div className={`border rounded-lg p-6 mb-6 ${hasAnyError ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center mb-4">
            <FaCheckCircle className={`text-2xl mr-3 ${hasAnyError ? 'text-yellow-500' : 'text-green-600'}`} />
            <div>
              <h3 className={`font-bold text-lg ${hasAnyError ? 'text-yellow-800' : 'text-green-800'}`}>
                {hasAnyError ? 'Importación completada con algunos errores' : '¡Importación Exitosa!'}
              </h3>
              <p className={hasAnyError ? 'text-yellow-700' : 'text-green-700'}>
                {totalProducstCreated} productos y {totalVariantsCreated} variantes importadas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{totalProducstCreated}</p>
              <p className="text-sm text-gray-600">Productos</p>
            </div>
            <div className="bg-white rounded p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{totalVariantsCreated}</p>
              <p className="text-sm text-gray-600">Variantes</p>
            </div>
            <div className="bg-white rounded p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{totalSkipped}</p>
              <p className="text-sm text-gray-600">Omitidas</p>
            </div>
            <div className="bg-white rounded p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{totalErrors}</p>
              <p className="text-sm text-gray-600">Errores</p>
            </div>
          </div>

          <button
            onClick={() => router.push('/productos')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg"
          >
            Ver Productos Importados
          </button>
        </div>
      )}
    </div>
  );
}
