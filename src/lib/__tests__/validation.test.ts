import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeProductInput, validateProductInput } from '../validation';

const baseVariant = {
  size: 'Único',
  color: 'Blanco',
  sku: 'PROT-PALETA-1',
  costPrice: 4300,
  stockQuantity: 10,
  minStockAlert: 0,
};

test('sanitizeProductInput convierte strings vacíos de campos opcionales en null', () => {
  const result = sanitizeProductInput({
    name: 'protector de paleta transparente',
    brand: 'winar',
    categoryId: 'cat-1',
    marginCash: '127',
    surchargeDebit: '10',
    surchargeFinanced: '27',
    description: 'sin orejas',
    barcode: '',
    imageUrl: '',
    variants: [baseVariant],
  });

  assert.equal(result.barcode, null);
  assert.equal(result.imageUrl, null);
  assert.equal(result.brand, 'winar');
  assert.equal(result.description, 'sin orejas');
  assert.equal(result.marginCash, 127);
});

test('sanitizeProductInput recorta espacios y trata "   " como vacío', () => {
  const result = sanitizeProductInput({
    name: 'x',
    categoryId: 'cat-1',
    brand: '  winar  ',
    barcode: '   ',
    variants: [baseVariant],
  });

  assert.equal(result.brand, 'winar');
  assert.equal(result.barcode, null);
});

test('sanitizeProductInput preserva un barcode real', () => {
  const result = sanitizeProductInput({
    name: 'x',
    categoryId: 'cat-1',
    barcode: '7791234567890',
    variants: [baseVariant],
  });

  assert.equal(result.barcode, '7791234567890');
});

test('validateProductInput acepta null en campos opcionales', () => {
  const result = validateProductInput({
    name: 'x',
    categoryId: 'cat-1',
    brand: null,
    description: null,
    barcode: null,
    imageUrl: null,
    variants: [baseVariant],
  });

  assert.equal(result.isValid, true, JSON.stringify(result.errors));
});
