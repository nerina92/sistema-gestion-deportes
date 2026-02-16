import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Obtener configuración
export async function GET() {
  try {
    const config = await prisma.afipConfig.findFirst({
      where: { isActive: true }
    });

    if (!config) {
      return NextResponse.json({ configured: false });
    }

    return NextResponse.json({
      configured: true,
      cuit: config.cuit,
      puntoVenta: config.puntoVenta,
      productionMode: config.productionMode
    });
  } catch (error) {
    console.error('Error getting AFIP config:', error);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

// POST - Guardar configuración
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const cuit = formData.get('cuit') as string;
    const puntoVenta = parseInt(formData.get('puntoVenta') as string);
    const productionMode = formData.get('productionMode') === 'true';
    const certFile = formData.get('cert') as File | null;
    const keyFile = formData.get('key') as File | null;

    // Validaciones
    if (!cuit || !puntoVenta) {
      return NextResponse.json({ error: 'CUIT y Punto de Venta son obligatorios' }, { status: 400 });
    }

    let certContent: string;
    let keyContent: string;

    // Si se suben nuevos archivos, leer su contenido
    if (certFile && keyFile) {
      const certBuffer = Buffer.from(await certFile.arrayBuffer());
      const keyBuffer = Buffer.from(await keyFile.arrayBuffer());

      certContent = certBuffer.toString('utf-8');
      keyContent = keyBuffer.toString('utf-8');
    } else {
      // Usar contenido existente de la configuración anterior
      const existingConfig = await prisma.afipConfig.findFirst({
        where: { isActive: true }
      });

      if (!existingConfig) {
        return NextResponse.json({
          error: 'Debes subir certificado y clave privada'
        }, { status: 400 });
      }

      certContent = existingConfig.certContent;
      keyContent = existingConfig.keyContent;
    }

    // Desactivar config anterior
    await prisma.afipConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Crear nueva configuración
    const config = await prisma.afipConfig.create({
      data: {
        cuit,
        puntoVenta,
        productionMode,
        certContent,
        keyContent,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente',
      config: {
        cuit: config.cuit,
        puntoVenta: config.puntoVenta,
        productionMode: config.productionMode
      }
    });
  } catch (error: any) {
    console.error('Error saving AFIP config:', error);
    return NextResponse.json({
      error: 'Error al guardar configuración',
      details: error.message
    }, { status: 500 });
  }
}
