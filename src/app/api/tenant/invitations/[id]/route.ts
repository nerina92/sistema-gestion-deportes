import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api-auth';
import { platformDb } from '@/lib/platform-db';

// DELETE /api/tenant/invitations/[id] — cancela una invitación pendiente
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireTenant('usuarios');
  if (ctx instanceof NextResponse) return ctx;
  const { id } = await params;

  const result = await platformDb.memberInvitation.updateMany({
    where: { id, tenantId: ctx.tenant.id, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count === 0) {
    return NextResponse.json({ success: false, error: 'Invitación no encontrada' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
