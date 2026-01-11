const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedProducts() {
  try {
    console.log('🌱 Creando productos de ejemplo...');

    // Crear productos con sus variantes
    const products = [
      {
        name: 'Zapatillas Running Pro',
        brand: 'Nike',
        category: 'Calzado',
        barcode: '1234567890123',
        description: 'Zapatillas profesionales para running con amortiguación avanzada',
        imageUrl: 'https://via.placeholder.com/300x300?text=Nike+Running',
        variants: [
          { size: '39', color: 'Negro', sku: 'NIKE-RUN-39-NEG', costPrice: 45000, stockQuantity: 25, minStockAlert: 5, priceCash: 89990, priceDebit: 94990, priceFinanced: 99990 },
          { size: '40', color: 'Negro', stock_quantity: 30, min_stock_alert: 5, price_cash: 89990 },
          { size: '41', color: 'Negro', stock_quantity: 15, min_stock_alert: 5, price_cash: 89990 },
          { size: '39', color: 'Blanco', stock_quantity: 20, min_stock_alert: 5, price_cash: 89990 },
          { size: '40', color: 'Blanco', stock_quantity: 3, min_stock_alert: 5, price_cash: 89990 }, // Stock bajo
        ]
      },
      {
        name: 'Pelota de Fútbol Oficial',
        brand: 'Adidas',
        category: 'Deportes',
        barcode: '9876543210987',
        description: 'Pelota oficial de fútbol FIFA aprobada',
        image_url: 'https://via.placeholder.com/300x300?text=Adidas+Ball',
        variants: [
          { size: 'Talla 5', color: 'Blanco/Negro', stock_quantity: 50, min_stock_alert: 10, price_cash: 45990 },
        ]
      },
      {
        name: 'Camiseta Deportiva',
        brand: 'Under Armour',
        category: 'Ropa',
        barcode: '5555666677778',
        description: 'Camiseta deportiva con tecnología de secado rápido',
        variants: [
          { size: 'S', color: 'Azul', stock_quantity: 12, min_stock_alert: 5, price_cash: 29990 },
          { size: 'M', color: 'Azul', stock_quantity: 8, min_stock_alert: 5, price_cash: 29990 },
          { size: 'L', color: 'Azul', stock_quantity: 2, min_stock_alert: 5, price_cash: 29990 }, // Stock bajo
          { size: 'XL', color: 'Azul', stock_quantity: 15, min_stock_alert: 5, price_cash: 29990 },
          { size: 'S', color: 'Rojo', stock_quantity: 10, min_stock_alert: 5, price_cash: 29990 },
          { size: 'M', color: 'Rojo', stock_quantity: 1, min_stock_alert: 5, price_cash: 29990 }, // Stock bajo
        ]
      },
      {
        name: 'Raqueta de Tenis Pro',
        brand: 'Wilson',
        category: 'Deportes',
        barcode: '1111222233334',
        description: 'Raqueta profesional de tenis con marco de carbono',
        variants: [
          { size: 'Adulto', color: 'Negro/Amarillo', stock_quantity: 8, min_stock_alert: 3, price_cash: 159990 },
        ]
      },
      {
        name: 'Short Deportivo',
        brand: 'Puma',
        category: 'Ropa',
        barcode: '9999888877776',
        description: 'Short deportivo con cintura elástica',
        variants: [
          { size: 'S', color: 'Negro', stock_quantity: 0, min_stock_alert: 5, price_cash: 19990 }, // Sin stock
          { size: 'M', color: 'Negro', stock_quantity: 0, min_stock_alert: 5, price_cash: 19990 }, // Sin stock
          { size: 'L', color: 'Negro', stock_quantity: 0, min_stock_alert: 5, price_cash: 19990 }, // Sin stock
        ]
      },
      {
        name: 'Botines de Fútbol',
        brand: 'Nike',
        category: 'Calzado',
        barcode: '4444555566667',
        description: 'Botines profesionales con tapones removibles',
        variants: [
          { size: '38', color: 'Negro', stock_quantity: 6, min_stock_alert: 5, price_cash: 79990 },
          { size: '39', color: 'Negro', stock_quantity: 12, min_stock_alert: 5, price_cash: 79990 },
          { size: '40', color: 'Negro', stock_quantity: 8, min_stock_alert: 5, price_cash: 79990 },
          { size: '41', color: 'Negro', stock_quantity: 4, min_stock_alert: 5, price_cash: 79990 }, // Stock bajo
        ]
      },
      {
        name: 'Mochila Deportiva Grande',
        brand: 'Adidas',
        category: 'Accesorios',
        barcode: '7777888899990',
        description: 'Mochila espaciosa con compartimientos especializados',
        variants: [
          { size: 'Única', color: 'Negro', stock_quantity: 15, min_stock_alert: 3, price_cash: 39990 },
          { size: 'Única', color: 'Azul', stock_quantity: 12, min_stock_alert: 3, price_cash: 39990 },
        ]
      },
      {
        name: 'Guantes de Boxeo',
        brand: 'Everlast',
        category: 'Deportes',
        barcode: '3333444455556',
        description: 'Guantes profesionales de boxeo con relleno de espuma',
        variants: [
          { size: '12oz', color: 'Rojo', stock_quantity: 6, min_stock_alert: 2, price_cash: 69990 },
          { size: '14oz', color: 'Rojo', stock_quantity: 4, min_stock_alert: 2, price_cash: 74990 },
          { size: '16oz', color: 'Rojo', stock_quantity: 1, min_stock_alert: 2, price_cash: 79990 }, // Stock bajo
        ]
      }
    ];

    for (const productData of products) {
      const { variants, ...productInfo } = productData;
      
      const product = await prisma.product.create({
        data: productInfo
      });

      for (const variant of variants) {
        await prisma.productVariant.create({
          data: {
            ...variant,
            product_id: product.id
          }
        });
      }

      console.log(`✅ Producto creado: ${product.name}`);
    }

    console.log('🎉 ¡Productos de ejemplo creados exitosamente!');
    console.log(`📊 Total de productos: ${products.length}`);
    
  } catch (error) {
    console.error('❌ Error creando productos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedProducts();