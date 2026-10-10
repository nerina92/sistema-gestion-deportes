import { NextResponse } from 'next/server';
import { auth } from './auth';
import { platformDb } from './platform-db';
import { getTenantDb, type TenantDb } from './tenant-db';
import { hasModule, type ModuleKey } from './role-permissions';

export interface TenantContext {
  userId: string;
  tenant: { id: string; slug: string; name: string; schemaName: string };
  roles: string[];
  /** Cliente Prisma fijado al schema del negocio activo. */
  db: TenantDb;
}

function jsonError(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Resuelve sesión + negocio activo + roles para una ruta de API y valida el
 * módulo requerido. Los roles se leen de la base en cada request (equivalente
 * al TenantRoleEnricher de Mi Club), así una baja de acceso es inmediata.
 *
 * Uso:
 *   const ctx = await requireTenant('productos');
 *   if (ctx instanceof NextResponse) return ctx;
 *   const prisma = ctx.db;
 */
export async function requireTenant(module?: ModuleKey): Promise<TenantContext | NextResponse> {
  const session = await auth();
  if (!session?.userId) return jsonError(401, 'No autorizado');
  if (!session.tenantId) return jsonError(409, 'Seleccioná un negocio para continuar');

  const rows = await platformDb.userTenantRole.findMany({
    where: {
      userId: session.userId,
      tenantId: session.tenantId,
      tenant: { isActive: true },
      user: { isActive: true },
    },
    include: { tenant: { select: { id: true, slug: true, name: true, schemaName: true } } },
  });
  if (rows.length === 0) return jsonError(403, 'No tenés acceso a este negocio');

  const roles = rows.map((r) => r.roleSlug);
  if (module && !hasModule(roles, module)) {
    return jsonError(403, 'Tu rol no tiene permiso para esta acción');
  }

  const tenant = rows[0].tenant;
  return { userId: session.userId, tenant, roles, db: getTenantDb(tenant.schemaName) };
}

/** Solo administradores de plataforma (rol global PLATFORM_ADMIN). */
export async function requirePlatformAdmin(): Promise<{ userId: string } | NextResponse> {
  const session = await auth();
  if (!session?.userId) return jsonError(401, 'No autorizado');
  const count = await platformDb.userGlobalRole.count({
    where: { userId: session.userId, role: 'PLATFORM_ADMIN', user: { isActive: true } },
  });
  if (count === 0) return jsonError(403, 'Solo administradores de la plataforma');
  return { userId: session.userId };
}
