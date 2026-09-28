'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { FaStore, FaShieldAlt } from 'react-icons/fa';
import { ROLE_LABELS, isTenantRole } from '@/lib/role-permissions';

export default function SeleccionarNegocioPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [selecting, setSelecting] = useState<string | null>(null);

  // Refresca la lista de negocios al entrar (por si llegó una invitación nueva).
  useEffect(() => {
    if (status === 'authenticated') update({ refreshTenants: true });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Elegí un negocio</h1>
          <p className="mt-1 text-sm text-gray-600">{session?.user?.email}</p>
        </div>

        {status === 'loading' ? (
          <p className="text-center text-gray-500">Cargando...</p>
        ) : tenants.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center text-sm text-gray-600">
            Todavía no tenés acceso a ningún negocio. Pedile al administrador que te invite con este email.
          </div>
        ) : (
          <ul className="space-y-3">
            {tenants.map((t) => (
              <li key={t.tenantId}>
                <button
                  onClick={() => selectTenant(t.tenantId)}
                  disabled={selecting !== null}
                  className={`w-full flex items-center gap-4 p-4 bg-white rounded-lg shadow hover:shadow-md border-2 transition text-left disabled:opacity-60 ${
                    session?.tenantId === t.tenantId ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <FaStore className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                    <p className="text-xs text-gray-500">
                      {t.roles.map((r) => (isTenantRole(r) ? ROLE_LABELS[r] : r)).join(' · ')}
                    </p>
                  </div>
                  {selecting === t.tenantId && <span className="text-xs text-gray-500">Entrando...</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between text-sm">
          {session?.isPlatformAdmin ? (
            <Link href="/platform-admin" className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
              <FaShieldAlt className="h-3 w-3" /> Administración de la plataforma
            </Link>
          ) : (
            <span />
          )}
          <button onClick={() => signOut({ redirectTo: '/login' })} className="text-gray-600 hover:text-gray-900">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
