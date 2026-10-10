import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener configuración actual
export async function GET() {
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
