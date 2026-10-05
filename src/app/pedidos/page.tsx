'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ClipboardList, ExternalLink, MessageCircle, RefreshCw } from 'lucide-react';
import {
  DELIVERY_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  formatMoney,
  normalizeWhatsapp,
  whatsappUrl,
  type DeliveryMethod,
  type OrderStatus,
} from '@/lib/store';
import { getModulesForRoles } from '@/lib/role-permissions';
import { formatDateTime } from '@/lib/format';

interface OrderItem {
  id: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  number: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  address: string | null;
  notes: string | null;
  totalAmount: number;
  saleId: string | null;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-brand-100 text-brand-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-zinc-200 text-zinc-600',
};

const FILTERS: (OrderStatus | '')[] = ['', ...ORDER_STATUSES];

const PAYMENT_LABELS = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' } as const;

/** Teléfono del cliente para WhatsApp: si es un número local argentino sin código de país, antepone 549. */
function customerWhatsapp(phone: string): string {
  const d = normalizeWhatsapp(phone);
  if (d.startsWith('54')) return d;
  const local = d.replace(/^0/, '').replace(/^(\d{2,4})15/, '$1');
  return `549${local}`;
}

export default function PedidosPage() {
  const { data: session } = useSession();
  const activeTenant = session?.tenants.find((t) => t.tenantId === session.tenantId);
  const canSell = getModulesForRoles(activeTenant?.roles ?? []).has('ventas');

  const [filter, setFilter] = useState<OrderStatus | ''>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders${filter ? `?status=${filter}` : ''}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'No se pudieron cargar los pedidos');
      setOrders(data.data);
      setPendingCount(data.pendingCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (order: Order, status: OrderStatus) => {
    if (status === 'cancelled' && !confirm(`¿Cancelar el pedido #${order.number}?`)) return;
    setBusy(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'No se pudo actualizar');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo actualizar');
    } finally {
      setBusy(null);
    }
  };

  const registerSale = async (order: Order, paymentMethod: keyof typeof PAYMENT_LABELS) => {
    if (!confirm(`Registrar el pedido #${order.number} como venta (${PAYMENT_LABELS[paymentMethod]}) y descontar el stock?`)) return;
    setBusy(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}/venta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'No se pudo registrar la venta');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo registrar la venta');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 flex items-center gap-3">
            <ClipboardList className="size-6 shrink-0 text-brand-600" />
            Pedidos
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Pedidos recibidos desde la tienda online.{' '}
            <Link href="/integraciones/tienda" className="text-brand-600 hover:text-brand-800 underline">
              Configurar tienda
            </Link>
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          <RefreshCw className="h-4 w-4" /> Actualizar
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((key) => {
          return (
            <button
              key={key || 'all'}
              onClick={() => setFilter(key)}
              className={`rounded-full border px-3 py-1 text-sm ${
                filter === key ? 'border-brand-600 bg-brand-600 text-white' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {key ? ORDER_STATUS_LABELS[key] : 'Todos'}
              {key === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          );
        })}
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="rounded-card border border-zinc-200 bg-white shadow-card">
        {loading ? (
          <p className="p-8 text-center text-zinc-500">Cargando...</p>
        ) : orders.length === 0 ? (
          <p className="p-8 text-center text-zinc-500">{filter ? `No hay pedidos con estado "${ORDER_STATUS_LABELS[filter]}".` : 'Todavía no recibiste pedidos.'}</p>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {orders.map((o) => {
              const open = expanded === o.id;
              return (
                <li key={o.id}>
                  <button
                    onClick={() => setExpanded(open ? null : o.id)}
                    className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-zinc-50"
                  >
                    <span className="font-mono text-sm text-zinc-500">#{o.number}</span>
                    <span className="flex-1 font-medium text-zinc-900">{o.customerName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[o.status]}`}>
                      {ORDER_STATUS_LABELS[o.status]}
                    </span>
                    {o.saleId && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">Venta registrada</span>}
                    <span className="w-28 text-right font-semibold text-zinc-900">{formatMoney(o.totalAmount)}</span>
                    <span className="w-full text-xs text-zinc-500 sm:w-auto">
                      {formatDateTime(o.createdAt)}
                    </span>
                  </button>

                  {open && (
                    <div className="space-y-4 bg-zinc-50 px-4 py-4 text-sm">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <p><span className="text-zinc-500">Teléfono:</span> {o.customerPhone}</p>
                        <p><span className="text-zinc-500">Entrega:</span> {DELIVERY_LABELS[o.deliveryMethod]}</p>
                        {o.address && <p className="sm:col-span-2"><span className="text-zinc-500">Dirección:</span> {o.address}</p>}
                        {o.notes && <p className="sm:col-span-2"><span className="text-zinc-500">Notas:</span> {o.notes}</p>}
                      </div>

                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs uppercase text-zinc-500">
                            <th className="py-1">Producto</th>
                            <th className="py-1 text-right">Cant.</th>
                            <th className="py-1 text-right">Precio</th>
                            <th className="py-1 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {o.items.map((i) => (
                            <tr key={i.id}>
                              <td className="py-1.5 text-zinc-900">
                                {i.productName}
                                {i.variantLabel !== 'Único' && <span className="text-zinc-500"> — {i.variantLabel}</span>}
                              </td>
                              <td className="py-1.5 text-right">{i.quantity}</td>
                              <td className="py-1.5 text-right">{formatMoney(i.unitPrice)}</td>
                              <td className="py-1.5 text-right">{formatMoney(i.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={whatsappUrl(customerWhatsapp(o.customerPhone), `Hola ${o.customerName}! Te escribimos por tu pedido #${o.number}.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700"
                        >
                          <MessageCircle className="h-4 w-4" /> Escribir al cliente
                        </a>

                        {o.status !== 'cancelled' && (
                          <select
                            value={o.status}
                            disabled={busy === o.id}
                            onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
                            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900"
                            aria-label="Estado del pedido"
                          >
                            {ORDER_STATUSES.filter((s) => s !== 'cancelled' || !o.saleId).map((s) => (
                              <option key={s} value={s}>
                                {ORDER_STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                        )}
                        {o.status === 'cancelled' && (
                          <button
                            onClick={() => changeStatus(o, 'pending')}
                            disabled={busy === o.id}
                            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 hover:bg-zinc-100"
                          >
                            Reabrir
                          </button>
                        )}

                        {canSell && !o.saleId && o.status !== 'cancelled' && (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-zinc-600">Registrar venta:</span>
                            {(Object.keys(PAYMENT_LABELS) as (keyof typeof PAYMENT_LABELS)[]).map((pm) => (
                              <button
                                key={pm}
                                onClick={() => registerSale(o, pm)}
                                disabled={busy === o.id}
                                className="rounded-md border border-brand-600 px-2 py-1 text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                              >
                                {PAYMENT_LABELS[pm]}
                              </button>
                            ))}
                          </span>
                        )}
                        {o.saleId && (
                          <Link href="/ventas" className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 underline">
                            Ver en ventas <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
