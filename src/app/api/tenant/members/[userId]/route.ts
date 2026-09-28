import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api-auth';
import { platformDb } from '@/lib/platform-db';
import { isTenantRole } from '@/lib/role-permissions';

async function otherAdminsCount(tenantId: string, userId: string) {
  return platformDb.userTenantRole.count({
    where: { tenantId, roleSlug: 'ADMIN', userId: { not: userId }, user: { isActive: true } },
  });
}

// PUT /api/tenant/members/[userId] — reemplaza los roles { roles: string[] }
export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const ctx = await requireTenant('usuarios');
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = await params;

  const body = await request.json().catch(() => ({}));
  const roles: string[] = Array.isArray(body.roles) ? [...new Set(body.roles.map(String))] as string[] : [];
  if (roles.length === 0 || !roles.every(isTenantRole)) {
    return NextResponse.json({ success: false, error: 'Indicá al menos un rol válido' }, { status: 400 });
  }

  const current = await platformDb.userTenantRole.findMany({ where: { tenantId: ctx.tenant.id, userId } });
  if (current.length === 0) {
    return NextResponse.json({ success: false, error: 'El usuario no pertenece a este negocio' }, { status: 404 });
  }
  const losesAdmin = current.some((r) => r.roleSlug === 'ADMIN') && !roles.includes('ADMIN');
  if (losesAdmin && (await otherAdminsCount(ctx.tenant.id, userId)) === 0) {
    return NextResponse.json({ success: false, error: 'El negocio tiene que tener al menos un administrador' }, { status: 400 });
  }

  await platformDb.$transaction([
    platformDb.userTenantRole.deleteMany({ where: { tenantId: ctx.tenant.id, userId, roleSlug: { notIn: roles } } }),
    ...roles.map((roleSlug, i) =>
      platformDb.userTenantRole.upsert({
        where: { userId_tenantId_roleSlug: { userId, tenantId: ctx.tenant.id, roleSlug } },
        create: { userId, tenantId: ctx.tenant.id, roleSlug, isPrimary: i === 0 },
        update: { isPrimary: i === 0 },
      })
    ),
  ]);
  return NextResponse.json({ success: true });
}

// DELETE /api/tenant/members/[userId] — quita el acceso al negocio
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const ctx = await requireTenant('usuarios');
  if (ctx instanceof NextResponse) return ctx;
  const { userId } = await params;

  if (userId === ctx.userId) {
    return NextResponse.json({ success: false, error: 'No podés quitarte el acceso a vos mismo' }, { status: 400 });
  }
  const current = await platformDb.userTenantRole.findMany({ where: { tenantId: ctx.tenant.id, userId } });
  if (current.some((r) => r.roleSlug === 'ADMIN') && (await otherAdminsCount(ctx.tenant.id, userId)) === 0) {
    return NextResponse.json({ success: false, error: 'El negocio tiene que tener al menos un administrador' }, { status: 400 });
  }
  await platformDb.userTenantRole.deleteMany({ where: { tenantId: ctx.tenant.id, userId } });
  return NextResponse.json({ success: true });
}
