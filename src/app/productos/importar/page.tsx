'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileSpreadsheet,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  FileUp,
  CheckCircle,
  AlertTriangle,
  Info,
  Trash2
} from 'lucide-react';

// Hojas válidas para importar
const VALID_SHEETS = ['Hombre', 'Mujer', 'Calzado', 'Paletas', 'Accesorios', 'Niños'];

interface SheetInfo {
  name: string;
  totalRows: number;
  validRows: number;
  soldRows: number;
  selected: boolean;
}

interface ImportLog {
  productsCreated: number;
  variantsCreated: number;
  errors: string[];
  warnings: string[];
  skippedRows: number;
  totalErrors: number;
  totalWarnings: number;
  sheetStats?: { [sheet: string]: { rows: number; imported: number; skipped: number } };
}

export default function ImportarExcelPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{success: boolean; message: string; log?: ImportLog} | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [clearDbBeforeImport, setClearDbBeforeImport] = useState(false);

  // Función para manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar formato
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setError('El archivo debe ser formato Excel (.xlsx o .xls)');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setImportResult(null);
    setSheets([]);
  };

  // Función para procesar el Excel y detectar hojas
  const handlePreview = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Leer el archivo usando la librería xlsx en el cliente
      const arrayBuffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // Detectar hojas válidas
      const detectedSheets: SheetInfo[] = [];

      for (const sheetName of VALID_SHEETS) {
        if (!workbook.SheetNames.includes(sheetName)) continue;

        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: false
        }) as (string | number | undefined)[][];

        if (data.length < 2) continue;

        // Encontrar columna "Vendido"
        const headers = data[0] as string[];
        const normalizeText = (text: string) => text?.toString().trim().toLowerCase() || '';
        const soldCol = headers.findIndex(h => h && normalizeText(h).includes('vendido'));

        let validRows = 0;
        let soldRows = 0;

        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;

          const soldValue = soldCol !== -1 ? normalizeText(row[soldCol]?.toString() || '') : '';

          if (soldValue === 'si' || soldValue === 'sí' || soldValue === 'yes') {
            soldRows++;
          } else if (soldValue && soldValue !== 'no' && soldValue !== '') {
            soldRows++; // "devuelta", "retirado", etc.
          } else {
            validRows++;
          }
        }

        detectedSheets.push({
          name: sheetName,
          totalRows: data.length - 1,
          validRows,
          soldRows,
          selected: true // Por defecto todas seleccionadas
        });
      }

      if (detectedSheets.length === 0) {
        setError(`No se encontraron hojas válidas. El archivo debe tener alguna de estas hojas: ${VALID_SHEETS.join(', ')}`);
        setLoading(false);
        return;
      }

      setSheets(detectedSheets);
      setStep('preview');
    } catch (err) {
      setError(`Error al procesar el archivo: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para toggle de hoja
  const toggleSheet = (sheetName: string) => {
    setSheets(prev => prev.map(sheet =>
      sheet.name === sheetName ? { ...sheet, selected: !sheet.selected } : sheet
    ));
  };

  // Función para seleccionar/deseleccionar todas
  const toggleAllSheets = (selected: boolean) => {
    setSheets(prev => prev.map(sheet => ({ ...sheet, selected })));
  };

  // Función para limpiar la base de datos
  const handleClearDb = async () => {
    const confirmed = window.confirm(
      '¿Está seguro de eliminar TODOS los productos de la base de datos?\n\n' +
      'Esta acción también eliminará:\n' +
      '- Todas las variantes\n' +
      '- Todo el historial de ventas\n' +
      '- Todo el historial de compras\n\n' +
      'Esta acción NO se puede deshacer.'
    );

    if (!confirmed) return;

    setClearing(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/clear-products', {
        method: 'POST',
        headers: {
          'X-Confirm': 'DELETE_ALL_PRODUCTS'
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`Base de datos limpiada:\n- ${result.deleted.products} productos eliminados\n- ${result.deleted.variants} variantes eliminadas\n- ${result.deleted.sales} ventas eliminadas\n- ${result.deleted.purchases} compras eliminadas`);
      } else {
        setError(result.error || 'Error al limpiar la base de datos');
      }
    } catch (err) {
      setError(`Error de conexión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setClearing(false);
    }
  };

  // Función para ejecutar la importación
  const handleImport = async () => {
    if (!file) return;

    const selectedSheets = sheets.filter(s => s.selected).map(s => s.name);
    if (selectedSheets.length === 0) {
      setError('Debe seleccionar al menos una hoja para importar');
      return;
    }

    // Si se marcó limpiar DB primero
    if (clearDbBeforeImport) {
      const confirmed = window.confirm(
        '¿Confirma eliminar todos los productos antes de importar?\n\n' +
        'Esta acción eliminará todo el inventario actual.'
      );

      if (!confirmed) return;

      setClearing(true);
      try {
        const clearResponse = await fetch('/api/admin/clear-products', {
          method: 'POST',
          headers: {
            'X-Confirm': 'DELETE_ALL_PRODUCTS'
          }
        });

        if (!clearResponse.ok) {
          const clearResult = await clearResponse.json();
          setError(`Error al limpiar DB: ${clearResult.error}`);
          setClearing(false);
          return;
        }
      } catch (err) {
        setError(`Error de conexión al limpiar: ${err instanceof Error ? err.message : 'Error'}`);
        setClearing(false);
        return;
      }
      setClearing(false);
    }

    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sheets', selectedSheets.join(','));

      const response = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setImportResult({
          success: true,
          message: result.message,
          log: result.log
        });
        setStep('result');
      } else {
        setImportResult({
          success: false,
          message: result.error || 'Error desconocido durante la importación',
          log: result.log
        });
        setStep('result');
      }
    } catch (err) {
      setError(`Error al importar: ${err instanceof Error ? err.message : 'Error de conexión'}`);
    } finally {
      setImporting(false);
    }
  };

  // Función para volver al inicio
  const resetImport = () => {
    setFile(null);
    setSheets([]);
    setError(null);
    setImportResult(null);
    setStep('upload');
    setClearDbBeforeImport(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Estadísticas totales
  const selectedSheets = sheets.filter(s => s.selected);
  const totalValidRows = selectedSheets.reduce((sum, s) => sum + s.validRows, 0);
  const totalSoldRows = selectedSheets.reduce((sum, s) => sum + s.soldRows, 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/productos')}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileSpreadsheet className="mr-3 text-green-600" />
                Importar desde Excel
              </h1>
              <p className="mt-2 text-gray-600">
                Importa tu inventario desde el archivo Excel
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de pasos */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center ${step === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'upload' ? 'border-blue-600 bg-blue-50' : 'border-green-600 bg-green-50'}`}>
              {step !== 'upload' ? <Check className="h-4 w-4 text-green-600" /> : '1'}
            </div>
            <span className="ml-2 font-medium">Subir archivo</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center ${step === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'preview' ? 'border-blue-600 bg-blue-50' : step === 'result' ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
              {step === 'result' ? <Check className="h-4 w-4 text-green-600" /> : '2'}
            </div>
            <span className="ml-2 font-medium">Seleccionar hojas</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center ${step === 'result' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'result' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
              3
            </div>
            <span className="ml-2 font-medium">Resultado</span>
          </div>
        </div>
      </div>

      {/* Error global */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Paso 1: Upload */}
      {step === 'upload' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="max-w-xl mx-auto">
            {/* Zona de drop */}
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetImport();
                    }}
                    className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Cambiar archivo
                  </button>
                </div>
              ) : (
                <div>
                  <FileUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">
                    Haz clic para seleccionar un archivo
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    o arrastra y suelta aquí
                  </p>
                  <p className="text-xs text-gray-400 mt-4">
                    Solo archivos .xlsx o .xls
                  </p>
                </div>
              )}
            </div>

            {/* Información del formato esperado */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">Formato esperado del Excel:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Hojas: <strong>Hombre, Mujer, Calzado, Paletas, Accesorios, Niños</strong></li>
                    <li>Columnas: Descripcion, Marca, Art (SKU), Talle, Color</li>
                    <li>Columna Cdo: Precio contado</li>
                    <li>Columna Débito: Precio débito</li>
                    <li>Columna Financiado: Precio financiado</li>
                    <li>Columna Costo: Costo del producto</li>
                    <li>Columna Vendido?: Solo importa filas con &quot;No&quot; o vacío</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Botón de preview */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handlePreview}
                disabled={!file || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    Analizar Archivo
                    <Upload className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paso 2: Selección de hojas */}
      {step === 'preview' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Estadísticas totales */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Hojas Detectadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-700">Hojas seleccionadas</p>
                <p className="text-2xl font-bold text-blue-600">{selectedSheets.length} de {sheets.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-700">Total a importar</p>
                <p className="text-2xl font-bold text-green-600">{totalValidRows.toLocaleString()}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-700">Vendidos (se omiten)</p>
                <p className="text-2xl font-bold text-yellow-600">{totalSoldRows.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Lista de hojas */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Selecciona las hojas a importar:</h3>
              <div className="space-x-2">
                <button
                  onClick={() => toggleAllSheets(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Seleccionar todas
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => toggleAllSheets(false)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Deseleccionar todas
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sheets.map((sheet) => (
                <div
                  key={sheet.name}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    sheet.selected
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleSheet(sheet.name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{sheet.name}</h4>
                    <input
                      type="checkbox"
                      checked={sheet.selected}
                      onChange={() => toggleSheet(sheet.name)}
                      className="h-5 w-5 text-blue-600 rounded"
                    />
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="text-gray-600">
                      Total: <span className="font-medium">{sheet.totalRows.toLocaleString()}</span> filas
                    </p>
                    <p className="text-green-600">
                      A importar: <span className="font-medium">{sheet.validRows.toLocaleString()}</span>
                    </p>
                    <p className="text-yellow-600">
                      Vendidos: <span className="font-medium">{sheet.soldRows.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Opción de limpiar DB */}
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="clearDb"
                  checked={clearDbBeforeImport}
                  onChange={(e) => setClearDbBeforeImport(e.target.checked)}
                  className="h-5 w-5 text-red-600 rounded mt-0.5"
                />
                <label htmlFor="clearDb" className="ml-3">
                  <span className="font-medium text-red-800">Limpiar base de datos antes de importar</span>
                  <p className="text-sm text-red-600 mt-1">
                    Elimina todos los productos, variantes, ventas y compras existentes antes de importar.
                    Use esta opción si desea reemplazar completamente el inventario.
                  </p>
                </label>
              </div>
            </div>

            {/* Botón manual de limpiar DB */}
            <div className="mt-4 flex justify-start">
              <button
                onClick={handleClearDb}
                disabled={clearing}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors flex items-center text-sm"
              >
                {clearing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Limpiando...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpiar DB ahora
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="p-6 border-t border-gray-200 flex justify-between">
            <button
              onClick={resetImport}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Volver
            </button>
            <button
              onClick={handleImport}
              disabled={importing || clearing || selectedSheets.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {importing || clearing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {clearing ? 'Limpiando...' : 'Importando...'}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Importar ({totalValidRows.toLocaleString()} productos)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Resultado */}
      {step === 'result' && importResult && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="max-w-2xl mx-auto text-center">
            {importResult.success ? (
              <>
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Importación Exitosa
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  {importResult.message}
                </p>
              </>
            ) : (
              <>
                <AlertTriangle className="h-20 w-20 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Error en la Importación
                </h2>
                <p className="text-lg text-red-600 mb-6">
                  {importResult.message}
                </p>
              </>
            )}

            {/* Log detallado */}
            {importResult.log && (
              <div className="mt-6 p-6 bg-gray-50 rounded-lg text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Importación</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Productos creados</p>
                    <p className="text-xl font-bold text-green-600">{importResult.log.productsCreated}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Variantes creadas</p>
                    <p className="text-xl font-bold text-green-600">{importResult.log.variantsCreated}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Filas omitidas</p>
                    <p className="text-xl font-bold text-yellow-600">{importResult.log.skippedRows}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Errores</p>
                    <p className="text-xl font-bold text-red-600">{importResult.log.totalErrors || 0}</p>
                  </div>
                </div>

                {/* Estadísticas por hoja */}
                {importResult.log.sheetStats && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Por hoja:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(importResult.log.sheetStats).map(([sheet, stats]) => (
                        <div key={sheet} className="bg-white p-2 rounded border text-sm">
                          <p className="font-medium text-gray-900">{sheet}</p>
                          <p className="text-green-600">Importados: {stats.imported}</p>
                          <p className="text-yellow-600">Omitidos: {stats.skipped}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errores */}
                {importResult.log.errors && importResult.log.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-red-700 mb-2">Errores:</p>
                    <ul className="text-sm text-red-600 list-disc list-inside max-h-32 overflow-y-auto">
                      {importResult.log.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {importResult.log.warnings && importResult.log.warnings.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-yellow-700 mb-2">Advertencias:</p>
                    <ul className="text-sm text-yellow-600 list-disc list-inside max-h-32 overflow-y-auto">
                      {importResult.log.warnings.map((warn, i) => (
                        <li key={i}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Botones */}
            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={resetImport}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Nueva Importación
              </button>
              <button
                onClick={() => router.push('/productos')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Ver Productos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
