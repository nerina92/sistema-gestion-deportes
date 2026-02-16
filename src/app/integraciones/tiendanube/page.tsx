'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TiendaNubeConfigPage() {
  const router = useRouter();
  const [storeId, setStoreId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Cargar configuración actual
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/integrations/tiendanube/config');
      const data = await res.json();

      if (data.configured) {
        setConfigured(true);
        setStoreId(data.storeId);
        setLastSync(data.lastSyncAt);
      }
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/integrations/tiendanube/test', {
        method: 'POST'
      });

      const data = await res.json();

      if (data.success) {
        setMessage('Conexión exitosa con Tienda Nube');
      } else {
        setError(data.error || 'Error al conectar');
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
      const res = await fetch('/api/integrations/tiendanube/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, accessToken })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Configuración guardada exitosamente');
        setConfigured(true);
        setTimeout(() => {
          router.push('/integraciones/tiendanube/sincronizar');
        }, 2000);
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
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Integración con Tienda Nube</h1>

      {configured && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">
            Conectado a Tienda Nube
          </p>
          {lastSync && (
            <p className="text-sm text-green-600 mt-1">
              Última sincronización: {new Date(lastSync).toLocaleString('es-AR')}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Store ID
          </label>
          <input
            type="text"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            placeholder="12345"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Encontralo en tu panel de Tienda Nube: Configuración → API
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Access Token
          </label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Token de autenticación OAuth 2.0 de tu aplicación
          </p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || !storeId || !accessToken}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {testing ? 'Probando...' : 'Probar Conexión'}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>

      {configured && (
        <div className="mt-6">
          <button
            onClick={() => router.push('/integraciones/tiendanube/sincronizar')}
            className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded"
          >
            Ir a Sincronización
          </button>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-bold mb-2">Como obtener las credenciales:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Ingresa a tu panel de Tienda Nube</li>
          <li>Ve a Configuración → Aplicaciones → API</li>
          <li>Crea una nueva aplicación (si no tienes una)</li>
          <li>Copia el Store ID y el Access Token</li>
          <li>Pégalos aquí y guarda</li>
        </ol>
      </div>
    </div>
  );
}
