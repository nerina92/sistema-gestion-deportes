#!/bin/bash

# Login y obtener cookie
curl -s http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@deporteslaboulaye.com","password":"Admin123!"}' \
  -c /tmp/test-cookies.txt > /dev/null

echo "=== TEST: Crear una venta ==="
# Obtener primera variante con stock y precios > 0
VARIANT_DATA=$(curl -s "http://localhost:3000/api/products?page=1&pageSize=50" \
  -b /tmp/test-cookies.txt | jq -r '.products[].variants[] | select(.stockQuantity > 0 and .priceCash > 0) | {id, stock: .stockQuantity, price: .priceCash} | @json' | head -n 1)

VARIANT_ID=$(echo "$VARIANT_DATA" | jq -r '.id')
STOCK_INICIAL=$(echo "$VARIANT_DATA" | jq -r '.stock')
PRICE=$(echo "$VARIANT_DATA" | jq -r '.price')

echo "Variante: $VARIANT_ID"
echo "Stock inicial: $STOCK_INICIAL"
echo "Precio contado: \$$PRICE"
echo ""

# Crear venta
SALE_PAYLOAD="{
  \"saleDate\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\",
  \"paymentMethod\": \"cash\",
  \"priceType\": \"cash\",
  \"notes\": \"Venta de prueba US-010\",
  \"items\": [{
    \"productVariantId\": \"$VARIANT_ID\",
    \"quantity\": 2
  }]
}"

echo "Creando venta..."
SALE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -b /tmp/test-cookies.txt \
  -d "$SALE_PAYLOAD")

echo "$SALE_RESPONSE" | jq '.'

# Verificar stock
STOCK_ACTUAL=$(curl -s "http://localhost:3000/api/products?page=1&pageSize=50" \
  -b /tmp/test-cookies.txt | jq -r ".products[].variants[] | select(.id == \"$VARIANT_ID\") | .stockQuantity")

echo ""
echo "Stock después de venta: $STOCK_ACTUAL"
echo "Stock esperado: $((STOCK_INICIAL - 2))"

if [ "$STOCK_ACTUAL" -eq "$((STOCK_INICIAL - 2))" ]; then
  echo "✅ Stock decrementado correctamente!"
else
  echo "❌ Error en decremento de stock"
fi
