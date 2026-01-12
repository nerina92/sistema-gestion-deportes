#!/usr/bin/env node

/**
 * Script de prueba para la API de productos
 */

const BASE_URL = 'http://localhost:3000';

// Datos de prueba
const testProduct = {
  name: 'Camiseta Nike',
  brand: 'Nike',
  category: 'Remeras',
  description: 'Camiseta deportiva de algodón',
  barcode: 'NIKE001',
  imageUrl: 'https://example.com/nike-shirt.jpg',
  variants: [
    {
      size: 'S',
      color: 'Azul',
      sku: 'NIKE-SHIRT-S-AZUL',
      costPrice: 15.00,
      priceCash: 25.00,
      priceDebit: 27.00,
      priceFinanced: 30.00,
      stockQuantity: 10,
      minStockAlert: 2
    },
    {
      size: 'M',
      color: 'Azul',
      sku: 'NIKE-SHIRT-M-AZUL',
      costPrice: 15.00,
      priceCash: 25.00,
      priceDebit: 27.00,
      priceFinanced: 30.00,
      stockQuantity: 1, // Stock bajo para probar filtro
      minStockAlert: 2
    }
  ]
};

async function loginAndGetCookie() {
  console.log('🔐 Iniciando sesión...');
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@deporteslaboulaye.com',
      password: 'Admin123!',
    }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const cookies = response.headers.get('set-cookie');
  return cookies;
}

async function testProductsAPI() {
  console.log('🧪 Iniciando pruebas de API de productos...\n');

  try {
    // 1. Login y obtener cookie
    const authCookie = await loginAndGetCookie();
    console.log('✅ Login exitoso\n');

    // 2. Crear producto
    console.log('1️⃣ Probando POST /api/products (crear producto)...');
    const createResponse = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie || '',
      },
      body: JSON.stringify(testProduct),
    });

    const createData = await createResponse.json();
    console.log('Status:', createResponse.status);
    console.log('Response:', JSON.stringify(createData, null, 2));

    let productId = '';
    if (createResponse.ok && createData.id) {
      productId = createData.id;
      console.log('✅ Producto creado exitosamente');
    } else {
      console.log('❌ Error al crear producto');
    }

    console.log('\n---\n');

    // 3. Listar productos
    console.log('2️⃣ Probando GET /api/products (listar productos)...');
    const listResponse = await fetch(`${BASE_URL}/api/products?page=1&limit=5`, {
      headers: {
        'Cookie': authCookie || '',
      }
    });

    const listData = await listResponse.json();
    console.log('Status:', listResponse.status);
    console.log('Products found:', listData.products?.length || 0);
    console.log('Pagination:', listData.pagination);

    if (listResponse.ok) {
      console.log('✅ Lista de productos obtenida');
    } else {
      console.log('❌ Error al listar productos');
    }

    console.log('\n---\n');

    // 4. Obtener producto por ID (si se creó)
    if (productId) {
      console.log('3️⃣ Probando GET /api/products/:id (obtener producto)...');
      const getResponse = await fetch(`${BASE_URL}/api/products/${productId}`, {
        headers: {
          'Cookie': authCookie || '',
        }
      });

      const getData = await getResponse.json();
      console.log('Status:', getResponse.status);
      console.log('Product name:', getData.name);
      console.log('Variants count:', getData.variants?.length || 0);

      if (getResponse.ok) {
        console.log('✅ Producto obtenido por ID');
      } else {
        console.log('❌ Error al obtener producto por ID');
      }

      console.log('\n---\n');

      // 5. Actualizar producto
      console.log('4️⃣ Probando PUT /api/products/:id (actualizar producto)...');
      const updatedProduct = {
        ...testProduct,
        name: 'Camiseta Nike Actualizada',
        variants: [
          ...testProduct.variants,
          {
            size: 'L',
            color: 'Rojo',
            sku: 'NIKE-SHIRT-L-ROJO',
            costPrice: 16.00,
            priceCash: 26.00,
            priceDebit: 28.00,
            priceFinanced: 31.00,
            stockQuantity: 5,
            minStockAlert: 1
          }
        ]
      };

      const updateResponse = await fetch(`${BASE_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie || '',
        },
        body: JSON.stringify(updatedProduct),
      });

      const updateData = await updateResponse.json();
      console.log('Status:', updateResponse.status);
      console.log('Updated product name:', updateData.name);
      console.log('Variants after update:', updateData.variants?.length || 0);

      if (updateResponse.ok) {
        console.log('✅ Producto actualizado');
      } else {
        console.log('❌ Error al actualizar producto');
      }

      console.log('\n---\n');

      // 6. Probar filtro de stock bajo
      console.log('5️⃣ Probando filtro de stock bajo...');
      const lowStockResponse = await fetch(`${BASE_URL}/api/products?lowStock=true`, {
        headers: {
          'Cookie': authCookie || '',
        }
      });

      const lowStockData = await lowStockResponse.json();
      console.log('Status:', lowStockResponse.status);
      console.log('Products with low stock:', lowStockData.products?.length || 0);

      if (lowStockResponse.ok) {
        console.log('✅ Filtro de stock bajo funcionando');
      } else {
        console.log('❌ Error en filtro de stock bajo');
      }

      console.log('\n---\n');

      // 7. Intentar eliminar producto (debería fallar si tiene stock)
      console.log('6️⃣ Probando DELETE /api/products/:id (eliminar producto con stock)...');
      const deleteResponse = await fetch(`${BASE_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Cookie': authCookie || '',
        }
      });

      const deleteData = await deleteResponse.json();
      console.log('Status:', deleteResponse.status);
      console.log('Response:', deleteData.error || deleteData.message);

      if (deleteResponse.status === 400) {
        console.log('✅ Eliminación correctamente bloqueada (producto con stock)');
      } else {
        console.log('❌ Eliminación no manejada correctamente');
      }
    }

    console.log('\n🎉 Pruebas completadas!');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

// Ejecutar pruebas
testProductsAPI().catch(console.error);