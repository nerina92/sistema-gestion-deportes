import { ProductInput, ProductVariantInput } from '@/types/products';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Valida los datos de entrada para crear/actualizar un producto
 */
export function validateProductInput(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Validar campos requeridos del producto
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'El nombre del producto es requerido' });
  }

  if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
    errors.push({ field: 'category', message: 'La categoría del producto es requerida' });
  }

  // Validar campos opcionales
  if (data.brand && (typeof data.brand !== 'string' || data.brand.trim().length === 0)) {
    errors.push({ field: 'brand', message: 'La marca debe ser una cadena válida' });
  }

  if (data.description && typeof data.description !== 'string') {
    errors.push({ field: 'description', message: 'La descripción debe ser una cadena' });
  }

  if (data.barcode && (typeof data.barcode !== 'string' || data.barcode.trim().length === 0)) {
    errors.push({ field: 'barcode', message: 'El código de barras debe ser una cadena válida' });
  }

  if (data.imageUrl && (typeof data.imageUrl !== 'string' || data.imageUrl.trim().length === 0)) {
    errors.push({ field: 'imageUrl', message: 'La URL de la imagen debe ser una cadena válida' });
  }

  // Validar variantes
  if (!data.variants || !Array.isArray(data.variants) || data.variants.length === 0) {
    errors.push({ field: 'variants', message: 'Se requiere al menos una variante del producto' });
  } else {
    data.variants.forEach((variant: any, index: number) => {
      const variantErrors = validateProductVariantInput(variant, index);
      errors.push(...variantErrors);
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida los datos de una variante de producto
 */
export function validateProductVariantInput(variant: any, index: number = 0): ValidationError[] {
  const errors: ValidationError[] = [];
  const fieldPrefix = `variants[${index}]`;

  // Campos requeridos
  if (!variant.size || typeof variant.size !== 'string' || variant.size.trim().length === 0) {
    errors.push({ field: `${fieldPrefix}.size`, message: 'La talla es requerida' });
  }

  if (!variant.color || typeof variant.color !== 'string' || variant.color.trim().length === 0) {
    errors.push({ field: `${fieldPrefix}.color`, message: 'El color es requerido' });
  }

  if (!variant.sku || typeof variant.sku !== 'string' || variant.sku.trim().length === 0) {
    errors.push({ field: `${fieldPrefix}.sku`, message: 'El SKU es requerido' });
  }

  // Validar precios (deben ser números positivos)
  const priceFields = ['costPrice', 'priceCash', 'priceDebit', 'priceFinanced'];
  priceFields.forEach(field => {
    const value = variant[field];
    if (typeof value !== 'number' || isNaN(value) || value <= 0) {
      errors.push({ 
        field: `${fieldPrefix}.${field}`, 
        message: `${field} debe ser un número positivo mayor a 0` 
      });
    }
  });

  // Validar stock (debe ser número no negativo)
  if (typeof variant.stockQuantity !== 'number' || isNaN(variant.stockQuantity) || variant.stockQuantity < 0) {
    errors.push({ 
      field: `${fieldPrefix}.stockQuantity`, 
      message: 'La cantidad de stock debe ser un número no negativo' 
    });
  }

  if (typeof variant.minStockAlert !== 'number' || isNaN(variant.minStockAlert) || variant.minStockAlert < 0) {
    errors.push({ 
      field: `${fieldPrefix}.minStockAlert`, 
      message: 'La alerta de stock mínimo debe ser un número no negativo' 
    });
  }

  return errors;
}

/**
 * Convierte los precios de string a number si es necesario
 */
export function sanitizeProductInput(data: any): ProductInput {
  const sanitized = { ...data };

  // Sanitizar variantes
  if (sanitized.variants && Array.isArray(sanitized.variants)) {
    sanitized.variants = sanitized.variants.map((variant: any) => ({
      ...variant,
      costPrice: typeof variant.costPrice === 'string' ? parseFloat(variant.costPrice) : variant.costPrice,
      priceCash: typeof variant.priceCash === 'string' ? parseFloat(variant.priceCash) : variant.priceCash,
      priceDebit: typeof variant.priceDebit === 'string' ? parseFloat(variant.priceDebit) : variant.priceDebit,
      priceFinanced: typeof variant.priceFinanced === 'string' ? parseFloat(variant.priceFinanced) : variant.priceFinanced,
      stockQuantity: typeof variant.stockQuantity === 'string' ? parseInt(variant.stockQuantity) : variant.stockQuantity,
      minStockAlert: typeof variant.minStockAlert === 'string' ? parseInt(variant.minStockAlert) : variant.minStockAlert,
    }));
  }

  return sanitized;
}

/**
 * Valida parámetros de query para la lista de productos
 */
export function validateProductsQueryParams(params: any) {
  const sanitized = {
    page: 1,
    limit: 20,
    search: undefined as string | undefined,
    category: undefined as string | undefined,
    brand: undefined as string | undefined,
    lowStock: false
  };

  // Validar página
  if (params.page) {
    const page = parseInt(params.page);
    if (!isNaN(page) && page > 0) {
      sanitized.page = page;
    }
  }

  // Validar límite
  if (params.limit) {
    const limit = parseInt(params.limit);
    if (!isNaN(limit) && limit > 0 && limit <= 100) { // Máximo 100 para evitar sobrecarga
      sanitized.limit = limit;
    }
  }

  // Validar filtros de texto
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    sanitized.search = params.search.trim();
  }

  if (params.category && typeof params.category === 'string' && params.category.trim()) {
    sanitized.category = params.category.trim();
  }

  if (params.brand && typeof params.brand === 'string' && params.brand.trim()) {
    sanitized.brand = params.brand.trim();
  }

  // Validar lowStock
  if (params.lowStock) {
    sanitized.lowStock = params.lowStock === 'true' || params.lowStock === '1';
  }

  return sanitized;
}