import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener logs de sincronización
export async function GET() {
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
