// Script para generar datos de prueba realistas para testing
// Ejecutar con: node scripts/generate-test-data.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateTestData() {
  console.log('🌱 Generando datos de prueba para testing...\n');

  try {
    // 1. Crear algunos productos con variantes y diferentes niveles de stock
    console.log('📦 Creando productos de prueba...');
    
    const testProducts = [
      {
        name: 'Remera Deportiva Test',
        brand: 'Nike',
        category: 'Remeras',
        variants: [
          { size: 'S', color: 'Azul', stock: 15, prices: { cash: 5000, debit: 5300, financed: 5800 } },
          { size: 'M', color: 'Azul', stock: 20, prices: { cash: 5000, debit: 5300, financed: 5800 } },
          { size: 'L', color: 'Azul', stock: 2, prices: { cash: 5000, debit: 5300, financed: 5800 } }, // Stock bajo
        ]
      },
      {
        name: 'Short Running Test',
        brand: 'Adidas',
        category: 'Shorts',
        variants: [
          { size: 'M', color: 'Negro', stock: 0, prices: { cash: 4500, debit: 4800, financed: 5200 } }, // Sin stock
          { size: 'L', color: 'Negro', stock: 25, prices: { cash: 4500, debit: 4800, financed: 5200 } },
        ]
      },
      {
        name: 'Calza Deportiva Test',
        brand: 'Puma',
        category: 'Pantalones',
        variants: [
          { size: 'S', color: 'Gris', stock: 1, prices: { cash: 6000, debit: 6400, financed: 7000 } }, // Stock crítico
          { size: 'M', color: 'Gris', stock: 30, prices: { cash: 6000, debit: 6400, financed: 7000 } },
        ]
      },
      {
        name: 'Zapatillas Running Test',
        brand: 'Nike',
        category: 'Calzado',
        variants: [
          { size: '40', color: 'Blanco', stock: 10, prices: { cash: 15000, debit: 16000, financed: 18000 } },
          { size: '42', color: 'Blanco', stock: 5, prices: { cash: 15000, debit: 16000, financed: 18000 } },
        ]
      },
    ];

    for (const prod of testProducts) {
      const product = await prisma.product.create({
        data: {
          name: prod.name,
          brand: prod.brand,
          category: prod.category,
          variants: {
            create: prod.variants.map(v => ({
              size: v.size,
              color: v.color,
              sku: `TEST-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
              costPrice: v.prices.cash * 0.6, // 40% margen
              priceCash: v.prices.cash,
              priceDebit: v.prices.debit,
              priceFinanced: v.prices.financed,
              stockQuantity: v.stock,
              minStockAlert: 5
            }))
          }
        }
      });
      console.log(`  ✓ ${product.name} con ${prod.variants.length} variantes`);
    }

    // 2. Crear proveedores de prueba
    console.log('\n🏢 Creando proveedores de prueba...');
    
    const suppliers = [
      { name: 'Proveedor Test Activo', email: 'activo@test.com', phone: '123456789', isActive: true },
      { name: 'Proveedor Test Inactivo', email: 'inactivo@test.com', phone: '987654321', isActive: false },
    ];

    for (const sup of suppliers) {
      const supplier = await prisma.supplier.create({
        data: sup
      });
      console.log(`  ✓ ${supplier.name} (${supplier.isActive ? 'Activo' : 'Inactivo'})`);
    }

    // 3. Crear algunas compras
    console.log('\n📥 Creando compras de prueba...');
    
    const activeSupplier = await prisma.supplier.findFirst({ where: { isActive: true } });
    const productsForPurchase = await prisma.product.findMany({
      where: { name: { contains: 'Test' } },
      include: { variants: true },
      take: 2
    });

    if (activeSupplier && productsForPurchase.length > 0) {
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - 5); // 5 días atrás

      const items = productsForPurchase.flatMap(p => 
        p.variants.slice(0, 1).map(v => ({
          productVariantId: v.id,
          quantity: 10,
          unitCost: v.costPrice,
          subtotal: v.costPrice * 10
        }))
      );

      const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.subtotal.toString()), 0);

      const purchase = await prisma.purchase.create({
        data: {
          supplierId: activeSupplier.id,
          purchaseDate,
          totalAmount,
          items: {
            create: items
          }
        }
      });
      console.log(`  ✓ Compra registrada con ${items.length} items - Total: $${totalAmount}`);
    }

    // 4. Crear algunas ventas de prueba
    console.log('\n💰 Creando ventas de prueba...');
    
    const productsForSale = await prisma.product.findMany({
      where: { 
        name: { contains: 'Test' },
        variants: { some: { stockQuantity: { gt: 5 } } }
      },
      include: { variants: true },
      take: 3
    });

    // Venta de hoy
    const today = new Date();
    const saleVariants = productsForSale
      .flatMap(p => p.variants.filter(v => v.stockQuantity > 5))
      .slice(0, 2);

    if (saleVariants.length > 0) {
      const saleItems = saleVariants.map(v => ({
        productVariantId: v.id,
        quantity: 2,
        unitPrice: v.priceCash,
        subtotal: v.priceCash * 2
      }));

      const saleTotal = saleItems.reduce((sum, item) => sum + parseFloat(item.subtotal.toString()), 0);

      const sale1 = await prisma.sale.create({
        data: {
          saleDate: today,
          paymentMethod: 'cash',
          priceType: 'cash',
          totalAmount: saleTotal,
          notes: 'Venta de prueba - Hoy',
          items: { create: saleItems }
        }
      });
      console.log(`  ✓ Venta de hoy - Total: $${saleTotal}`);

      // Actualizar stock
      for (const item of saleItems) {
        await prisma.productVariant.update({
          where: { id: item.productVariantId },
          data: { stockQuantity: { decrement: item.quantity } }
        });
      }
    }

    // Venta de la semana pasada
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    if (saleVariants.length > 1) {
      const variant = saleVariants[1];
      const sale2 = await prisma.sale.create({
        data: {
          saleDate: lastWeek,
          paymentMethod: 'card',
          priceType: 'debit',
          totalAmount: variant.priceDebit * 1,
          notes: 'Venta de prueba - Semana pasada',
          items: {
            create: [{
              productVariantId: variant.id,
              quantity: 1,
              unitPrice: variant.priceDebit,
              subtotal: variant.priceDebit
            }]
          }
        }
      });
      console.log(`  ✓ Venta semana pasada - Total: $${variant.priceDebit}`);

      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { stockQuantity: { decrement: 1 } }
      });
    }

    console.log('\n✅ Datos de prueba generados exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`  - ${testProducts.length} productos con variantes`);
    console.log(`  - ${suppliers.length} proveedores`);
    console.log(`  - ~1-2 compras`);
    console.log(`  - ~2 ventas`);
    console.log(`  - Productos con stock bajo para alertas`);
    console.log('\n🧪 Ahora puedes comenzar el testing!');

  } catch (error) {
    console.error('❌ Error generando datos de prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
generateTestData();
