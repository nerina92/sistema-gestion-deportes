'use client';

import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, Search, ShoppingBag, Trash2, X, MapPin, CheckCircle2 } from 'lucide-react';
import type { CatalogProduct, CatalogVariant } from '@/lib/storefront';
import { formatMoney, type DeliveryMethod } from '@/lib/store';

interface Props {
  slug: string;
  businessName: string;
  address: string;
  message: string;
  priceLabel: string;
  pickup: boolean;
  delivery: boolean;
  products: CatalogProduct[];
}

interface CartLine {
  variantId: string;
  quantity: number;
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500';

function storageKey(slug: string) {
  return `tienda:${slug}:carrito`;
}

function loadCart(slug: string): CartLine[] {
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((l) => typeof l?.variantId === 'string' && Number.isInteger(l?.quantity) && l.quantity > 0)
      : [];
  } catch {
    return [];
  }
}

function saveCart(slug: string, cart: CartLine[]) {
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(cart));
  } catch {
    // Sin almacenamiento (modo privado): el carrito vive solo en memoria.
  }
}

export default function StoreClient(props: Props) {
  const { slug, products } = props;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Índice variante → producto para el carrito.
  const variantIndex = useMemo(() => {
    const map = new Map<string, { product: CatalogProduct; variant: CatalogVariant }>();
    for (const p of products) for (const v of p.variants) map.set(v.id, { product: p, variant: v });
    return map;
  }, [products]);

  useEffect(() => {
    // Descarta del carrito guardado lo que ya no está en el catálogo.
    setCart(loadCart(slug).filter((l) => variantIndex.has(l.variantId)));
    setHydrated(true);
  }, [slug, variantIndex]);

  useEffect(() => {
    if (hydrated) saveCart(slug, cart);
  }, [slug, cart, hydrated]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) map.set(p.categoryId, p.categoryName);
    return [...map].sort((a, b) => a[1].localeCompare(b[1]));
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!category || p.categoryId === category) &&
        (!q || `${p.name} ${p.brand ?? ''} ${p.description ?? ''}`.toLowerCase().includes(q))
    );
  }, [products, query, category]);

  const qtyInCart = (variantId: string) => cart.find((l) => l.variantId === variantId)?.quantity ?? 0;

  const setQty = (variantId: string, quantity: number) => {
    const entry = variantIndex.get(variantId);
    if (!entry) return;
    const max = entry.variant.stock;
    const q = Math.max(0, Math.min(quantity, max));
    setCart((prev) => {
      if (q === 0) return prev.filter((l) => l.variantId !== variantId);
      if (prev.some((l) => l.variantId === variantId)) {
        return prev.map((l) => (l.variantId === variantId ? { ...l, quantity: q } : l));
      }
      return [...prev, { variantId, quantity: q }];
    });
  };

  const lines = cart
    .map((l) => {
      const entry = variantIndex.get(l.variantId);
      return entry ? { ...l, ...entry, subtotal: entry.variant.price * l.quantity } : null;
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);
  const total = lines.reduce((n, l) => n + l.subtotal, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">{props.businessName}</h1>
          {props.address && (
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-4 w-4" /> {props.address}
            </p>
          )}
          {props.message && <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{props.message}</p>}
          <p className="mt-3 text-xs text-gray-500">Precios expresados en {props.priceLabel.toLowerCase()}.</p>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-4 space-y-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar productos"
              className={`${inputClass} pl-9`}
            />
          </label>
          {categories.length > 1 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              <CategoryChip active={!category} onClick={() => setCategory('')}>
                Todo
              </CategoryChip>
              {categories.map(([id, name]) => (
                <CategoryChip key={id} active={category === id} onClick={() => setCategory(id)}>
                  {name}
                </CategoryChip>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {products.length === 0 ? (
          <p className="py-16 text-center text-gray-500">Todavía no hay productos publicados.</p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-gray-500">No encontramos productos con esa búsqueda.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} qtyInCart={qtyInCart} setQty={setQty} />
            ))}
          </div>
        )}
      </main>

      {itemCount > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-4">
          <button
            onClick={() => setCartOpen(true)}
            className="mx-auto flex w-full max-w-md items-center justify-between rounded-xl bg-emerald-600 px-5 py-4 text-white shadow-lg hover:bg-emerald-700"
          >
            <span className="flex items-center gap-2 font-medium">
              <ShoppingBag className="h-5 w-5" /> Ver pedido ({itemCount})
            </span>
            <span className="font-semibold">{formatMoney(total)}</span>
          </button>
        </div>
      )}

      {cartOpen && (
        <CartDrawer
          {...props}
          lines={lines}
          total={total}
          setQty={setQty}
          onClose={() => setCartOpen(false)}
          onOrdered={() => setCart([])}
        />
      )}
    </div>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-sm ${
        active ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

function ProductCard({
  product,
  qtyInCart,
  setQty,
}: {
  product: CatalogProduct;
  qtyInCart: (variantId: string) => number;
  setQty: (variantId: string, q: number) => void;
}) {
  const firstAvailable = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstAvailable.id);
  const [imageFailed, setImageFailed] = useState(false);
  const variant = product.variants.find((v) => v.id === variantId) ?? firstAvailable;
  const inCart = qtyInCart(variant.id);
  const hasOptions = product.variants.length > 1;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="aspect-square bg-gray-100">
        {product.imageUrl && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-semibold text-gray-300">
            {product.name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          {product.brand && <p className="text-xs uppercase tracking-wide text-gray-500">{product.brand}</p>}
          <h2 className="text-sm font-medium leading-snug text-gray-900">{product.name}</h2>
        </div>
        <p className="text-base font-semibold text-gray-900">{formatMoney(variant.price)}</p>
        {hasOptions && (
          <select
            value={variant.id}
            onChange={(e) => setVariantId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
            aria-label={`Opción de ${product.name}`}
          >
            {product.variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.stock === 0}>
                {v.label}
                {v.stock === 0 ? ' (sin stock)' : ''}
              </option>
            ))}
          </select>
        )}
        <div className="mt-auto pt-1">
          {variant.stock === 0 ? (
            <p className="rounded-lg bg-gray-100 py-2 text-center text-sm text-gray-500">Sin stock</p>
          ) : inCart === 0 ? (
            <button
              onClick={() => setQty(variant.id, 1)}
              className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Agregar
            </button>
          ) : (
            <QtyControl value={inCart} max={variant.stock} onChange={(q) => setQty(variant.id, q)} />
          )}
        </div>
      </div>
    </article>
  );
}

function QtyControl({ value, max, onChange }: { value: number; max: number; onChange: (q: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-emerald-600">
      <button onClick={() => onChange(value - 1)} className="p-2 text-emerald-700" aria-label="Quitar uno">
        <Minus className="h-4 w-4" />
      </button>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className="p-2 text-emerald-700 disabled:opacity-30"
        aria-label="Agregar uno"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

type Line = {
  variantId: string;
  quantity: number;
  product: CatalogProduct;
  variant: CatalogVariant;
  subtotal: number;
};

function CartDrawer(
  props: Props & {
    lines: Line[];
    total: number;
    setQty: (variantId: string, q: number) => void;
    onClose: () => void;
    onOrdered: () => void;
  }
) {
  const { lines, total, setQty, onClose } = props;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<DeliveryMethod>(props.pickup ? 'pickup' : 'delivery');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [website, setWebsite] = useState(''); // trampa para bots
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ number: number; url: string } | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('tienda:cliente') ?? '{}');
      if (typeof saved.name === 'string') setName(saved.name);
      if (typeof saved.phone === 'string') setPhone(saved.phone);
      if (typeof saved.address === 'string') setAddress(saved.address);
    } catch {}
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/tienda/${props.slug}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          deliveryMethod: method,
          address,
          notes,
          website,
          items: lines.map((l) => ({ productVariantId: l.variantId, quantity: l.quantity })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'No pudimos enviar el pedido');
      try {
        window.localStorage.setItem('tienda:cliente', JSON.stringify({ name, phone, address }));
      } catch {}
      props.onOrdered();
      setDone({ number: data.order.number, url: data.whatsappUrl });
      window.location.href = data.whatsappUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos enviar el pedido');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Tu pedido"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">{done ? 'Pedido registrado' : 'Tu pedido'}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-500 hover:bg-gray-100" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-600" />
            <p className="text-gray-900">
              Registramos tu pedido <strong>#{done.number}</strong>.
            </p>
            <p className="text-sm text-gray-600">
              Para terminar, enviá el mensaje que se abrió en WhatsApp. Si no se abrió, tocá el botón.
            </p>
            <a
              href={done.url}
              className="w-full rounded-xl bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-700"
            >
              Enviar por WhatsApp
            </a>
          </div>
        ) : lines.length === 0 ? (
          <p className="flex-1 px-4 py-10 text-center text-gray-500">Tu pedido está vacío.</p>
        ) : (
          <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
              <ul className="divide-y divide-gray-100">
                {lines.map((l) => (
                  <li key={l.variantId} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{l.product.name}</p>
                      {l.product.variants.length > 1 && <p className="text-xs text-gray-500">{l.variant.label}</p>}
                      <p className="text-sm text-gray-700">{formatMoney(l.subtotal)}</p>
                    </div>
                    <div className="w-28">
                      <QtyControl value={l.quantity} max={l.variant.stock} onChange={(q) => setQty(l.variantId, q)} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setQty(l.variantId, 0)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      aria-label="Quitar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Nombre</span>
                  <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoComplete="name" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Teléfono</span>
                  <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={30} inputMode="tel" autoComplete="tel" />
                </label>
                {props.pickup && props.delivery && (
                  <fieldset>
                    <legend className="mb-1 block text-sm font-medium text-gray-700">Entrega</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {(['pickup', 'delivery'] as const).map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => setMethod(m)}
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            method === m ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-gray-300 text-gray-700'
                          }`}
                        >
                          {m === 'pickup' ? 'Retiro en el local' : 'Envío a domicilio'}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
                {method === 'delivery' && (
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-gray-700">Dirección de entrega</span>
                    <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} required maxLength={200} autoComplete="street-address" />
                  </label>
                )}
                {method === 'pickup' && props.address && (
                  <p className="text-xs text-gray-500">Retirás en: {props.address}</p>
                )}
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Notas (opcional)</span>
                  <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Horario, forma de pago, aclaraciones..." />
                </label>
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-200 p-4">
              {error && <p className="text-sm text-red-700">{error}</p>}
              <div className="flex items-center justify-between text-gray-900">
                <span>Total</span>
                <span className="text-lg font-semibold">{formatMoney(total)}</span>
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-xl bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {sending ? 'Enviando...' : 'Enviar pedido por WhatsApp'}
              </button>
              <p className="text-center text-xs text-gray-500">El negocio te confirma disponibilidad, envío y forma de pago.</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
