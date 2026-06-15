import { computeVariantPrices, roundToHundred, DEFAULT_PRICING } from '../src/lib/pricing';

let failures = 0;
function assertEq(label: string, actual: number, expected: number) {
  if (actual !== expected) {
    console.error(`❌ ${label}: esperado ${expected}, obtenido ${actual}`);
    failures++;
  } else {
    console.log(`✅ ${label} = ${actual}`);
  }
}

// roundToHundred: al más cercano
assertEq('round 190', roundToHundred(190), 200);
assertEq('round 228', roundToHundred(228), 200);
assertEq('round 250', roundToHundred(250), 300);
assertEq('round 240', roundToHundred(240), 200);
assertEq('round 0', roundToHundred(0), 0);

// computeVariantPrices defaults (90/5/20), costo 100
const p = computeVariantPrices(100, DEFAULT_PRICING);
assertEq('contado', p.priceCash, 200);
assertEq('debito', p.priceDebit, 200);
assertEq('financiado', p.priceFinanced, 200);

// costo 1000, 90/5/20
const p2 = computeVariantPrices(1000, { marginCash: 90, surchargeDebit: 5, surchargeFinanced: 20 });
assertEq('contado 1000', p2.priceCash, 1900);
assertEq('debito 1000', p2.priceDebit, 2000);
assertEq('financiado 1000', p2.priceFinanced, 2300);

// costo 0
const p3 = computeVariantPrices(0, DEFAULT_PRICING);
assertEq('contado 0', p3.priceCash, 0);

if (failures > 0) { console.error(`\n${failures} test(s) fallaron`); process.exit(1); }
console.log('\n✅ Todos los tests de pricing pasaron');
