import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Afip from '@afipsdk/afip.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const prisma = new PrismaClient();

// POST - Probar conexión con AFIP
export async function POST() {
  try {
    const config = await prisma.afipConfig.findFirst({
      where: { isActive: true }
    });

    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'No hay configuración de AFIP'
      }, { status: 400 });
    }

    // Validar que los certificados existen
    if (!config.certContent || !config.keyContent) {
      return NextResponse.json({
        success: false,
        error: 'Certificados no encontrados en la configuración'
      }, { status: 400 });
    }

    // Escribir certificados temporalmente en /tmp (única carpeta escribible en Vercel)
    const tmpDir = tmpdir();
    const certPath = join(tmpDir, `afip-cert-${config.cuit}.crt`);
    const keyPath = join(tmpDir, `afip-key-${config.cuit}.key`);

    console.log('Writing certificates to:', { certPath, keyPath });

    await writeFile(certPath, config.certContent);
    await writeFile(keyPath, config.keyContent);

    console.log('Certificates written successfully');

    // Inicializar AFIP SDK
    console.log('Initializing AFIP SDK with:', {
      cuit: config.cuit,
      puntoVenta: config.puntoVenta,
      production: config.productionMode
    });

    const afip = new Afip({
      CUIT: config.cuit,
      cert: certPath,
      key: keyPath,
      production: config.productionMode
    });

    console.log('AFIP SDK initialized successfully');

    // Probar obtener último número de comprobante
    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(
      config.puntoVenta,
      6 // Tipo: Factura B
    );

    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa con AFIP',
      lastInvoiceNumber: lastVoucher,
      config: {
        cuit: config.cuit,
        puntoVenta: config.puntoVenta,
        mode: config.productionMode ? 'PRODUCCIÓN' : 'HOMOLOGACIÓN'
      }
    });
  } catch (error: any) {
    console.error('Error testing AFIP connection:', error);

    // Capturar más detalles del error
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      ...(error.response && { response: error.response })
    };

    console.error('Full error details:', JSON.stringify(errorDetails, null, 2));

    return NextResponse.json({
      success: false,
      error: 'Error al conectar con AFIP',
      details: error.message,
      debugInfo: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }, { status: 500 });
  }
}
