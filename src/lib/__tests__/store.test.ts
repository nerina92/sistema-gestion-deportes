import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildOrderMessage, isValidWhatsapp, normalizeWhatsapp, parseOrderRequest, whatsappUrl } from '../store';

const both = { pickup: true, delivery: true };

test('normalizeWhatsapp deja solo dígitos', () => {
  assert.equal(normalizeWhatsapp('+54 9 (3385) 12-3456'), '5493385123456');
  assert.equal(isValidWhatsapp('5493385123456'), true);
  assert.equal(isValidWhatsapp('03385123456'), false);
  assert.equal(isValidWhatsapp('123'), false);
});

test('whatsappUrl codifica el texto', () => {
  assert.equal(whatsappUrl('549111', 'Hola & chau\n#1'), 'https://wa.me/549111?text=Hola%20%26%20chau%0A%231');
});

test('parseOrderRequest valida y suma variantes repetidas', () => {
  const r = parseOrderRequest(
    {
      customerName: '  Ana   Pérez ',
      customerPhone: '3385 123456',
      deliveryMethod: 'pickup',
      address: 'no se usa',
      items: [
        { productVariantId: 'v1', quantity: 2 },
        { productVariantId: 'v1', quantity: 1 },
        { productVariantId: 'v2', quantity: 1 },
      ],
    },
    both
  );
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.order.customerName, 'Ana Pérez');
  assert.equal(r.order.address, null);
  assert.deepEqual(r.order.items, [
    { productVariantId: 'v1', quantity: 3 },
    { productVariantId: 'v2', quantity: 1 },
  ]);
});

test('parseOrderRequest rechaza datos inválidos', () => {
  const base = { customerName: 'Ana', customerPhone: '3385123456', deliveryMethod: 'delivery', address: 'Calle 1', items: [{ productVariantId: 'v1', quantity: 1 }] };
  assert.equal(parseOrderRequest({ ...base, customerName: ' ' }, both).ok, false);
  assert.equal(parseOrderRequest({ ...base, address: '' }, both).ok, false);
  assert.equal(parseOrderRequest({ ...base, items: [] }, both).ok, false);
  assert.equal(parseOrderRequest({ ...base, items: [{ productVariantId: 'v1', quantity: 1.5 }] }, both).ok, false);
  assert.equal(parseOrderRequest(base, { pickup: true, delivery: false }).ok, false);
  assert.equal(parseOrderRequest(base, both).ok, true);
});

test('buildOrderMessage arma el texto del pedido', () => {
  const msg = buildOrderMessage({
    businessName: 'Kiosco Sol',
    orderNumber: 7,
    customerName: 'Ana',
    customerPhone: '3385123456',
    deliveryMethod: 'delivery',
    address: 'San Martín 123',
    notes: null,
    items: [
      { productName: 'Remera', variantLabel: 'M - Azul', quantity: 2, unitPrice: 1000, subtotal: 2000 },
      { productName: 'Gorra', variantLabel: 'Único', quantity: 1, unitPrice: 500, subtotal: 500 },
    ],
    total: 2500,
    priceType: 'cash',
  });
  assert.match(msg, /pedido \(#7\)/);
  assert.match(msg, /2 x Remera \(M - Azul\)/);
  assert.match(msg, /1 x Gorra — /);
  assert.match(msg, /Dirección: San Martín 123/);
  assert.doesNotMatch(msg, /Notas:/);
});
