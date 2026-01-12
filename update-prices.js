// Script para actualizar precios de productos de ejemplo
// Los productos importados tienen precios en 0, este script los actualiza

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePrices() {
  try {
    console.log('🔧 Actualizando precios de productos...\n');

    // Obtener las primeras 10 variantes con precios en 0
    const variants = await prisma.productVariant.findMany({
      where: {
        OR: [
          { priceCash: 0 },
          { priceDebit: 0 },
          { priceFinanced: 0 }
        ]
      },
      take: 10,
      include: {
        product: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`Encontradas ${variants.length} variantes con precios en 0\n`);

    let updated = 0;
    for (const variant of variants) {
      // Calcular precios basados en el costo
      const costPrice = parseFloat(variant.costPrice.toString());
      const priceCash = Math.round(costPrice * 1.5); // 50% margen
      const priceDebit = Math.round(costPrice * 1.6); // 60% margen
      const priceFinanced = Math.round(costPrice * 1.8); // 80% margen

      await prisma.productVariant.update({
        where: { id: variant.id },
        data: {
          priceCash,
          priceDebit,
          priceFinanced
        }
      });

      console.log(`✓ ${variant.product.name} (${variant.size} - ${variant.color})`);
      console.log(`  Costo: $${costPrice}`);
      console.log(`  Contado: $${priceCash} | Débito: $${priceDebit} | Financiado: $${priceFinanced}`);
      console.log('');

      updated++;
    }

    console.log(`\n✅ ${updated} variantes actualizadas con precios`);
    console.log('Ya puedes probar el sistema de ventas con estos productos');

  } catch (error) {
    console.error('❌ Error al actualizar precios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePrices();
