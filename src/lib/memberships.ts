import { platformDb } from './platform-db';

export interface TenantSummary {
  tenantId: string;
  slug: string;
  name: string;
  /** Todos los roles del usuario en este negocio (el primario primero). */
  roles: string[];
}

export const PLATFORM_ADMIN_ROLE = 'PLATFORM_ADMIN';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Emails con acceso de administrador de plataforma (bootstrap del primer admin). */
function bootstrapAdminEmails(): Set<string> {
  return new Set(
    (process.env.PLATFORM_ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => normalizeEmail(e))
      .filter(Boolean)
  );
}

function pendingInvitationsWhere(email: string) {
  return {
    email,
    acceptedAt: null,
    revokedAt: null,
    expiresAt: { gt: new Date() },
  };
}

/**
 * Decide si un login con Google se permite (solo por invitación) y, si se
 * permite, crea/actualiza el usuario y acepta sus invitaciones pendientes.
 * Devuelve el id del usuario o null si no tiene acceso.
 */
export async function resolveGoogleSignIn(profile: {
  email: string;
  name?: string | null;
  image?: string | null;
  sub?: string | null;
}): Promise<string | null> {
  const email = normalizeEmail(profile.email);
  const isBootstrapAdmin = bootstrapAdminEmails().has(email);

  const [existing, invitations] = await Promise.all([
    platformDb.user.findUnique({ where: { email } }),
    platformDb.memberInvitation.findMany({ where: pendingInvitationsWhere(email) }),
  ]);

  if (existing && !existing.isActive) return null;
  if (!existing && invitations.length === 0 && !isBootstrapAdmin) return null;

  return platformDb.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      create: {
        email,
        name: profile.name ?? null,
        image: profile.image ?? null,
        googleSub: profile.sub ?? null,
        lastLoginAt: new Date(),
      },
      update: {
        name: profile.name ?? undefined,
        image: profile.image ?? undefined,
        googleSub: profile.sub ?? undefined,
        lastLoginAt: new Date(),
      },
    });

    for (const inv of invitations) {
      const hasRoleInTenant = await tx.userTenantRole.count({
        where: { userId: user.id, tenantId: inv.tenantId },
      });
      await tx.userTenantRole.upsert({
        where: {
          userId_tenantId_roleSlug: { userId: user.id, tenantId: inv.tenantId, roleSlug: inv.roleSlug },
        },
        create: {
          userId: user.id,
          tenantId: inv.tenantId,
          roleSlug: inv.roleSlug,
          isPrimary: hasRoleInTenant === 0,
        },
        update: {},
      });
      await tx.memberInvitation.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } });
    }

    if (isBootstrapAdmin) {
      await tx.userGlobalRole.upsert({
        where: { userId_role: { userId: user.id, role: PLATFORM_ADMIN_ROLE } },
        create: { userId: user.id, role: PLATFORM_ADMIN_ROLE },
        update: {},
      });
    }

    return user.id;
  });
}

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const user = await platformDb.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true },
  });
  return user?.id ?? null;
}

/** Negocios activos del usuario con sus roles (equivalente a /tenants/my-clubs). */
export async function fetchUserTenants(userId: string): Promise<TenantSummary[]> {
  const rows = await platformDb.userTenantRole.findMany({
    where: { userId, tenant: { isActive: true }, user: { isActive: true } },
    include: { tenant: { select: { id: true, slug: true, name: true } } },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });
  const byTenant = new Map<string, TenantSummary>();
  for (const row of rows) {
    const entry = byTenant.get(row.tenantId) ?? {
      tenantId: row.tenant.id,
      slug: row.tenant.slug,
      name: row.tenant.name,
      roles: [],
    };
    entry.roles.push(row.roleSlug);
    byTenant.set(row.tenantId, entry);
  }
  return [...byTenant.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const count = await platformDb.userGlobalRole.count({
    where: { userId, role: PLATFORM_ADMIN_ROLE, user: { isActive: true } },
  });
  return count > 0;
}
