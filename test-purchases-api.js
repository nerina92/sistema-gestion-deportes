// Script para probar APIs de compras - US-007
const baseURL = 'http://localhost:3000/api';

// Función helper para hacer peticiones
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(`${baseURL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    const data = await response.json();
    console.log(`${options.method || 'GET'} ${url}:`, {
      status: response.status,
      data
    });
    return data;
  } catch (error) {
    console.error(`Error en ${options.method || 'GET'} ${url}:`, error.message);
  }
}

async function testPurchaseAPIs() {
  console.log('🧪 Testing US-007: APIs de Compras\n');
  
  // 1. Test GET /api/purchases (debe retornar array vacío)
  console.log('1️⃣ Probando GET /api/purchases (listar compras)');
  await apiRequest('/purchases');
  
  // 2. Test GET /api/suppliers (necesitamos un supplierId)
  console.log('\n2️⃣ Obteniendo proveedores activos');
  const suppliers = await apiRequest('/suppliers?isActive=true');
  
  if (!suppliers.data || suppliers.data.length === 0) {
    console.log('❌ No hay proveedores activos. Ejecuta el seed: npm run db:seed');
    return;
  }
  
  const supplierId = suppliers.data[0].id;
  console.log(`✅ Using supplier: ${suppliers.data[0].name} (${supplierId})`);
  
  // 3. Test GET /api/products (necesitamos productVariantIds)
  console.log('\n3️⃣ Obteniendo productos con variantes');
  const products = await apiRequest('/products?page=1&limit=5');
  
  if (!products.data || products.data.length === 0) {
    console.log('❌ No hay productos. Ejecuta el seed o importa productos');
    return;
  }
  
  // Obtener las primeras 2 variantes
  const variants = [];
  for (const product of products.data) {
    for (const variant of product.variants) {
      if (variants.length < 2) {
        variants.push(variant);
      }
    }
  }
  
  if (variants.length < 2) {
    console.log('❌ Se necesitan al menos 2 variantes de producto');
    return;
  }
  
  console.log(`✅ Using variants:`);
  variants.forEach((v, i) => 
    console.log(`   ${i + 1}. ${v.product?.name || 'Product'} - ${v.size} ${v.color} (${v.id})`)
  );
  
  // 4. Test POST /api/purchases (crear compra)
  console.log('\n4️⃣ Probando POST /api/purchases (crear compra)');
  
  const newPurchase = {
    supplierId: supplierId,
    purchaseDate: new Date().toISOString(),
    notes: 'Compra de prueba - US-007',
    items: [
      {
        productVariantId: variants[0].id,
        quantity: 10,
        unitCost: 1500.00
      },
      {
        productVariantId: variants[1].id,
        quantity: 5,
        unitCost: 2000.00
      }
    ]
  };
  
  const createResult = await apiRequest('/purchases', {
    method: 'POST',
    body: JSON.stringify(newPurchase)
  });
  
  if (!createResult.success) {
    console.log('❌ Error al crear compra');
    return;
  }
  
  const purchaseId = createResult.data.id;
  console.log(`✅ Compra creada con ID: ${purchaseId}`);
  
  // 5. Test GET /api/purchases/[id] (obtener compra específica)
  console.log('\n5️⃣ Probando GET /api/purchases/[id] (obtener compra)');
  await apiRequest(`/purchases/${purchaseId}`);
  
  // 6. Verificar que el stock se actualizó
  console.log('\n6️⃣ Verificando actualización de stock');
  const updatedProducts = await apiRequest('/products?page=1&limit=5');
  
  console.log('📊 Stock actualizado:');
  updatedProducts.data.forEach(product => {
    product.variants.forEach(variant => {
      const originalVariant = variants.find(v => v.id === variant.id);
      if (originalVariant) {
        const stockDiff = variant.stockQuantity - (originalVariant.stockQuantity || 0);
        console.log(`   ${product.name} - ${variant.size} ${variant.color}: +${stockDiff} unidades`);
      }
    });
  });
  
  console.log('\n✅ Tests completados para US-007!');
}

// Ejecutar tests solo si está corriendo como script principal
if (require.main === module) {
  testPurchaseAPIs().catch(console.error);
}

module.exports = { testPurchaseAPIs };