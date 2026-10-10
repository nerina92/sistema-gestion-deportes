import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/api-auth';
import { platformDb } from '@/lib/platform-db';
import { createTenant, slugify } from '@/lib/tenants';

// GET /api/platform/tenants — todos los negocios con sus usuarios e invitaciones pendientes
export async function GET() {
  const admin = await requirePlatformAdmin();
  if (admin instanceof NextResponse) return admin;

  const tenants = await platformDb.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      userRoles: { include: { user: { select: { email: true, name: true } } } },
      invitations: {
        where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true, email: true, roleSlug: true, expiresAt: true },
      },
    },
  });

  return NextResponse.json({
    success: true,
    tenants: tenants.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      businessType: t.businessType,
      isActive: t.isActive,
      trialEndsAt: t.trialEndsAt,
      createdAt: t.createdAt,
      members: Object.values(
        t.userRoles.reduce<Record<string, { email: string; name: string | null; roles: string[] }>>((acc, r) => {
          acc[r.userId] ??= { email: r.user.email, name: r.user.name, roles: [] };
          acc[r.userId].roles.push(r.roleSlug);
          return acc;
        }, {})
      ),
      pendingInvitations: t.invitations,
    })),
  });
}

// POST /api/platform/tenants — alta de negocio + invitación al dueño
export async function POST(request: NextRequest) {
  const admin = await requirePlatformAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const ownerEmail = typeof body.ownerEmail === 'string' ? body.ownerEmail.trim() : '';
  const slug = typeof body.slug === 'string' && body.slug.trim() ? body.slug.trim() : slugify(name);
  const businessType = typeof body.businessType === 'string' ? body.businessType.trim() : undefined;

  if (!name) return NextResponse.json({ success: false, error: 'El nombre es requerido' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
    return NextResponse.json({ success: false, error: 'Email del dueño inválido' }, { status: 400 });
  }

  try {
    const tenant = await createTenant({ name, slug, businessType, ownerEmail, invitedById: admin.userId });
    return NextResponse.json({ success: true, tenant }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear el negocio';
    console.error('Error creando negocio:', error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
