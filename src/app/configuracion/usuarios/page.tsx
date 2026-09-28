'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FaUsers, FaUserPlus, FaTrash, FaEnvelope } from 'react-icons/fa';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, TENANT_ROLES, isTenantRole, type TenantRole } from '@/lib/role-permissions';

interface Member {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  lastLoginAt: string | null;
  roles: string[];
}

interface Invitation {
  id: string;
  email: string;
  roleSlug: string;
  expiresAt: string;
}

const roleLabel = (r: string) => (isTenantRole(r) ? ROLE_LABELS[r] : r);

export default function UsuariosPage() {
  const { update } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TenantRole>('VENDEDOR');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tenant/members', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'No se pudo cargar');
      setMembers(data.members);
      setInvitations(data.invitations);
      setCurrentUserId(data.currentUserId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const call = async (url: string, init: RequestInit, okMessage: string) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Operación fallida');
      setNotice(typeof okMessage === 'string' ? okMessage : '');
      await load();
      update({ refreshTenants: true });
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operación fallida');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await call(
      '/api/tenant/members',
      { method: 'POST', body: JSON.stringify({ email, role }) },
      ''
    );
    if (data) {
      setNotice(
        data.status === 'granted'
          ? `${email} ya tenía cuenta: se le dio acceso como ${ROLE_LABELS[role]}.`
          : `Invitación creada. Avisale a ${email} que entre con Google en ${window.location.origin}/login usando ese email.`
      );
      setEmail('');
    }
  };

  const toggleRole = (member: Member, r: TenantRole) => {
    const roles = member.roles.includes(r) ? member.roles.filter((x) => x !== r) : [...member.roles, r];
    if (roles.length === 0) return;
    call(`/api/tenant/members/${member.id}`, { method: 'PUT', body: JSON.stringify({ roles }) }, 'Roles actualizados');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FaUsers className="mr-3 text-gray-600" />
          Usuarios
        </h1>
        <p className="mt-2 text-gray-600">
          El acceso es solo por invitación: cada persona entra con su cuenta de Google.
        </p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-700">{notice}</div>}

      {/* Invitar */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
          <FaUserPlus className="mr-2 text-blue-500" /> Invitar
        </h2>
        <form onSubmit={invite} className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-3 items-start">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@gmail.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as TenantRole)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
          >
            {TENANT_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Invitar
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">{ROLE_DESCRIPTIONS[role]}</p>
      </section>

      {/* Miembros */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 p-6 pb-0">Con acceso</h2>
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Cargando...</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {members.map((m) => (
              <li key={m.id} className="p-6 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {m.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.image} alt="" className="h-9 w-9 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-gray-200" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {m.name || m.email} {m.id === currentUserId && <span className="text-xs text-gray-500">(vos)</span>}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{m.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {TENANT_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      disabled={busy}
                      onClick={() => toggleRole(m, r)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        m.roles.includes(r)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                  {m.id !== currentUserId && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        window.confirm(`¿Quitar el acceso de ${m.email}?`) &&
                        call(`/api/tenant/members/${m.id}`, { method: 'DELETE' }, 'Acceso quitado')
                      }
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Quitar acceso"
                    >
                      <FaTrash className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Invitaciones pendientes */}
      {invitations.length > 0 && (
        <section className="bg-white rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 p-6 pb-0">Invitaciones pendientes</h2>
          <ul className="divide-y divide-gray-100">
            {invitations.map((inv) => (
              <li key={inv.id} className="p-6 flex items-center gap-3">
                <FaEnvelope className="h-4 w-4 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{inv.email}</p>
                  <p className="text-xs text-gray-500">
                    {roleLabel(inv.roleSlug)} · vence el {new Date(inv.expiresAt).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => call(`/api/tenant/invitations/${inv.id}`, { method: 'DELETE' }, 'Invitación cancelada')}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Cancelar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
