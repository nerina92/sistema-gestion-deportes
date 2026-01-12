#!/bin/bash

# Script para probar APIs de compras - US-007
echo "🧪 Testing US-007: APIs de Compras"
echo ""

# Test 1: GET /api/purchases (debe retornar array vacío)
echo "1️⃣ Probando GET /api/purchases (listar compras)"
curl -s -w "Status: %{http_code}\n" 'http://localhost:3000/api/purchases' | jq '.' 2>/dev/null || echo "No JSON response"
echo ""

# Test 2: GET /api/suppliers (obtener proveedores)
echo "2️⃣ Obteniendo proveedores activos"
SUPPLIERS_RESPONSE=$(curl -s 'http://localhost:3000/api/suppliers?isActive=true')
echo "$SUPPLIERS_RESPONSE" | jq '.' 2>/dev/null || echo "No JSON response"

# Extraer el primer supplier ID
SUPPLIER_ID=$(echo "$SUPPLIERS_RESPONSE" | jq -r '.[0].id // empty' 2>/dev/null)
if [ -z "$SUPPLIER_ID" ]; then
  echo "❌ No se pudo obtener supplier ID"
  exit 1
fi
echo "✅ Using supplier ID: $SUPPLIER_ID"
echo ""

# Test 3: GET /api/products (obtener productos con variantes)
echo "3️⃣ Obteniendo productos con variantes"
PRODUCTS_RESPONSE=$(curl -s 'http://localhost:3000/api/products?page=1&limit=2')
echo "$PRODUCTS_RESPONSE" | jq '.data[0:2] | .[].variants[0] | {id, size, color, stockQuantity}' 2>/dev/null || echo "No products found"

# Extraer variant IDs (necesitamos al menos 2)
VARIANT1_ID=$(echo "$PRODUCTS_RESPONSE" | jq -r '.data[0].variants[0].id // empty' 2>/dev/null)
VARIANT2_ID=$(echo "$PRODUCTS_RESPONSE" | jq -r '.data[0].variants[1].id // .data[1].variants[0].id // empty' 2>/dev/null)

if [ -z "$VARIANT1_ID" ] || [ -z "$VARIANT2_ID" ]; then
  echo "❌ No se pudieron obtener 2 variant IDs"
  echo "VARIANT1_ID: $VARIANT1_ID"
  echo "VARIANT2_ID: $VARIANT2_ID"
  exit 1
fi
echo "✅ Using variant IDs: $VARIANT1_ID, $VARIANT2_ID"
echo ""

# Test 4: POST /api/purchases (crear compra)
echo "4️⃣ Probando POST /api/purchases (crear compra)"

# Crear el JSON para la nueva compra
PURCHASE_JSON=$(cat <<EOF
{
  "supplierId": "$SUPPLIER_ID",
  "purchaseDate": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "notes": "Compra de prueba - US-007",
  "items": [
    {
      "productVariantId": "$VARIANT1_ID",
      "quantity": 10,
      "unitCost": 1500.00
    },
    {
      "productVariantId": "$VARIANT2_ID", 
      "quantity": 5,
      "unitCost": 2000.00
    }
  ]
}
EOF
)

echo "Enviando compra..."
CREATE_RESPONSE=$(curl -s -w "Status: %{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "$PURCHASE_JSON" \
  'http://localhost:3000/api/purchases')

echo "$CREATE_RESPONSE" | sed 's/Status: [0-9]*$//' | jq '.' 2>/dev/null || echo "No JSON response"
PURCHASE_ID=$(echo "$CREATE_RESPONSE" | sed 's/Status: [0-9]*$//' | jq -r '.data.id // empty' 2>/dev/null)

if [ -n "$PURCHASE_ID" ]; then
  echo "✅ Compra creada con ID: $PURCHASE_ID"
else
  echo "❌ Error al crear compra"
  exit 1
fi
echo ""

# Test 5: GET /api/purchases/[id] (obtener compra específica)
echo "5️⃣ Probando GET /api/purchases/$PURCHASE_ID"
curl -s -w "Status: %{http_code}\n" "http://localhost:3000/api/purchases/$PURCHASE_ID" | jq '.data | {id, totalAmount, status, itemCount}' 2>/dev/null || echo "No JSON response"
echo ""

echo "✅ Tests básicos completados para US-007!"
echo ""
echo "📝 Para verificar stock actualizado, revisa los productos en el navegador:"
echo "   http://localhost:3000/productos"