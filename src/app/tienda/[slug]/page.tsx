import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCatalog, getStorefront } from '@/lib/storefront';
import { STORE_PRICE_TYPE_LABELS } from '@/lib/store';
import StoreClient from './StoreClient';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) return { title: 'Tienda no encontrada' };
  const name = store.settings.businessName || store.tenant.name;
  return {
    title: `${name} — Catálogo`,
    description: store.settings.storeMessage || `Catálogo online de ${name}. Hacé tu pedido por WhatsApp.`,
  };
}

export default async function TiendaPage({ params }: PageProps) {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) notFound();

  const products = await getCatalog(store);
  const s = store.settings;

  return (
    <StoreClient
      slug={store.tenant.slug}
      businessName={s.businessName || store.tenant.name}
      address={[s.address, s.city].filter(Boolean).join(', ')}
      message={s.storeMessage}
      priceLabel={STORE_PRICE_TYPE_LABELS[store.priceType]}
      pickup={s.storePickup}
      delivery={s.storeDelivery}
      products={products}
    />
  );
}
