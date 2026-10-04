// Crea un negocio de demostración con productos, compras y ventas de los
// últimos 90 días, para probar el sistema en una máquina local.
// Uso: npm run demo -- [email-del-dueño]   (por defecto demo@local.test)
import { platformDb } from '../src/lib/platform-db';
import { getTenantDb } from '../src/lib/tenant-db';
import { computeVariantPrices } from '../src/lib/pricing';
import { createTenant, schemaNameForSlug } from '../src/lib/tenants';

const SLUG = 'ferreteria-demo';
const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = <T,>(xs: T[]) => xs[rnd(0, xs.length - 1)];

const CATALOG: [string, string, string, string[], string[], number][] = [
  ['Tornillo autoperforante', 'Fischer', 'Tornillería', ['6mm', '8mm', '10mm'], ['Acero'], 120],
  ['Tarugo nylon', 'Fischer', 'Tornillería', ['6mm', '8mm'], [''], 40],
  ['Martillo carpintero', 'Stanley', 'Herramientas', ['16oz', '20oz'], [''], 9800],
  ['Destornillador Phillips', 'Bahco', 'Herramientas', ['PH1', 'PH2'], [''], 3200],
  ['Taladro percutor 650W', 'Black+Decker', 'Herramientas', [''], [''], 58000],
  ['Cinta métrica', 'Stanley', 'Herramientas', ['5m', '8m'], [''], 6500],
  ['Látex interior', 'Alba', 'Pinturas', ['4L', '10L', '20L'], ['Blanco'], 14500],
  ['Esmalte sintético', 'Sinteplast', 'Pinturas', ['1L', '4L'], ['Negro', 'Blanco', 'Rojo'], 9800],
  ['Rodillo lana', 'El Galgo', 'Pinturas', ['17cm', '22cm'], [''], 3900],
  ['Cable unipolar', 'Pirelli', 'Electricidad', ['1.5mm', '2.5mm'], ['Rojo', 'Celeste'], 650],
  ['Lámpara LED', 'Philips', 'Electricidad', ['9W', '12W'], ['Fría', 'Cálida'], 2100],
  ['Llave térmica', 'Schneider', 'Electricidad', ['16A', '20A'], [''], 12500],
  ['Caño termofusión', 'Acqua System', 'Plomería', ['20mm', '25mm'], [''], 5400],
  ['Canilla monocomando', 'FV', 'Plomería', [''], ['Cromo'], 48000],
  ['Teflón', 'Genérico', 'Plomería', [''], [''], 450],
];

async function main() {
  const ownerEmail = process.argv[2] || 'demo@local.test';
  if (await platformDb.tenant.findUnique({ where: { slug: SLUG } })) {
    console.log(`El negocio demo ya existe (${SLUG}). Entrá con ${ownerEmail}.`);
    return;
  }
  await createTenant({ name: 'Ferretería Demo', slug: SLUG, businessType: 'ferreteria', ownerEmail });
  const db = getTenantDb(schemaNameForSlug(SLUG));
  await db.tenantSettings.update({ where: { id: 1 }, data: { address: 'Av. Independencia 450', city: 'Laboulaye, Córdoba' } });

  const categories = new Map<string, string>();
  for (const name of new Set(CATALOG.map((c) => c[2]))) {
    categories.set(name, (await db.category.create({ data: { name } })).id);
  }
  const suppliers = await Promise.all(
    ['Distribuidora Centro', 'Herramientas del Sur', 'Pinturerías Unidas'].map((name) =>
      db.supplier.create({ data: { name, phone: `3385-4${rnd(10000, 99999)}` } })
    )
  );

  const variants: { id: string; price: number; cost: number }[] = [];
  let n = 0;
  for (const [name, brand, cat, sizes, colors, cost] of CATALOG) {
    const product = await db.product.create({ data: { name, brand, categoryId: categories.get(cat)! } });
    for (const size of sizes) {
      for (const color of colors) {
        const costPrice = Math.round(cost * (1 + sizes.indexOf(size) * 0.6));
        const prices = computeVariantPrices(costPrice);
        const v = await db.productVariant.create({
          data: { productId: product.id, size, color, sku: `DEMO-${++n}`, costPrice, ...prices, stockQuantity: rnd(0, 40), minStockAlert: 3 },
        });
        variants.push({ id: v.id, price: prices.priceCash, cost: costPrice });
      }
    }
  }

  for (let i = 0; i < 6; i++) {
    const items = Array.from({ length: rnd(2, 5) }, () => {
      const v = pick(variants);
      const quantity = rnd(5, 20);
      return { productVariantId: v.id, quantity, unitCost: v.cost, subtotal: v.cost * quantity };
    });
    await db.purchase.create({
      data: {
        supplierId: pick(suppliers).id,
        purchaseDate: new Date(Date.now() - rnd(1, 60) * 864e5),
        totalAmount: items.reduce((a, x) => a + x.subtotal, 0),
        items: { create: items },
      },
    });
  }

  for (let i = 0; i < 140; i++) {
    const priceType = pick(['cash', 'cash', 'debit', 'financed']);
    const paymentMethod = priceType === 'cash' ? pick(['cash', 'transfer']) : 'card';
    const factor = priceType === 'cash' ? 1 : priceType === 'debit' ? 1.05 : 1.2;
    const items = Array.from({ length: rnd(1, 3) }, () => {
      const v = pick(variants);
      const quantity = rnd(1, 4);
      const unitPrice = Math.round(v.price * factor);
      return { productVariantId: v.id, quantity, unitPrice, subtotal: unitPrice * quantity };
    });
    const saleDate = new Date(Date.now() - Math.pow(Math.random(), 1.3) * 90 * 864e5);
    await db.sale.create({
      data: { saleDate, paymentMethod, priceType, totalAmount: items.reduce((a, x) => a + x.subtotal, 0), items: { create: items } },
    });
  }

  console.log(`Negocio demo creado con ${variants.length} variantes, 6 compras y 140 ventas.`);
  console.log(`Entrá con ${ownerEmail}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => platformDb.$disconnect());
