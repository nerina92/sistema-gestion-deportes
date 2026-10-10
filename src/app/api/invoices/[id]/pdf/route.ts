import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Descargar PDF de factura
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    if (!invoice.pdfData) {
      return NextResponse.json({ error: 'PDF no disponible' }, { status: 404 });
    }

    // Convertir base64 a buffer
    const pdfBuffer = Buffer.from(invoice.pdfData, 'base64');

    // Retornar PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Factura-${invoice.invoiceNumber}.pdf"`
      }
    });
  } catch (error: any) {
    console.error('Error downloading PDF:', error);
    return NextResponse.json({
      error: 'Error al descargar PDF',
      details: error.message
    }, { status: 500 });
  }
}
