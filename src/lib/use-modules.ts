'use client';

import { useSession } from 'next-auth/react';
import { getModulesForRoles, type ModuleKey } from './role-permissions';

/** Módulos habilitados para el usuario en el negocio activo (para mostrar u ocultar acciones). */
export function useModules(): Set<ModuleKey> {
  const { data: session } = useSession();
  const active = session?.tenants.find((t) => t.tenantId === session.tenantId);
  return getModulesForRoles(active?.roles ?? []);
}
