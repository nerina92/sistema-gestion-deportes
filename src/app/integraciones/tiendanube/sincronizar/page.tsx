'use client';

import { useState, useEffect } from 'react';

interface SyncLog {
  id: string;
  action: string;
  status: string;
  details: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export default function SyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/integrations/tiendanube/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error loading logs:', err);
    }
  };

  const handleExport = async () => {
    setSyncing(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/integrations/tiendanube/sync/export', {
        method: 'POST'
      });

      const data = await res.json();

      if (data.success) {
        setMessage(`Exportación completada: ${data.exported} productos actualizados`);
        if (data.errors > 0) {
          setError(`${data.errors} productos con errores. Detalles: ${data.errorDetails.join(', ')}`);
        }
        loadLogs();
      } else {
        setError('Error al exportar: ' + data.error);
      }
    } catch (err: any) {
      setError('Error: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Sincronización con Tienda Nube</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleExport}
          disabled={syncing}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded disabled:opacity-50"
        >
          {syncing ? 'Sincronizando...' : 'Exportar Stock a Tienda Nube'}
        </button>

        <button
          disabled={true}
          className="bg-gray-400 text-white font-bold py-4 px-6 rounded cursor-not-allowed"
          title="Próximamente"
        >
          Importar desde Tienda Nube (Próximamente)
        </button>
      </div>

      {message && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded p-6">
        <h2 className="text-xl font-bold mb-4">Historial de Sincronización</h2>

        {logs.length === 0 ? (
          <p className="text-gray-500">No hay sincronizaciones registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Fecha</th>
                  <th className="text-left py-2 px-2">Acción</th>
                  <th className="text-left py-2 px-2">Estado</th>
                  <th className="text-left py-2 px-2">Detalles</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="py-2 px-2 text-sm">
                      {new Date(log.createdAt).toLocaleString('es-AR')}
                    </td>
                    <td className="py-2 px-2">{log.action}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-sm">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-bold mb-2">Información:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Solo se sincronizarán productos que tengan mapeo con Tienda Nube</li>
          <li>El mapeo se configura en cada producto editando los campos de Tienda Nube</li>
          <li>La sincronización es manual - debes hacer clic en el botón para actualizar</li>
          <li>En el futuro se agregará sincronización automática bidireccional</li>
        </ul>
      </div>
    </div>
  );
}
