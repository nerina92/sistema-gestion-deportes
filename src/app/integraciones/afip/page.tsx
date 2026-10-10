'use client';

import { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

export default function AfipConfigPage() {
  const [cuit, setCuit] = useState('');
  const [puntoVenta, setPuntoVenta] = useState('');
  const [productionMode, setProductionMode] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [hasAccessToken, setHasAccessToken] = useState(false);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/integrations/afip/config');
      const data = await res.json();

      if (data.configured) {
        setConfigured(true);
        setCuit(data.cuit);
        setPuntoVenta(data.puntoVenta.toString());
        setProductionMode(data.productionMode);
        setHasAccessToken(data.hasAccessToken || false);
      }
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError('');
    setMessage('');
    setTestResult(null);

    try {
      const res = await fetch('/api/integrations/afip/test', {
        method: 'POST'
      });

      const data = await res.json();

      if (data.success) {
        setMessage(`Conexión exitosa con AFIP`);
        setTestResult(data);
      } else {
        setError(data.error || 'Error al conectar');
        setTestResult(data);
      }
    } catch (err: any) {
      setError('Error: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('cuit', cuit);
      formData.append('puntoVenta', puntoVenta);
      formData.append('productionMode', productionMode.toString());
      if (accessToken) formData.append('accessToken', accessToken);

      if (certFile) formData.append('cert', certFile);
      if (keyFile) formData.append('key', keyFile);

      const res = await fetch('/api/integrations/afip/config', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Configuración guardada exitosamente');
        setConfigured(true);
        setCertFile(null);
        setKeyFile(null);
      } else {
        setError(data.error || 'Error al guardar');
      }
    } catch (err: any) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración AFIP</h1>
        <p className="mt-2 text-gray-600">
          Configura la conexión con AFIP para emitir facturas electrónicas tipo C (Monotributo)
        </p>
      </div>

      {configured && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-600 mr-3 text-xl" />
            <div>
              <p className="text-green-800 font-semibold">AFIP Configurado</p>
              <p className="text-sm text-green-600 mt-1">
                Modo: {productionMode ? 'PRODUCCIÓN' : 'HOMOLOGACIÓN'}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            CUIT (11 dígitos)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={cuit}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 11) setCuit(value);
            }}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="20123456789"
            pattern="[0-9]{11}"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Ingresa el CUIT de tu empresa sin guiones
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Punto de Venta
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="number"
            value={puntoVenta}
            onChange={(e) => setPuntoVenta(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1"
            min="1"
            max="9999"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Número de punto de venta asignado por AFIP
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Access Token (Afip SDK)
            {!hasAccessToken && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={hasAccessToken ? '••••••••• (ya configurado)' : 'Pega tu access token aquí'}
          />
          <p className="text-xs text-gray-500 mt-1">
            Obtené tu token gratis en{' '}
            <a
              href="https://app.afipsdk.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              app.afipsdk.com
            </a>
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Certificado (.crt)
            {!configured && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="file"
            accept=".crt"
            onChange={(e) => setCertFile(e.target.files?.[0] || null)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={!configured}
          />
          {certFile && (
            <p className="text-xs text-green-600 mt-1">
              Archivo seleccionado: {certFile.name}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Clave Privada (.key)
            {!configured && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="file"
            accept=".key"
            onChange={(e) => setKeyFile(e.target.files?.[0] || null)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={!configured}
          />
          {keyFile && (
            <p className="text-xs text-green-600 mt-1">
              Archivo seleccionado: {keyFile.name}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={productionMode}
              onChange={(e) => setProductionMode(e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-semibold text-gray-700">Modo Producción</span>
              <p className="text-xs text-gray-500">
                Desmarcar para usar modo Homologación (testing)
              </p>
            </div>
          </label>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center">
            <FaCheckCircle className="mr-2" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
            <FaTimesCircle className="mr-2" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !configured}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {testing ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Probando...
              </>
            ) : (
              'Probar Conexión'
            )}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              'Guardar Configuración'
            )}
          </button>
        </div>
      </form>

      {testResult && testResult.success && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Resultado del Test</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">CUIT:</span>
              <span className="font-semibold">{testResult.config.cuit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Punto de Venta:</span>
              <span className="font-semibold">{testResult.config.puntoVenta}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Modo:</span>
              <span className="font-semibold">{testResult.config.mode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Último Comprobante:</span>
              <span className="font-semibold">{testResult.lastInvoiceNumber}</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-3 text-lg">
          Cómo obtener certificado AFIP
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Ingresa a <strong>AFIP</strong> con tu Clave Fiscal</li>
          <li>Ve a <strong>Administrador de Relaciones de Clave Fiscal</strong></li>
          <li>Selecciona <strong>Adherir Servicio</strong></li>
          <li>Busca y adhiere a <strong>Factura Electrónica (WSFE)</strong></li>
          <li>Genera un <strong>Certificado Digital</strong></li>
          <li>Descarga los archivos <strong>.crt</strong> y <strong>.key</strong></li>
          <li>Sube ambos archivos en este formulario</li>
        </ol>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800">
            <strong>Importante:</strong> Comienza siempre en modo Homologación para probar.
            Solo cambia a Producción cuando estés seguro de que todo funciona correctamente.
          </p>
        </div>
      </div>
    </div>
  );
}
