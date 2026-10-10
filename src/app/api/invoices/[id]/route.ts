import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Obtener factura por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        sale: {
          include: {
            items: {
              include: {
                productVariant: {
                  include: {
                    product: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: invoice
    });
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({
      error: 'Error al obtener factura',
      details: error.message
    }, { status: 500 });
  }
}
