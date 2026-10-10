import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api-auth';


// GET - Obtener factura de una venta
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const ctx = await requireTenant('facturas');
  if (ctx instanceof NextResponse) return ctx;
  const prisma = ctx.db;

  try {
    const { saleId } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { saleId },
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
      return NextResponse.json({
        success: false,
        error: 'Esta venta no tiene factura emitida'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: invoice
    });
  } catch (error: any) {
    console.error('Error fetching invoice by sale:', error);
    return NextResponse.json({
      error: 'Error al obtener factura',
      details: error.message
    }, { status: 500 });
  }
}
