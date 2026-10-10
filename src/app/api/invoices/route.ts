import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Listar todas las facturas
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          sale: {
            select: {
              id: true,
              saleDate: true,
              totalAmount: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.invoice.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({
      error: 'Error al obtener facturas',
      details: error.message
    }, { status: 500 });
  }
}
