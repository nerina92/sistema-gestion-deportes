'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Check, Copy, ExternalLink, Save, Store } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, PageHeader } from '@/components/ui';
import { STORE_PRICE_TYPE_LABELS, STORE_PRICE_TYPES } from '@/lib/store';
import { DEFAULT_SETTINGS, type BusinessSettings } from '@/lib/settings-defaults';
import { invalidateBusinessSettings } from '@/lib/use-business-settings';

type StoreSettings = Pick<
  BusinessSettings,
  | 'storeEnabled'
  | 'storeWhatsapp'
  | 'storePriceType'
  | 'storePickup'
  | 'storeDelivery'
  | 'storeShowOutOfStock'
  | 'storeMessage'
>;

function pickStore(s: BusinessSettings): StoreSettings {
  return {
    storeEnabled: s.storeEnabled,
    storeWhatsapp: s.storeWhatsapp,
    storePriceType: s.storePriceType,
    storePickup: s.storePickup,
    storeDelivery: s.storeDelivery,
    storeShowOutOfStock: s.storeShowOutOfStock,
    storeMessage: s.storeMessage,
  };
}

export default function TiendaOnlinePage() {
  const { data: session } = useSession();
  const [form, setForm] = useState<StoreSettings>(pickStore(DEFAULT_SETTINGS));
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  const activeTenant = session?.tenants.find((t) => t.tenantId === session.tenantId);
  const storeUrl = activeTenant && origin ? `${origin}/tienda/${activeTenant.slug}` : '';

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    fetch('/api/tenant/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;
        const store = pickStore({ ...DEFAULT_SETTINGS, ...data.settings });
        setForm(store);
        setPublished(store.storeEnabled);
      })
      .finally(() => setLoading(false));
  }, [session?.tenantId]);

  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/tenant/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'No se pudo guardar');
      const store = pickStore({ ...DEFAULT_SETTINGS, ...data.settings });
      setForm(store);
      setPublished(store.storeEnabled);
      invalidateBusinessSettings();
      setMessage({ type: 'ok', text: 'Cambios guardados' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo guardar' });
    } finally {
      setSaving(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard?.writeText(storeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/integraciones" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
        <ArrowLeft className="size-4" /> Integraciones
      </Link>
      <PageHeader
        icon={Store}
        title="Tienda online propia"
        description="Catálogo público con tus productos y stock. Los clientes arman el pedido y te llega por WhatsApp; lo ves en Pedidos."
        actions={
          !loading && (
            <Badge tone={published ? 'success' : 'neutral'} dot>
              {published ? 'Publicada' : 'Desactivada'}
            </Badge>
          )
        }
      />

      <form onSubmit={save} className="space-y-6">
        <Card>
          <CardHeader title="Publicación" description="Activá la tienda para que el link funcione." />
          <CardBody className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="size-4 accent-brand-600"
                checked={form.storeEnabled}
                onChange={(e) => set('storeEnabled', e.target.checked)}
                disabled={loading}
              />
              <span className="text-sm font-medium text-zinc-900">Tienda activa (visible al público)</span>
            </label>

            {storeUrl && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-zinc-50 p-3 text-sm">
                <span className="text-zinc-500">Link:</span>
                <span className="min-w-0 flex-1 break-all font-medium text-zinc-800">{storeUrl}</span>
                <Button type="button" variant="secondary" size="sm" onClick={copyUrl}>
                  {copied ? <Check /> : <Copy />}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
                {published && (
                  <a
                    href={storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-brand-700 hover:bg-brand-50"
                  >
                    <ExternalLink className="size-4" /> Abrir
                  </a>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="field-label">WhatsApp que recibe los pedidos</span>
                <input
                  className="field-input"
                  value={form.storeWhatsapp}
                  onChange={(e) => set('storeWhatsapp', e.target.value)}
                  placeholder="5493385123456"
                  inputMode="tel"
                  disabled={loading}
                />
                <span className="field-hint">Con código de país, sin 0 ni 15. Ej.: 54 9 3385 123456</span>
              </label>
              <label className="block">
                <span className="field-label">Precios que ve el cliente</span>
                <select
                  className="field-input"
                  value={form.storePriceType}
                  onChange={(e) => set('storePriceType', e.target.value)}
                  disabled={loading}
                >
                  {STORE_PRICE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {STORE_PRICE_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Entrega y catálogo" />
          <CardBody className="space-y-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-900">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-brand-600" checked={form.storePickup} onChange={(e) => set('storePickup', e.target.checked)} disabled={loading} />
                Retiro en el local
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-brand-600" checked={form.storeDelivery} onChange={(e) => set('storeDelivery', e.target.checked)} disabled={loading} />
                Envío a domicilio
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-brand-600" checked={form.storeShowOutOfStock} onChange={(e) => set('storeShowOutOfStock', e.target.checked)} disabled={loading} />
                Mostrar productos sin stock
              </label>
            </div>

            <label className="block">
              <span className="field-label">Mensaje de bienvenida (opcional)</span>
              <textarea
                className="field-input"
                rows={3}
                maxLength={1000}
                value={form.storeMessage}
                onChange={(e) => set('storeMessage', e.target.value)}
                disabled={loading}
              />
              <span className="field-hint">Horarios, zonas de envío, formas de pago, etc.</span>
            </label>
            <p className="text-xs text-zinc-500">
              Se publican los productos con precio y stock. Los pedidos no descuentan stock hasta que los registrás como venta desde Pedidos.
            </p>
          </CardBody>
        </Card>

        <div className="flex items-center justify-end gap-4">
          {message && (
            <span className={`text-sm ${message.type === 'ok' ? 'text-emerald-700' : 'text-red-700'}`}>{message.text}</span>
          )}
          <Button type="submit" loading={saving} disabled={loading}>
            {!saving && <Save />}
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
