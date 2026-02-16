import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import path from 'path';

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

    if (!invoice.pdfPath) {
      return NextResponse.json({ error: 'PDF no disponible' }, { status: 404 });
    }

    // Leer archivo PDF
    const pdfFilePath = path.join(process.cwd(), 'public', invoice.pdfPath);
    const pdfBuffer = await readFile(pdfFilePath);

    // Retornar PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Factura-${invoice.invoiceNumber}.pdf"`
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
