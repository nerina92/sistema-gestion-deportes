'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileSpreadsheet,
  ArrowLeft,
  Check,
  X,
  AlertCircle,
  Loader2,
  FileUp,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

// Tipos para los datos de preview
interface PreviewRow {
  rowIndex: number;
  description: string;
  brand: string;
  sku: string;
  color: string;
  originalSize: string;
  selectedSize: string;
  priceCash: number;
  priceDebit: number;
  priceFinanced: number;
  costPrice: number;
  sold: string;
  isValid: boolean;
  validationErrors: string[];
}

interface ImportLog {
  productsCreated: number;
  variantsCreated: number;
  errors: string[];
  warnings: string[];
  skippedRows: number;
  totalErrors: number;
  totalWarnings: number;
}

// Opciones de talle disponibles
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Único'];

export default function ImportarExcelPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{success: boolean; message: string; log?: ImportLog} | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');

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
  };

  // Función para procesar el Excel y generar preview
  const handlePreview = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Leer el archivo usando la librería xlsx en el cliente
      const arrayBuffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // Verificar que existe la hoja "STOCK INICIAL"
      if (!workbook.SheetNames.includes('STOCK INICIAL')) {
        setError('No se encontró la hoja "STOCK INICIAL" en el archivo Excel');
        setLoading(false);
        return;
      }

      const worksheet = workbook.Sheets['STOCK INICIAL'];
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: false
      }) as (string | number | undefined)[][];

      if (data.length < 2) {
        setError('La hoja Excel está vacía o no contiene datos');
        setLoading(false);
        return;
      }

      // Encontrar columnas
      const headers = data[0] as string[];
      const normalizeText = (text: string) => text?.toString().trim().toLowerCase() || '';

      const descriptionCol = headers.findIndex(h =>
        h && (normalizeText(h).includes('descripcion') || normalizeText(h) === 'descripción')
      );
      const brandCol = headers.findIndex(h => h && normalizeText(h).includes('marca'));
      const skuCol = headers.findIndex(h => h && normalizeText(h).includes('art'));
      const sizeCol = headers.findIndex(h => h && normalizeText(h).includes('talle'));
      const colorCol = headers.findIndex(h => h && normalizeText(h).includes('color'));
      const soldCol = headers.findIndex(h => h && normalizeText(h).includes('vendido'));

      if (descriptionCol === -1 || skuCol === -1) {
        setError('No se encontraron las columnas requeridas (Descripción, Art/SKU)');
        setLoading(false);
        return;
      }

      // Procesar filas para preview
      const previewRows: PreviewRow[] = [];

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        const description = row[descriptionCol]?.toString().trim() || '';
        const brand = brandCol !== -1 ? row[brandCol]?.toString().trim() || '' : '';
        const sku = row[skuCol]?.toString().trim() || '';
        const originalSize = sizeCol !== -1 ? row[sizeCol]?.toString().trim() || '' : '';
        const color = colorCol !== -1 ? row[colorCol]?.toString().trim() || '' : '';
        const sold = soldCol !== -1 ? row[soldCol]?.toString().trim().toLowerCase() || '' : '';

        // Obtener precios (columnas G=6, H=7, I=8, L=11)
        const parseDecimal = (val: string | number | undefined): number => {
          if (!val) return 0;
          const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : Number(val);
          return isNaN(num) ? 0 : num;
        };

        const priceCash = parseDecimal(row[6]);
        const priceDebit = parseDecimal(row[7]);
        const priceFinanced = parseDecimal(row[8]);
        const costPrice = parseDecimal(row[11]);

        // Validar fila
        const validationErrors: string[] = [];
        if (!description) validationErrors.push('Sin descripción');
        if (!sku) validationErrors.push('Sin SKU');
        if (sold === 'si' || sold === 'sí' || sold === 'yes') validationErrors.push('Ya vendido');

        // Intentar determinar talle automáticamente
        let selectedSize = 'Único';
        const sizeUpper = originalSize.toUpperCase();
        if (SIZE_OPTIONS.includes(sizeUpper)) {
          selectedSize = sizeUpper;
        } else if (originalSize.match(/^\d+$/)) {
          // Si es un número, dejarlo como Único
          selectedSize = 'Único';
        }

        previewRows.push({
          rowIndex: i + 1,
          description,
          brand,
          sku,
          color,
          originalSize,
          selectedSize,
          priceCash,
          priceDebit,
          priceFinanced,
          costPrice,
          sold,
          isValid: validationErrors.length === 0 || (validationErrors.length === 1 && validationErrors[0] === 'Ya vendido'),
          validationErrors
        });
      }

      setPreviewData(previewRows);
      setStep('preview');
    } catch (err) {
      setError(`Error al procesar el archivo: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar el talle de una fila
  const updateRowSize = (rowIndex: number, newSize: string) => {
    setPreviewData(prev => prev.map(row =>
      row.rowIndex === rowIndex ? { ...row, selectedSize: newSize } : row
    ));
  };

  // Función para ejecutar la importación
  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

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
    setPreviewData([]);
    setError(null);
    setImportResult(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Estadísticas del preview
  const validRows = previewData.filter(r => r.isValid && !r.validationErrors.includes('Ya vendido')).length;
  const soldRows = previewData.filter(r => r.validationErrors.includes('Ya vendido')).length;
  const invalidRows = previewData.filter(r => !r.isValid && !r.validationErrors.includes('Ya vendido')).length;

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
                Importa tu inventario desde el archivo Excel existente
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
            <span className="ml-2 font-medium">Vista previa</span>
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
                    <li>Hoja llamada &quot;STOCK INICIAL&quot;</li>
                    <li>Columnas: Descripción, Marca, Art (SKU), Talle, Color</li>
                    <li>Columna G: Precio contado</li>
                    <li>Columna H: Precio débito</li>
                    <li>Columna I: Precio financiado</li>
                    <li>Columna L: Costo actualizado</li>
                    <li>Columna &quot;Vendido?&quot; para filtrar productos vendidos</li>
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
                    Procesando...
                  </>
                ) : (
                  <>
                    Ver Vista Previa
                    <Upload className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paso 2: Preview */}
      {step === 'preview' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Estadísticas */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Vista Previa de Datos</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total de filas</p>
                <p className="text-2xl font-bold text-gray-900">{previewData.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-700">Válidas para importar</p>
                <p className="text-2xl font-bold text-green-600">{validRows}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-700">Ya vendidos (se omiten)</p>
                <p className="text-2xl font-bold text-yellow-600">{soldRows}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-700">Inválidas</p>
                <p className="text-2xl font-bold text-red-600">{invalidRows}</p>
              </div>
            </div>
          </div>

          {/* Tabla de preview */}
          <div className="overflow-x-auto" style={{ maxHeight: '500px' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fila
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marca
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Talle Original
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Talle a Importar
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P. Contado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.slice(0, 50).map((row) => (
                  <tr
                    key={row.rowIndex}
                    className={`${
                      row.validationErrors.includes('Ya vendido')
                        ? 'bg-yellow-50 opacity-60'
                        : !row.isValid
                          ? 'bg-red-50'
                          : ''
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {row.rowIndex}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                      {row.description || <span className="text-red-500 italic">Sin descripción</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {row.brand || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {row.sku || <span className="text-red-500 italic">Sin SKU</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {row.color || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {row.originalSize || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={row.selectedSize}
                        onChange={(e) => updateRowSize(row.rowIndex, e.target.value)}
                        disabled={row.validationErrors.includes('Ya vendido')}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      >
                        {SIZE_OPTIONS.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      ${row.priceCash.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {row.validationErrors.includes('Ya vendido') ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Vendido
                        </span>
                      ) : row.isValid ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Válido
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800" title={row.validationErrors.join(', ')}>
                          <X className="h-3 w-3 mr-1" />
                          Inválido
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 50 && (
              <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">
                Mostrando primeras 50 filas de {previewData.length} totales
              </div>
            )}
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
              disabled={importing || validRows === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Confirmar Importación ({validRows} productos)
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
