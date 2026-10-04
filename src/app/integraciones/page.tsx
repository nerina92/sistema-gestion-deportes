'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, Plug, Store, ShoppingBag } from 'lucide-react';
import { Badge, Card, PageHeader } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { useBusinessSettings } from '@/lib/use-business-settings';

interface Status {
  afip?: { configured: boolean; productionMode?: boolean; puntoVenta?: number };
  tiendanube?: { configured: boolean; lastSyncAt?: string | null };
}

export default function IntegracionesPage() {
  const [status, setStatus] = useState<Status>({});
  const settings = useBusinessSettings();

  useEffect(() => {
    Promise.all([
      fetch('/api/integrations/afip/config').then((r) => r.json()).catch(() => ({ configured: false })),
      fetch('/api/integrations/tiendanube/config').then((r) => r.json()).catch(() => ({ configured: false })),
    ]).then(([afip, tiendanube]) => setStatus({ afip, tiendanube }));
  }, []);

  const items = [
    {
      href: '/integraciones/afip',
      icon: FileText,
      title: 'Facturación electrónica AFIP',
      description: 'Emití Factura C con CAE desde cada venta.',
      state:
        status.afip === undefined
          ? null
          : status.afip.configured
            ? { tone: 'success' as const, text: status.afip.productionMode ? `Producción · PV ${status.afip.puntoVenta}` : 'Homologación (prueba)' }
            : { tone: 'neutral' as const, text: 'Sin configurar' },
    },
    {
      href: '/integraciones/tiendanube',
      icon: ShoppingBag,
      title: 'Tienda Nube',
      description: 'Vinculá tus productos y mantené el stock sincronizado.',
      state:
        status.tiendanube === undefined
          ? null
          : status.tiendanube.configured
            ? {
                tone: 'success' as const,
                text: status.tiendanube.lastSyncAt
                  ? `Conectada · última sync ${formatDateTime(status.tiendanube.lastSyncAt)}`
                  : 'Conectada',
              }
            : { tone: 'neutral' as const, text: 'Sin configurar' },
    },
    {
      href: '/configuracion#tienda',
      icon: Store,
      title: 'Tienda online propia',
      description: 'Catálogo público con pedidos por WhatsApp.',
      state: settings.storeEnabled
        ? { tone: 'success' as const, text: 'Publicada' }
        : { tone: 'neutral' as const, text: 'Desactivada' },
    },
  ];

  return (
    <div>
      <PageHeader icon={Plug} title="Integraciones" description="Conectá el sistema con AFIP y tus canales de venta online." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group">
              <Card className="flex h-full flex-col p-5 transition group-hover:border-brand-300 group-hover:shadow-pop">
                <div className="flex items-start justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="size-5" />
                  </span>
                  {item.state && <Badge tone={item.state.tone} dot>{item.state.text}</Badge>}
                </div>
                <h2 className="mt-4 text-sm font-semibold text-zinc-900">{item.title}</h2>
                <p className="mt-1 flex-1 text-sm text-zinc-500">{item.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
                  Configurar <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
