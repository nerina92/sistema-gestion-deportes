import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Borra todas las variantes y productos.
// Orden correcto por foreign keys:
//   SaleItem → PurchaseItem → ProductVariant → Product
// Las cabeceras de ventas y compras quedan, solo se borran los items de detalle.
export async function POST() {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Borrar items de ventas (referencian variantes)
      await tx.saleItem.deleteMany({});
      // 2. Borrar items de compras (referencian variantes)
      await tx.purchaseItem.deleteMany({});
      // 3. Ahora sí podemos borrar variantes
      await tx.productVariant.deleteMany({});
      // 4. Y finalmente los productos
      await tx.product.deleteMany({});
    });

    return NextResponse.json({
      success: true,
      message: 'Base de datos limpiada. Todos los productos y variantes fueron eliminados. Podés reimportar el Excel.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
