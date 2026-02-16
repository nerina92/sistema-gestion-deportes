import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

    // Crear directorio para certificados
    const certsDir = path.join(process.cwd(), 'certs');
    await mkdir(certsDir, { recursive: true });

    let certPath: string;
    let keyPath: string;

    // Si se suben nuevos archivos, guardarlos
    if (certFile && keyFile) {
      certPath = path.join(certsDir, `${cuit}.crt`);
      keyPath = path.join(certsDir, `${cuit}.key`);

      const certBuffer = Buffer.from(await certFile.arrayBuffer());
      const keyBuffer = Buffer.from(await keyFile.arrayBuffer());

      await writeFile(certPath, certBuffer);
      await writeFile(keyPath, keyBuffer);
    } else {
      // Usar paths existentes de la configuración anterior
      const existingConfig = await prisma.afipConfig.findFirst({
        where: { isActive: true }
      });

      if (!existingConfig) {
        return NextResponse.json({
          error: 'Debes subir certificado y clave privada'
        }, { status: 400 });
      }

      certPath = existingConfig.certPath;
      keyPath = existingConfig.keyPath;
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
        certPath,
        keyPath,
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
