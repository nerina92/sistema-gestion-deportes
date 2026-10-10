import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api-auth';

// GET - Obtener logs de sincronización
export async function GET() {
  const ctx = await requireTenant('integraciones');
  if (ctx instanceof NextResponse) return ctx;
  const prisma = ctx.db;

  try {
    const logs = await prisma.syncLog.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Últimos 50 logs
    });

    return NextResponse.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error al obtener logs:', error);
    return NextResponse.json({ error: 'Error al obtener logs' }, { status: 500 });
  }
}
