const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const variantId = 'cmk9uh56u009kisj3nqldlelr';
  
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true }
  });
  
  const cost = parseFloat(variant.costPrice.toString());
  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      priceCash: Math.round(cost * 1.5),
      priceDebit: Math.round(cost * 1.6),
      priceFinanced: Math.round(cost * 1.8)
    }
  });
  
  console.log(`✓ Actualizado: ${variant.product.name}`);
  console.log(`  Contado: $${Math.round(cost * 1.5)}`);
  console.log(`  Débito: $${Math.round(cost * 1.6)}`);
  console.log(`  Financiado: $${Math.round(cost * 1.8)}`);
}

main().finally(() => prisma.$disconnect());
