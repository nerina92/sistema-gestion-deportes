import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Afip from '@afipsdk/afip.js';

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

    // Inicializar AFIP SDK
    // IMPORTANTE: El SDK v1.2.2 envía cert y key como CONTENIDO al servidor cloud
    // app.afipsdk.com, NO como rutas de archivos locales
    const cuitNumber = parseInt(config.cuit);
    console.log('Initializing AFIP SDK with:', {
      cuit: cuitNumber,
      puntoVenta: config.puntoVenta,
      production: config.productionMode,
      certLength: config.certContent.length,
      keyLength: config.keyContent.length
    });

    if (!config.accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Falta el Access Token de Afip SDK. Obtené uno en https://app.afipsdk.com/'
      }, { status: 400 });
    }

    const afip = new Afip({
      CUIT: cuitNumber,
      cert: config.certContent,
      key: config.keyContent,
      production: config.productionMode,
      access_token: config.accessToken,
    });

    console.log('AFIP SDK initialized, testing connection...');

    // Probar obtener último número de comprobante
    // Tipo 11 = Factura C (Monotributo), Tipo 6 = Factura B (Resp. Inscripto)
    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(
      config.puntoVenta,
      11 // Tipo: Factura C (Monotributo)
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

    // Capturar más detalles del error incluyendo data del servidor SDK
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      status: error.status,
      statusText: error.statusText,
      data: error.data,
      ...(error.response && { response: error.response })
    };

    console.error('Full error details:', JSON.stringify(errorDetails, null, 2));

    return NextResponse.json({
      success: false,
      error: 'Error al conectar con AFIP',
      details: error.message,
      errorData: error.data || null,
      debugInfo: errorDetails
    }, { status: 500 });
  }
}
