import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Borra todas las variantes y productos (no toca ventas, compras ni facturas)
export async function POST() {
  try {
    // Primero variantes, luego productos (por foreign key)
    const variants = await prisma.productVariant.deleteMany({});
    const products = await prisma.product.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Base de datos limpiada: ${products.count} productos y ${variants.count} variantes eliminados`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
