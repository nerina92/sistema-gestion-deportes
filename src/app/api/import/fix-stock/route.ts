import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api-auth';


// Endpoint temporal para corregir variantes con stock 0 que deberían tener 1
// (productos importados desde Excel que están marcados como "no vendido")
export async function POST() {
  const ctx = await requireTenant('productos-editar');
  if (ctx instanceof NextResponse) return ctx;
  const prisma = ctx.db;

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
