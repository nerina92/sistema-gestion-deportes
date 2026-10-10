import { platformDb } from './platform-db';
import { dropTenantSchema, migrateTenantSchema } from './tenant-migrations';
import { getTenantDb } from './tenant-db';
import { normalizeEmail } from './memberships';
import type { TenantRole } from './role-permissions';
import { BUSINESS_TYPE_PRESETS } from './settings-defaults';

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
export const INVITATION_TTL_DAYS = 14;
export const TRIAL_DAYS = 30;

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

export function schemaNameForSlug(slug: string): string {
  return `tenant_${slug.replace(/-/g, '_')}`;
}

export function invitationExpiry(): Date {
  return new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  businessType?: string;
  ownerEmail: string;
  invitedById?: string;
}

/**
 * Da de alta un negocio: registra el tenant, crea su schema con todas las
 * migraciones, carga la configuración inicial e invita al dueño como ADMIN.
 * Si algo falla se revierte (se borra el schema y el registro).
 */
export async function createTenant(input: CreateTenantInput) {
  const slug = input.slug.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) {
    throw new Error('El identificador solo puede tener minúsculas, números y guiones (2 a 40 caracteres)');
  }
  const schemaName = schemaNameForSlug(slug);
  const name = input.name.trim();
  if (!name) throw new Error('El nombre del negocio es requerido');

  const existing = await platformDb.tenant.findFirst({
    where: { OR: [{ slug }, { schemaName }] },
  });
  if (existing) throw new Error(`Ya existe un negocio con el identificador "${slug}"`);

  const tenant = await platformDb.tenant.create({
    data: {
      slug,
      name,
      schemaName,
      businessType: input.businessType ?? null,
      trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  try {
    await migrateTenantSchema(schemaName);
    // Configuración inicial según el rubro (etiquetas de variantes sugeridas).
    const businessType = input.businessType || 'general';
    const preset = BUSINESS_TYPE_PRESETS[businessType];
    const initialSettings = {
      businessName: name,
      businessType,
      ...(preset
        ? { variantAttr1Label: preset.attr1, variantAttr2Label: preset.attr2, useVariants: preset.useVariants }
        : {}),
    };
    await getTenantDb(schemaName).tenantSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...initialSettings },
      update: initialSettings,
    });
    await inviteToTenant({
      tenantId: tenant.id,
      email: input.ownerEmail,
      role: 'ADMIN',
      invitedById: input.invitedById,
    });
  } catch (error) {
    await dropTenantSchema(schemaName).catch(() => {});
    await platformDb.tenant.delete({ where: { id: tenant.id } }).catch(() => {});
    throw error;
  }

  return tenant;
}

/**
 * Invita un email a un negocio con un rol. Si la persona ya tiene usuario, se
 * le asigna el rol directamente; si no, queda una invitación pendiente que se
 * acepta sola cuando entra con Google con ese email.
 */
export async function inviteToTenant(params: {
  tenantId: string;
  email: string;
  role: TenantRole;
  invitedById?: string;
}): Promise<{ status: 'granted' | 'invited' }> {
  const email = normalizeEmail(params.email);
  const user = await platformDb.user.findUnique({ where: { email } });
  if (user) {
    const hasRoleInTenant = await platformDb.userTenantRole.count({
      where: { userId: user.id, tenantId: params.tenantId },
    });
    await platformDb.userTenantRole.upsert({
      where: {
        userId_tenantId_roleSlug: { userId: user.id, tenantId: params.tenantId, roleSlug: params.role },
      },
      create: {
        userId: user.id,
        tenantId: params.tenantId,
        roleSlug: params.role,
        isPrimary: hasRoleInTenant === 0,
      },
      update: {},
    });
    return { status: 'granted' };
  }

  // Una sola invitación pendiente por email+negocio+rol.
  await platformDb.memberInvitation.updateMany({
    where: { tenantId: params.tenantId, email, roleSlug: params.role, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await platformDb.memberInvitation.create({
    data: {
      tenantId: params.tenantId,
      email,
      roleSlug: params.role,
      invitedById: params.invitedById ?? null,
      expiresAt: invitationExpiry(),
    },
  });
  return { status: 'invited' };
}
