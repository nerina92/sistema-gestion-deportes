import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Endpoint temporal para corregir variantes con stock 0 que deberían tener 1
// (productos importados desde Excel que están marcados como "no vendido")
export async function POST() {
  try {
    const result = await prisma.productVariant.updateMany({
      where: {
        stockQuantity: 0
      },
      data: {
        stockQuantity: 1
      }
    });

    return NextResponse.json({
      success: true,
      message: `Se corrigieron ${result.count} variantes con stock 0 → 1`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
