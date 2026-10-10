import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api-auth';
import { platformDb } from '@/lib/platform-db';
import { isTenantRole } from '@/lib/role-permissions';
import { inviteToTenant } from '@/lib/tenants';

// GET /api/tenant/members — usuarios del negocio + invitaciones pendientes
export async function GET() {
  const ctx = await requireTenant('usuarios');
  if (ctx instanceof NextResponse) return ctx;

  const [roles, invitations] = await Promise.all([
    platformDb.userTenantRole.findMany({
      where: { tenantId: ctx.tenant.id },
      include: { user: { select: { id: true, email: true, name: true, image: true, lastLoginAt: true, isActive: true } } },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    }),
    platformDb.memberInvitation.findMany({
      where: { tenantId: ctx.tenant.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, roleSlug: true, expiresAt: true, createdAt: true },
    }),
  ]);

  const members = new Map<string, { id: string; email: string; name: string | null; image: string | null; lastLoginAt: Date | null; isActive: boolean; roles: string[] }>();
  for (const r of roles) {
    const m = members.get(r.userId) ?? { ...r.user, roles: [] };
    m.roles.push(r.roleSlug);
    members.set(r.userId, m);
  }

  return NextResponse.json({
    success: true,
    currentUserId: ctx.userId,
    members: [...members.values()],
    invitations,
  });
}

// POST /api/tenant/members — invitar { email, role }
export async function POST(request: NextRequest) {
  const ctx = await requireTenant('usuarios');
  if (ctx instanceof NextResponse) return ctx;

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const role = typeof body.role === 'string' ? body.role : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, error: 'Email inválido' }, { status: 400 });
  }
  if (!isTenantRole(role)) {
    return NextResponse.json({ success: false, error: 'Rol inválido' }, { status: 400 });
  }

  const result = await inviteToTenant({ tenantId: ctx.tenant.id, email, role, invitedById: ctx.userId });
  return NextResponse.json({ success: true, ...result }, { status: 201 });
}
