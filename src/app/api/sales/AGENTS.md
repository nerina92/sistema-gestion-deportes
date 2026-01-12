# Sales API - AGENTS.md

## Overview
Sales API endpoints for registering sales with automatic stock management.

## Endpoints

### POST /api/sales
Creates a new sale and automatically decrements stock.

**Request Body:**
```json
{
  "saleDate": "2026-01-12T21:00:00.000Z",
  "paymentMethod": "cash" | "card" | "transfer",
  "priceType": "cash" | "debit" | "financed",
  "notes": "Optional notes",
  "items": [
    {
      "productVariantId": "variant-id",
      "quantity": 2
    }
  ]
}
```

**Business Logic:**
1. Validates stock availability for ALL items before processing
2. Calculates unit price based on `priceType`:
   - `cash` → uses `variant.priceCash`
   - `debit` → uses `variant.priceDebit`
   - `financed` → uses `variant.priceFinanced`
3. Calculates subtotals and total automatically
4. Creates sale record with all items
5. Decrements stock for each variant
6. All operations in a single Prisma transaction (rollback on any error)

**Response (Success):**
```json
{
  "success": true,
  "message": "Venta registrada exitosamente",
  "data": {
    "id": "sale-id",
    "totalAmount": "12500",
    "items": [...]
  }
}
```

**Response (Error - Insufficient Stock):**
```json
{
  "success": false,
  "error": "Stock insuficiente para Remera XL (Large - Azul). Disponible: 2, Solicitado: 5"
}
```

### GET /api/sales
Lists all sales ordered by date (descending).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sale-id",
      "saleDate": "2026-01-12T21:00:00.000Z",
      "paymentMethod": "cash",
      "priceType": "cash",
      "totalAmount": "12500",
      "itemCount": 3,
      "notes": "...",
      "createdAt": "..."
    }
  ]
}
```

### GET /api/sales/:id
Gets detailed information about a specific sale including all items.

**Important:** In Next.js 15+, `params` is a Promise:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Must await!
}
```

## Key Patterns

### Transaction Pattern
Always use Prisma transactions for operations that modify multiple records:
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Validate business rules
  // 2. Create main record
  // 3. Update related records
  // Any error thrown will rollback ALL changes
});
```

### Decimal Calculations
Use Decimal methods for monetary calculations:
```typescript
const subtotal = unitPrice.mul(quantity); // Not unitPrice * quantity
const total = items.reduce((sum, item) => sum.add(item.subtotal), new Decimal(0));
```

### Error Handling
- Throw descriptive errors in transactions (automatic rollback)
- Include specific details (product name, variant, available stock)
- Catch and categorize errors by type for appropriate HTTP status codes

## Common Gotchas

1. **Next.js 15+ params**: Always `await params` in dynamic routes `[id]`
2. **Decimal vs Number**: Prisma Decimal type requires `.mul()`, `.add()` methods
3. **Stock validation**: Check stock BEFORE creating sale to prevent partial operations
4. **Transaction scope**: All DB operations that depend on each other MUST be in same transaction
5. **Price selection**: priceType determines which price field to use, not a manual input

## Testing

Run sales tests:
```bash
# Update some product prices first (imported products have prices = 0)
node update-prices.js

# Test sales API
node test-sales-api.js
# or
bash test-sales-api.sh
```

## Dependencies

- `@prisma/client` - Database ORM
- `@prisma/client/runtime/library` - Decimal type for monetary values
- Requires authentication middleware (JWT token cookie)

## Related Files

- `route.ts` - Main sales endpoints (POST, GET list)
- `[id]/route.ts` - Sale detail endpoint (GET)
- `/api/products` - Product and variant data
- `/api/auth` - Authentication for protected endpoints

## Future Enhancements

- Add sale cancellation (PUT /api/sales/:id/cancel with stock restoration)
- Add sale filtering (by date range, payment method, etc.)
- Add pagination for large result sets
- Add sale item returns/exchanges
- Add payment installments tracking for financed sales
