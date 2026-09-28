import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/api-auth';
import { platformDb } from '@/lib/platform-db';
import { normalizeEmail } from '@/lib/memberships';
import { isTenantRole } from '@/lib/role-permissions';
import { inviteToTenant } from '@/lib/tenants';

// PATCH /api/platform/tenants/[id] — activar/desactivar un negocio
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePlatformAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (typeof body.isActive !== 'boolean') {
    return NextResponse.json({ success: false, error: 'isActive es requerido' }, { status: 400 });
  }
  const tenant = await platformDb.tenant.update({ where: { id }, data: { isActive: body.isActive } });
  return NextResponse.json({ success: true, tenant });
}

// POST /api/platform/tenants/[id] — invitar a un usuario al negocio
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePlatformAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
  const role = typeof body.role === 'string' ? body.role : 'ADMIN';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, error: 'Email inválido' }, { status: 400 });
  }
  if (!isTenantRole(role)) return NextResponse.json({ success: false, error: 'Rol inválido' }, { status: 400 });

  const tenant = await platformDb.tenant.findUnique({ where: { id } });
  if (!tenant) return NextResponse.json({ success: false, error: 'Negocio no encontrado' }, { status: 404 });
  const result = await inviteToTenant({ tenantId: id, email, role, invitedById: admin.userId });
  return NextResponse.json({ success: true, ...result }, { status: 201 });
}
