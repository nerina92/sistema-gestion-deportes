import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api-auth';

// GET - Obtener configuración actual
export async function GET() {
  const ctx = await requireTenant('integraciones');
  if (ctx instanceof NextResponse) return ctx;
  const prisma = ctx.db;

  try {
    const config = await prisma.tiendanubeConfig.findFirst({
      where: { isActive: true }
    });

    if (!config) {
      return NextResponse.json({ configured: false }, { status: 200 });
    }

    // No enviar token completo por seguridad
    return NextResponse.json({
      configured: true,
      storeId: config.storeId,
      lastSyncAt: config.lastSyncAt
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

// POST - Guardar o actualizar configuración
export async function POST(request: NextRequest) {
  const ctx = await requireTenant('integraciones');
  if (ctx instanceof NextResponse) return ctx;
  const prisma = ctx.db;

  try {
    const body = await request.json();
    const { storeId, accessToken } = body;

    // Validaciones
    if (!storeId || !accessToken) {
      return NextResponse.json(
        { error: 'Store ID y Access Token son requeridos' },
        { status: 400 }
      );
    }

    // Desactivar config anterior
    await prisma.tiendanubeConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Crear nueva config
    const config = await prisma.tiendanubeConfig.create({
      data: {
        storeId,
        accessToken,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente',
      storeId: config.storeId
    });
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}
