'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';

// Tipos para el formulario
interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  costPrice: number;
  priceCash: number;
  priceDebit: number;
  priceFinanced: number;
  stockQuantity: number;
  minStockAlert: number;
}

interface ProductForm {
  name: string;
  brand: string;
  category: string;
  description: string;
  barcode: string;
  imageUrl: string;
  variants: ProductVariant[];
}

interface FormErrors {
  name?: string;
  variants?: string;
  variant?: { [key: string]: { [field: string]: string } };
}

// Opciones para los dropdowns
const CATEGORIES = [
  'Remeras',
  'Pantalones', 
  'Shorts',
  'Buzos',
  'Camperas',
  'Accesorios'
];

const SIZES = [
  'XS',
  'S',
  'M', 
  'L',
  'XL',
  'XXL',
  'Único'
];

const COLORS = [
  'Negro',
  'Blanco',
  'Azul',
  'Rojo',
  'Gris',
  'Verde',
  'Amarillo',
  'Rosa',
  'Marrón',
  'Naranja'
];

export default function NuevoProductoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageError, setImageError] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    brand: '',
    category: '',
    description: '',
    barcode: '',
    imageUrl: '',
    variants: [
      {
        id: 'variant-1',
        size: '',
        color: '',
        sku: '',
        costPrice: 0,
        priceCash: 0,
        priceDebit: 0,
        priceFinanced: 0,
        stockQuantity: 0,
        minStockAlert: 0
      }
    ]
  });

  // Función para generar SKU automático
  const generateSKU = (productName: string, size: string, color: string): string => {
    const namePrefix = productName
      .split(' ')
      .map(word => word.substring(0, 3))
      .join('')
      .toUpperCase();
    
    const sizePrefix = size.substring(0, 2).toUpperCase();
    const colorPrefix = color.substring(0, 3).toUpperCase();
    
    return `${namePrefix}-${sizePrefix}-${colorPrefix}`;
  };

  // Función para actualizar datos del producto principal
  const updateProductData = (field: keyof Omit<ProductForm, 'variants'>, value: string) => {
    if (field === 'imageUrl') setImageError(false);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Función para actualizar una variante
  const updateVariant = (variantId: string, field: keyof ProductVariant, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(variant => {
        if (variant.id === variantId) {
          const updatedVariant = { ...variant, [field]: value };
          
          // Auto-generar SKU si se actualiza nombre, talla o color
          if (field === 'size' || field === 'color') {
            updatedVariant.sku = generateSKU(formData.name, updatedVariant.size, updatedVariant.color);
          }
          
          return updatedVariant;
        }
        return variant;
      })
    }));

    // Limpiar errores de la variante
    if (errors.variant?.[variantId]?.[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.variant && newErrors.variant[variantId]) {
          const { [field as string]: _, ...restFieldErrors } = newErrors.variant[variantId];
          if (Object.keys(restFieldErrors).length === 0) {
            delete newErrors.variant[variantId];
          } else {
            newErrors.variant[variantId] = restFieldErrors;
          }
        }
        return newErrors;
      });
    }
  };

  // Función para agregar nueva variante
  const addVariant = () => {
    const newVariantId = `variant-${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          id: newVariantId,
          size: '',
          color: '',
          sku: '',
          costPrice: 0,
          priceCash: 0,
          priceDebit: 0,
          priceFinanced: 0,
          stockQuantity: 0,
          minStockAlert: 0
        }
      ]
    }));
  };

  // Función para eliminar variante
  const removeVariant = (variantId: string) => {
    if (formData.variants.length <= 1) {
      alert('Debe tener al menos una variante');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter(variant => variant.id !== variantId)
    }));

    // Limpiar errores de la variante eliminada
    if (errors.variant?.[variantId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.variant) {
          const { [variantId]: _, ...restVariants } = newErrors.variant;
          newErrors.variant = restVariants;
        }
        return newErrors;
      });
    }
  };

  // Función de validación
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    // Validar variantes
    if (formData.variants.length === 0) {
      newErrors.variants = 'Debe tener al menos una variante';
    }

    const variantErrors: { [key: string]: { [field: string]: string } } = {};

    formData.variants.forEach(variant => {
      const vErrors: { [field: string]: string } = {};

      if (!variant.size) vErrors.size = 'Talla requerida';
      if (!variant.color) vErrors.color = 'Color requerido';
      if (variant.costPrice <= 0) vErrors.costPrice = 'Debe ser mayor a 0';
      if (variant.priceCash <= 0) vErrors.priceCash = 'Debe ser mayor a 0';
      if (variant.priceDebit <= 0) vErrors.priceDebit = 'Debe ser mayor a 0';
      if (variant.priceFinanced <= 0) vErrors.priceFinanced = 'Debe ser mayor a 0';
      if (variant.stockQuantity < 0) vErrors.stockQuantity = 'Debe ser >= 0';
      if (variant.minStockAlert < 0) vErrors.minStockAlert = 'Debe ser >= 0';

      if (Object.keys(vErrors).length > 0) {
        variantErrors[variant.id] = vErrors;
      }
    });

    if (Object.keys(variantErrors).length > 0) {
      newErrors.variant = variantErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para enviar el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para la API
      const apiData = {
        name: formData.name,
        brand: formData.brand || null,
        category: formData.category,
        description: formData.description || null,
        barcode: formData.barcode || null,
        imageUrl: formData.imageUrl || null,
        variants: formData.variants.map(variant => ({
          size: variant.size,
          color: variant.color,
          sku: variant.sku || generateSKU(formData.name, variant.size, variant.color),
          costPrice: variant.costPrice,
          priceCash: variant.priceCash,
          priceDebit: variant.priceDebit,
          priceFinanced: variant.priceFinanced,
          stockQuantity: variant.stockQuantity,
          minStockAlert: variant.minStockAlert
        }))
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        // Mostrar mensaje de éxito (en producción usarías un toast)
        alert('✅ Producto creado exitosamente');
        router.push('/productos');
      } else {
        const errorData = await response.json();
        alert(`❌ Error al crear producto: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('❌ Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/productos')}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Package className="mr-3 text-blue-600" />
                Nuevo Producto
              </h1>
              <p className="mt-2 text-gray-600">
                Completa la información del producto y sus variantes
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información del producto */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Información del Producto</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateProductData('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Camiseta deportiva Nike"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Marca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => updateProductData('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Nike, Adidas, Puma"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
              <select
                value={formData.category}
                onChange={(e) => updateProductData('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar categoría</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Código de barras */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Código de Barras</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => updateProductData('barcode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 1234567890123"
              />
            </div>

            {/* URL de imagen */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">URL de Imagen</label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => updateProductData('imageUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Pegá el link de la imagen (Google Fotos, Drive, cualquier URL)"
              />
              {formData.imageUrl && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Preview:</p>
                  {imageError ? (
                    <div className="h-32 w-32 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                      <p className="text-xs text-red-500 text-center px-2">No se pudo cargar. Verificá el link.</p>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                      onError={() => setImageError(true)}
                    />
                  )}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-400">
                💡 <strong>Imgur (recomendado):</strong> entrá a imgur.com → subí la foto → clic derecho en la imagen → &quot;Copiar dirección de imagen&quot; → pegá el link acá. El link debe terminar en .jpg o .png
              </p>
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => updateProductData('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción detallada del producto..."
              />
            </div>
          </div>
        </div>

        {/* Variantes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Variantes ({formData.variants.length})
            </h2>
            <button
              type="button"
              onClick={addVariant}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Variante
            </button>
          </div>

          {errors.variants && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.variants}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {formData.variants.map((variant, index) => (
              <div key={variant.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Variante {index + 1}
                  </h3>
                  {formData.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Talla */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Talla <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={variant.size}
                      onChange={(e) => updateVariant(variant.id, 'size', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                        errors.variant?.[variant.id]?.size ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar</option>
                      {SIZES.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    {errors.variant?.[variant.id]?.size && (
                      <p className="mt-1 text-xs text-red-600">{errors.variant[variant.id].size}</p>
                    )}
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={variant.color}
                      onChange={(e) => updateVariant(variant.id, 'color', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                        errors.variant?.[variant.id]?.color ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar</option>
                      {COLORS.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                    {errors.variant?.[variant.id]?.color && (
                      <p className="mt-1 text-xs text-red-600">{errors.variant[variant.id].color}</p>
                    )}
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Auto-generado"
                    />
                  </div>

                  {/* Stock inicial */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Inicial <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={variant.stockQuantity}
                      onChange={(e) => updateVariant(variant.id, 'stockQuantity', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                        errors.variant?.[variant.id]?.stockQuantity ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.variant?.[variant.id]?.stockQuantity && (
                      <p className="mt-1 text-xs text-red-600">{errors.variant[variant.id].stockQuantity}</p>
                    )}
                  </div>

                  {/* Precio costo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Costo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={variant.costPrice}
                      onChange={(e) => updateVariant(variant.id, 'costPrice', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                        errors.variant?.[variant.id]?.costPrice ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.variant?.[variant.id]?.costPrice && (
                      <p className="mt-1 text-xs text-red-600">{errors.variant[variant.id].costPrice}</p>
                    )}
                  </div>

                  {/* Precio contado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Contado <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={variant.priceCash}
                      onChange={(e) => updateVariant(variant.id, 'priceCash', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                        errors.variant?.[variant.id]?.priceCash ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.variant?.[variant.id]?.priceCash && (
                      <p className="mt-1 text-xs text-red-600">{errors.variant[variant.id].priceCash}</p>
                    )}
                  </div>

                  {/* Precio débito */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Débito <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={variant.priceDebit}
                      onChange={(e) => updateVariant(variant.id, 'priceDebit', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                        errors.variant?.[variant.id]?.priceDebit ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.variant?.[variant.id]?.priceDebit && (
                      <p className="mt-1 text-xs text-red-600">{errors.variant[variant.id].priceDebit}</p>
                    )}
                  </div>

                  {/* Precio financiado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Financiado <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={variant.priceFinanced}
                      onChange={(e) => updateVariant(variant.id, 'priceFinanced', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                        errors.variant?.[variant.id]?.priceFinanced ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.variant?.[variant.id]?.priceFinanced && (
                      <p className="mt-1 text-xs text-red-600">{errors.variant[variant.id].priceFinanced}</p>
                    )}
                  </div>

                  {/* Stock mínimo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Mínimo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={variant.minStockAlert}
                      onChange={(e) => updateVariant(variant.id, 'minStockAlert', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                        errors.variant?.[variant.id]?.minStockAlert ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.variant?.[variant.id]?.minStockAlert && (
                      <p className="mt-1 text-xs text-red-600">{errors.variant[variant.id].minStockAlert}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 pb-8">
          <button
            type="button"
            onClick={() => router.push('/productos')}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center"
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Producto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}