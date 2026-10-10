'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, History, RefreshCw } from 'lucide-react';
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader } from '@/components/ui';
import { formatDateTime } from '@/lib/format';

interface SyncLog {
  id: string;
  action: string;
  status: string;
  details: string | null;
  errorMessage: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  export: 'Envío de stock',
  import: 'Importación',
  webhook: 'Webhook',
};

type Notice = { type: 'ok' | 'error'; text: string; details?: string[] };

export default function SyncPage() {
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [createMissing, setCreateMissing] = useState(false);

  const loadLogs = useCallback(async () => {
    const res = await fetch('/api/integrations/tiendanube/logs').catch(() => null);
    if (res?.ok) setLogs((await res.json()).logs || []);
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleExport = async () => {
    setBusy('export');
    setNotice(null);
    try {
      const res = await fetch('/api/integrations/tiendanube/sync/export', { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'No se pudo enviar el stock');
      setNotice({
        type: data.errors > 0 ? 'error' : 'ok',
        text: `Stock enviado: ${data.exported} variantes actualizadas${data.errors ? `, ${data.errors} con error` : ''}.`,
        details: data.errorDetails,
      });
    } catch (e) {
      setNotice({ type: 'error', text: e instanceof Error ? e.message : 'No se pudo enviar el stock' });
    } finally {
      setBusy(null);
      loadLogs();
    }
  };

  const handleImport = async () => {
    setBusy('import');
    setNotice(null);
    try {
      const res = await fetch('/api/integrations/tiendanube/sync/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createMissing }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'No se pudo importar');
      const parts = [
        `${data.linked} variantes vinculadas por SKU`,
        data.alreadyLinked ? `${data.alreadyLinked} ya estaban vinculadas` : null,
        data.created ? `${data.created} creadas en el sistema` : null,
        data.skipped ? `${data.skipped} sin coincidencia (activá "crear faltantes" para traerlas)` : null,
      ].filter(Boolean);
      setNotice({
        type: data.errors?.length ? 'error' : 'ok',
        text: `Se revisaron ${data.products} productos de Tienda Nube: ${parts.join(', ')}.`,
        details: data.errors,
      });
    } catch (e) {
      setNotice({ type: 'error', text: e instanceof Error ? e.message : 'No se pudo importar' });
    } finally {
      setBusy(null);
      loadLogs();
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/integraciones/tiendanube" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
        <ArrowLeft className="size-4" /> Tienda Nube
      </Link>
      <PageHeader
        icon={RefreshCw}
        title="Sincronización con Tienda Nube"
        description="Vinculá tus productos por SKU y mantené el stock de la tienda online al día."
      />

      {notice && (
        <div
          className={`mb-6 rounded-lg border p-4 text-sm ${
            notice.type === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          <p>{notice.text}</p>
          {notice.details && notice.details.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs">
              {notice.details.slice(0, 8).map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="flex flex-col p-5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <ArrowDownToLine className="size-5" />
          </span>
          <h2 className="mt-4 text-sm font-semibold text-zinc-900">Traer productos de Tienda Nube</h2>
          <p className="mt-1 flex-1 text-sm text-zinc-500">
            Vincula cada variante del sistema con la de Tienda Nube que tiene el mismo SKU. Hacelo una vez al conectar la tienda y
            cada vez que cargues productos nuevos allá.
          </p>
          <label className="mt-4 flex items-start gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
              checked={createMissing}
              onChange={(e) => setCreateMissing(e.target.checked)}
            />
            <span>
              Crear en el sistema los productos que solo existen en Tienda Nube
              <span className="block text-xs text-zinc-500">Su precio se toma como precio contado y el costo se estima con el margen por defecto.</span>
            </span>
          </label>
          <Button className="mt-4 self-start" onClick={handleImport} loading={busy === 'import'} disabled={busy !== null}>
            Traer y vincular
          </Button>
        </Card>

        <Card className="flex flex-col p-5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <ArrowUpFromLine className="size-5" />
          </span>
          <h2 className="mt-4 text-sm font-semibold text-zinc-900">Enviar stock a Tienda Nube</h2>
          <p className="mt-1 flex-1 text-sm text-zinc-500">
            Actualiza en Tienda Nube el stock de todas las variantes vinculadas con el stock actual del sistema. Las variantes sin
            vincular no se tocan.
          </p>
          <Button className="mt-4 self-start" onClick={handleExport} loading={busy === 'export'} disabled={busy !== null}>
            Enviar stock
          </Button>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader title="Historial" description="Últimas sincronizaciones" />
        {logs.length === 0 ? (
          <EmptyState icon={History} title="Todavía no hay sincronizaciones" />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Acción</th>
                  <th>Estado</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td>{ACTION_LABELS[log.action] ?? log.action}</td>
                    <td>
                      <Badge tone={log.status === 'success' ? 'success' : 'danger'} dot>
                        {log.status === 'success' ? 'Correcta' : 'Con errores'}
                      </Badge>
                    </td>
                    <td className="text-zinc-600" title={log.errorMessage ?? undefined}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
