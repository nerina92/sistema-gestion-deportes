import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Probar conexión con Tienda Nube
export async function POST() {
  try {
    const config = await prisma.tiendanubeConfig.findFirst({
      where: { isActive: true }
    });

    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'No hay configuración guardada'
      }, { status: 400 });
    }

    // Hacer request a Tienda Nube para validar credenciales
    const response = await fetch(
      `https://api.tiendanube.com/v1/${config.storeId}/products?per_page=1`,
      {
        headers: {
          'Authentication': `bearer ${config.accessToken}`,
          'User-Agent': 'Sistema Gestion Deportes (sistema@deporteslaboulaye.com)'
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({
        success: false,
        error: 'Credenciales inválidas o store ID incorrecto',
        details: error
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa con Tienda Nube'
    });
  } catch (error: any) {
    console.error('Error al conectar con Tienda Nube:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al conectar con Tienda Nube',
      details: error.message
    }, { status: 500 });
  }
}
