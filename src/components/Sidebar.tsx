'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { ChevronsUpDown, LogOut, ShieldCheck, X } from 'lucide-react';
import { getModulesForRoles } from '@/lib/role-permissions';
import { ROLE_LABELS, isTenantRole } from '@/lib/role-permissions';
import { cn } from '@/lib/cn';
import { NAV_GROUPS, activeNavItem } from './navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function initials(text: string) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const activeTenant = session?.tenants.find((t) => t.tenantId === session.tenantId);
  const modules = getModulesForRoles(activeTenant?.roles ?? []);
  const active = activeNavItem(pathname);
  const canSwitch = (session?.tenants.length ?? 0) > 1;
  const roleText = (activeTenant?.roles ?? []).map((r) => (isTenantRole(r) ? ROLE_LABELS[r] : r)).join(' · ');

  const closeOnMobile = () => {
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {/* Overlay para móvil */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-[2px] transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 ease-out',
          'lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Menú principal"
      >
        {/* Negocio activo */}
        <div className="flex items-center gap-2 border-b border-zinc-100 p-3">
          <Link
            href={canSwitch ? '/seleccionar-negocio' : '/dashboard'}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 transition hover:bg-zinc-50"
            title={canSwitch ? 'Cambiar de negocio' : undefined}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
              {initials(activeTenant?.name ?? '')}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-zinc-900">{activeTenant?.name ?? ''}</span>
              <span className="block truncate text-xs text-zinc-500">Gestión comercial</span>
            </span>
            {canSwitch && <ChevronsUpDown className="size-4 shrink-0 text-zinc-400" />}
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter((i) => modules.has(i.module));
            if (items.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = active?.href === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={closeOnMobile}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-brand-50 text-brand-700'
                              : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                          )}
                        >
                          <Icon
                            className={cn(
                              'size-[18px] shrink-0',
                              isActive ? 'text-brand-600' : 'text-zinc-400 group-hover:text-zinc-600'
                            )}
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Usuario */}
        <div className="border-t border-zinc-100 p-3">
          {session?.isPlatformAdmin && (
            <Link
              href="/platform-admin"
              className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            >
              <ShieldCheck className="size-[18px] text-zinc-400" />
              Plataforma
            </Link>
          )}
          <div className="flex items-center gap-3 rounded-lg p-2">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="size-9 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                {initials(session?.user?.name || session?.user?.email || '')}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900">
                {session?.user?.name || session?.user?.email}
              </p>
              <p className="truncate text-xs text-zinc-500">{roleText}</p>
            </div>
            <button
              onClick={() => signOut({ redirectTo: '/login' })}
              className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
