'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { FaShieldAlt, FaPlus, FaStore } from 'react-icons/fa';
import { ROLE_LABELS, TENANT_ROLES, isTenantRole, type TenantRole } from '@/lib/role-permissions';
import { BUSINESS_TYPE_PRESETS } from '@/lib/settings-defaults';
import { formatDate } from '@/lib/format';

interface TenantRow {
  id: string;
  slug: string;
  name: string;
  businessType: string | null;
  isActive: boolean;
  trialEndsAt: string | null;
  createdAt: string;
  members: { email: string; name: string | null; roles: string[] }[];
  pendingInvitations: { id: string; email: string; roleSlug: string; expiresAt: string }[];
}

const inputClass = 'w-full px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900';

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export default function PlatformAdminPage() {
  const { data: session, update } = useSession();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', businessType: 'general', ownerEmail: '' });
  const [slugTouched, setSlugTouched] = useState(false);
  const [invite, setInvite] = useState<Record<string, { email: string; role: TenantRole }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/platform/tenants', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'No se pudo cargar');
      setTenants(data.tenants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (url: string, init: RequestInit) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Operación fallida');
      await load();
      await update({ refreshTenants: true });
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operación fallida');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const createTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await send('/api/platform/tenants', { method: 'POST', body: JSON.stringify(form) });
    if (data) {
      setNotice(`Negocio "${form.name}" creado. ${form.ownerEmail} ya puede entrar con Google como Administrador.`);
      setForm({ name: '', slug: '', businessType: 'general', ownerEmail: '' });
      setSlugTouched(false);
    }
  };

  const inviteTo = async (tenantId: string) => {
    const value = invite[tenantId];
    if (!value?.email) return;
    const data = await send(`/api/platform/tenants/${tenantId}`, { method: 'POST', body: JSON.stringify(value) });
    if (data) {
      setNotice(`Acceso ${data.status === 'granted' ? 'otorgado' : 'invitado'}: ${value.email}`);
      setInvite((prev) => ({ ...prev, [tenantId]: { email: '', role: value.role } }));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-zinc-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <FaShieldAlt /> Administración de la plataforma
          </h1>
          <div className="flex items-center gap-4 text-sm">
            {(session?.tenants.length ?? 0) > 0 && (
              <Link href="/seleccionar-negocio" className="text-zinc-300 hover:text-white">
                Ir a un negocio
              </Link>
            )}
            <button onClick={() => signOut({ redirectTo: '/login' })} className="text-zinc-300 hover:text-white">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-700">{notice}</div>}

        <section className="bg-white rounded-card shadow-card border border-zinc-200 p-6">
          <h2 className="text-lg font-medium text-zinc-900 flex items-center gap-2 mb-4">
            <FaPlus className="text-brand-500" /> Nuevo negocio
          </h2>
          <form onSubmit={createTenant} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-zinc-700 mb-1">Nombre</span>
              <input
                required
                className={inputClass}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))
                }
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-zinc-700 mb-1">Identificador</span>
              <input
                required
                pattern="[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?"
                className={inputClass}
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
              />
              <span className="block text-xs text-zinc-500 mt-1">Minúsculas, números y guiones. No se puede cambiar.</span>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-zinc-700 mb-1">Rubro</span>
              <select
                className={inputClass}
                value={form.businessType}
                onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}
              >
                {Object.entries(BUSINESS_TYPE_PRESETS).map(([key, p]) => (
                  <option key={key} value={key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-zinc-700 mb-1">Email de Google del dueño</span>
              <input
                required
                type="email"
                className={inputClass}
                value={form.ownerEmail}
                onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
              />
            </label>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-md hover:bg-brand-700 disabled:opacity-50"
              >
                {busy ? 'Creando...' : 'Crear negocio'}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-900">Negocios ({tenants.length})</h2>
          {loading && <p className="text-sm text-zinc-500">Cargando...</p>}
          {tenants.map((t) => (
            <article key={t.id} className="bg-white rounded-card shadow-card border border-zinc-200 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FaStore className={t.isActive ? 'text-brand-600' : 'text-zinc-400'} />
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {t.name} {!t.isActive && <span className="text-xs text-red-600">(inactivo)</span>}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {t.slug} · {BUSINESS_TYPE_PRESETS[t.businessType ?? '']?.label ?? t.businessType ?? '—'} · alta{' '}
                      {formatDate(t.createdAt)}
                      {t.trialEndsAt && ` · prueba hasta ${formatDate(t.trialEndsAt)}`}
                    </p>
                  </div>
                </div>
                <button
                  disabled={busy}
                  onClick={() => send(`/api/platform/tenants/${t.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !t.isActive }) })}
                  className="text-xs text-zinc-600 hover:text-zinc-900 border border-zinc-300 rounded px-2 py-1"
                >
                  {t.isActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>

              <div className="text-sm">
                <p className="font-medium text-zinc-700 mb-1">Usuarios</p>
                {t.members.length === 0 && <p className="text-zinc-500 text-xs">Todavía nadie entró.</p>}
                <ul className="space-y-1">
                  {t.members.map((m) => (
                    <li key={m.email} className="text-zinc-700">
                      {m.name || m.email} <span className="text-xs text-zinc-500">({m.roles.map((r) => (isTenantRole(r) ? ROLE_LABELS[r] : r)).join(', ')})</span>
                    </li>
                  ))}
                  {t.pendingInvitations.map((inv) => (
                    <li key={inv.id} className="text-zinc-500 text-xs">
                      {inv.email} — invitación pendiente ({isTenantRole(inv.roleSlug) ? ROLE_LABELS[inv.roleSlug] : inv.roleSlug})
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2">
                <input
                  type="email"
                  placeholder="Invitar email@gmail.com"
                  className={inputClass}
                  value={invite[t.id]?.email ?? ''}
                  onChange={(e) => setInvite((p) => ({ ...p, [t.id]: { email: e.target.value, role: p[t.id]?.role ?? 'ADMIN' } }))}
                />
                <select
                  className={inputClass}
                  value={invite[t.id]?.role ?? 'ADMIN'}
                  onChange={(e) => setInvite((p) => ({ ...p, [t.id]: { email: p[t.id]?.email ?? '', role: e.target.value as TenantRole } }))}
                >
                  {TENANT_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <button
                  disabled={busy}
                  onClick={() => inviteTo(t.id)}
                  className="px-3 py-2 bg-zinc-800 text-white text-sm rounded-md hover:bg-zinc-900 disabled:opacity-50"
                >
                  Invitar
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
