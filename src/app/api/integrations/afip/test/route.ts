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

    // Inicializar AFIP SDK
    const afip = new Afip({
      CUIT: config.cuit,
      cert: config.certPath,
      key: config.keyPath,
      production: config.productionMode
    });

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
    return NextResponse.json({
      success: false,
      error: 'Error al conectar con AFIP',
      details: error.message
    }, { status: 500 });
  }
}
