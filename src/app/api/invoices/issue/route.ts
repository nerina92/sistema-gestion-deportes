import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Afip from '@afipsdk/afip.js';
import { generateInvoicePDF } from '@/lib/pdf-generator';

const prisma = new PrismaClient();

// POST - Emitir factura para una venta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { saleId, customerName, customerDni } = body;

    if (!saleId) {
      return NextResponse.json({ error: 'saleId es requerido' }, { status: 400 });
    }

    // Validar venta
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true
              }
            }
          }
        },
        invoice: true
      }
    });

    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    if (sale.invoice) {
      return NextResponse.json({
        error: 'Esta venta ya tiene una factura emitida',
        invoice: sale.invoice
      }, { status: 400 });
    }

    if (parseFloat(sale.totalAmount.toString()) <= 0) {
      return NextResponse.json({
        error: 'La venta debe tener un monto mayor a 0'
      }, { status: 400 });
    }

    // Obtener configuración AFIP
    const config = await prisma.afipConfig.findFirst({
      where: { isActive: true }
    });

    if (!config) {
      return NextResponse.json({
        error: 'AFIP no está configurado. Por favor configura AFIP primero.'
      }, { status: 400 });
    }

    // Inicializar AFIP SDK
    // IMPORTANTE: El SDK v1.2.2 envía cert y key como CONTENIDO al servidor cloud
    // app.afipsdk.com, NO como rutas de archivos locales
    if (!config.accessToken) {
      return NextResponse.json({
        error: 'Falta el Access Token de Afip SDK. Configuralo en Integraciones > AFIP.'
      }, { status: 400 });
    }

    const cuitNumber = parseInt(config.cuit);
    const afip = new Afip({
      CUIT: cuitNumber,
      cert: config.certContent,
      key: config.keyContent,
      production: config.productionMode,
      access_token: config.accessToken,
    });

    // Obtener siguiente número de comprobante
    // Tipo 11 = Factura C (Monotributo)
    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(
      config.puntoVenta,
      11 // Factura C (Monotributo)
    );
    const nextNumber = lastVoucher + 1;

    // Preparar datos para AFIP
    const today = new Date();
    const dateString = today.toISOString().split('T')[0].replace(/-/g, '');

    const totalAmount = parseFloat(sale.totalAmount.toString());

    const invoiceData = {
      'CantReg': 1,
      'PtoVta': config.puntoVenta,
      'CbteTipo': 11, // Factura C (Monotributo)
      'Concepto': 1, // Productos
      'DocTipo': customerDni ? 96 : 99, // 96: DNI, 99: Consumidor Final
      'DocNro': customerDni ? parseInt(customerDni.replace(/\D/g, '')) : 0,
      'CbteDesde': nextNumber,
      'CbteHasta': nextNumber,
      'CbteFch': parseInt(dateString),
      'ImpTotal': totalAmount,
      'ImpTotConc': 0,
      'ImpNeto': totalAmount,
      'ImpOpEx': 0,
      'ImpIVA': 0,
      'ImpTrib': 0,
      'MonId': 'PES',
      'MonCotiz': 1
    };

    // Solicitar CAE a AFIP
    const afipResponse = await afip.ElectronicBilling.createVoucher(invoiceData);

    if (afipResponse.CAE) {
      // CAE obtenido exitosamente
      const cae = afipResponse.CAE;
      const caeExpiration = afipResponse.CAEFchVto;
      const invoiceNumber = `${String(config.puntoVenta).padStart(4, '0')}-${String(nextNumber).padStart(8, '0')}`;

      // Parsear fecha de vencimiento CAE (formato YYYYMMDD)
      const caeExpirationDate = new Date(
        parseInt(caeExpiration.substring(0, 4)),
        parseInt(caeExpiration.substring(4, 6)) - 1,
        parseInt(caeExpiration.substring(6, 8))
      );

      // Crear registro de factura
      const invoice = await prisma.invoice.create({
        data: {
          saleId,
          invoiceType: 'C',
          invoiceNumber,
          puntoVenta: config.puntoVenta,
          cae,
          caeExpiration: caeExpirationDate,
          totalAmount: sale.totalAmount,
          customerName: customerName || null,
          customerDni: customerDni || null,
          status: 'issued'
        }
      });

      // Generar PDF en memoria (base64)
      const pdfBase64 = await generateInvoicePDF(invoice.id, sale, config, {
        cae,
        caeExpiration: caeExpirationDate.toISOString(),
        invoiceNumber,
        customerName,
        customerDni
      });

      // Guardar PDF base64 en la DB
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          pdfData: pdfBase64,
          pdfPath: `/api/invoices/${invoice.id}/pdf`
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Factura emitida exitosamente',
        invoice: {
          id: invoice.id,
          number: invoiceNumber,
          cae,
          caeExpiration: caeExpirationDate,
          pdfUrl: `/api/invoices/${invoice.id}/pdf`
        }
      });
    } else {
      // Error al obtener CAE
      const errorMessage = afipResponse.Observaciones?.[0]?.Msg || 'Error desconocido al solicitar CAE';

      const invoice = await prisma.invoice.create({
        data: {
          saleId,
          invoiceType: 'C',
          invoiceNumber: 'ERROR',
          puntoVenta: config.puntoVenta,
          totalAmount: sale.totalAmount,
          customerName: customerName || null,
          customerDni: customerDni || null,
          status: 'error',
          errorMessage
        }
      });

      return NextResponse.json({
        success: false,
        error: 'Error al obtener CAE de AFIP',
        details: errorMessage,
        observaciones: afipResponse.Observaciones
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error issuing invoice:', error);
    return NextResponse.json({
      error: 'Error al emitir factura',
      details: error.message
    }, { status: 500 });
  }
}
