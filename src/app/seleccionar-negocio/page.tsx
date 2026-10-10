'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { FaShieldAlt } from 'react-icons/fa';
import { ROLE_LABELS, isTenantRole } from '@/lib/role-permissions';

export default function SeleccionarNegocioPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [selecting, setSelecting] = useState<string | null>(null);

  // Refresca la lista de negocios UNA vez al entrar (por si llegó una invitación
  // nueva). update() pone el status en "loading" y lo vuelve a "authenticated",
  // así que sin esta guarda el efecto se re-dispara en loop.
  const refreshed = useRef(false);
  useEffect(() => {
    if (status === 'authenticated' && !refreshed.current) {
      refreshed.current = true;
      update({ refreshTenants: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const selectTenant = async (tenantId: string) => {
    setSelecting(tenantId);
    const updated = await update({ tenantId });
    if (updated?.tenantId === tenantId) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setSelecting(null);
    }
  };

  const tenants = session?.tenants ?? [];

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
            GC
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900">Elegí un negocio</h1>
          <p className="mt-1 text-sm text-zinc-500">{session?.user?.email}</p>
        </div>

        {status === 'loading' && !session ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-card bg-zinc-200/70" />
            ))}
          </div>
        ) : tenants.length === 0 ? (
          <div className="rounded-card border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-600 shadow-card">
            Todavía no tenés acceso a ningún negocio. Pedile al administrador que te invite con este email.
          </div>
        ) : (
          <ul className="space-y-3">
            {tenants.map((t) => {
              const current = session?.tenantId === t.tenantId;
              return (
                <li key={t.tenantId}>
                  <button
                    onClick={() => selectTenant(t.tenantId)}
                    disabled={selecting !== null}
                    className={`group flex w-full items-center gap-4 rounded-card border bg-white p-4 text-left shadow-card transition hover:border-brand-300 disabled:opacity-60 ${
                      current ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-zinc-200'
                    }`}
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700">
                      {initials(t.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-zinc-900">{t.name}</span>
                      <span className="block text-xs text-zinc-500">
                        {t.roles.map((r) => (isTenantRole(r) ? ROLE_LABELS[r] : r)).join(' · ')}
                      </span>
                    </span>
                    <span className="text-xs text-zinc-400 group-hover:text-brand-700">
                      {selecting === t.tenantId ? 'Entrando…' : current ? 'Actual' : 'Entrar →'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-8 flex items-center justify-between text-sm">
          {session?.isPlatformAdmin ? (
            <Link href="/platform-admin" className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900">
              <FaShieldAlt className="size-3.5" /> Administración de la plataforma
            </Link>
          ) : (
            <span />
          )}
          <button onClick={() => signOut({ redirectTo: '/login' })} className="text-zinc-600 hover:text-zinc-900">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
