'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Package, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Badge,
  Edit3
} from 'lucide-react';

// Tipos para el formulario (reutilizando del US-004)
interface ProductVariant {
  id?: string; // Opcional - si existe es variante existente
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
  variant?: { [key: string]: { [field: string]: string | undefined } };
}

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  barcode?: string;
  imageUrl?: string;
  variants: Array<{
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
  }>;
}

// Opciones para los dropdowns (reutilizando del US-004)
const CATEGORIES = [
  'Remeras',
  'Pantalones', 
  'Shorts',
  'Buzos',
  'Camperas',
  'Zapatillas',
  'Medias',
  'Accesorios',
  'Equipamiento',
  'Otros'
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', 'Único'];

const COLORS = [
  'Negro', 'Blanco', 'Gris', 'Azul', 'Rojo', 'Verde', 'Amarillo', 
  'Rosa', 'Violeta', 'Naranja', 'Marrón', 'Beige', 'Celeste', 'Marino', 'Otros'
];

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    brand: '',
    category: '',
    description: '',
    barcode: '',
    imageUrl: '',
    variants: []
  });

  // Cargar datos del producto existente
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${productId}`);
        
        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        
        if (!response.ok) {
          throw new Error('Error al cargar el producto');
        }
        
        const result = await response.json();
        const productData = result.success ? result.data : result;
        
        setProduct(productData);
        
        // Pre-llenar el formulario con los datos existentes
        setFormData({
          name: productData.name || '',
          brand: productData.brand || '',
          category: productData.category || '',
          description: productData.description || '',
          barcode: productData.barcode || '',
          imageUrl: productData.imageUrl || productData.image_url || '',
          variants: productData.variants.map((variant: any) => ({
            id: variant.id,
            size: variant.size,
            color: variant.color,
            sku: variant.sku,
            costPrice: variant.costPrice || variant.cost_price || 0,
            priceCash: variant.priceCash || variant.price_cash || 0,
            priceDebit: variant.priceDebit || variant.price_debit || 0,
            priceFinanced: variant.priceFinanced || variant.price_financed || 0,
            stockQuantity: variant.stockQuantity || variant.stock_quantity || 0,
            minStockAlert: variant.minStockAlert || variant.min_stock_alert || 0
          }))
        });
        
      } catch (error) {
        console.error('Error cargando producto:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Función para generar SKU automático (reutilizada del US-004)
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
    
    // Si se actualiza el nombre, regenerar SKUs de todas las variantes
    if (field === 'name') {
      setFormData(prev => ({
        ...prev,
        variants: prev.variants.map(variant => ({
          ...variant,
          sku: generateSKU(value, variant.size, variant.color)
        }))
      }));
    }
  };

  // Función para actualizar una variante
  const updateVariant = (variantIndex: number, field: keyof ProductVariant, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, index) => {
        if (index === variantIndex) {
          const updatedVariant = { ...variant, [field]: value };
          
          // Auto-generar SKU si se actualiza talla o color
          if (field === 'size' || field === 'color') {
            updatedVariant.sku = generateSKU(formData.name, updatedVariant.size, updatedVariant.color);
          }
          
          return updatedVariant;
        }
        return variant;
      })
    }));
    
    // Limpiar errores de esta variante
    if (errors.variant?.[variantIndex.toString()]?.[field as string]) {
      setErrors(prev => ({
        ...prev,
        variant: {
          ...prev.variant,
          [variantIndex.toString()]: {
            ...prev.variant?.[variantIndex.toString()],
            [field]: undefined
          }
        }
      }));
    }
  };

  // Función para agregar nueva variante
  const addVariant = () => {
    const newVariant: ProductVariant = {
      // Sin ID = nueva variante
      size: '',
      color: '',
      sku: '',
      costPrice: 0,
      priceCash: 0,
      priceDebit: 0,
      priceFinanced: 0,
      stockQuantity: 0,
      minStockAlert: 0
    };

    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
  };

  // Función para eliminar variante con validación de stock
  const removeVariant = async (index: number) => {
    const variant = formData.variants[index];
    
    if (formData.variants.length === 1) {
      alert('❌ Debe mantener al menos una variante');
      return;
    }

    // Si la variante tiene stock, mostrar confirmación
    if (variant.stockQuantity > 0) {
      const confirmDelete = window.confirm(
        `⚠️ Esta variante tiene stock de ${variant.stockQuantity} unidades. ¿Estás seguro de eliminarla?`
      );
      
      if (!confirmDelete) {
        return;
      }
    } else if (variant.id) {
      // Variante existente sin stock - confirmación simple
      const confirmDelete = window.confirm(
        '¿Estás seguro de eliminar esta variante?'
      );
      
      if (!confirmDelete) {
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  // Validaciones
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar nombre del producto
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    // Validar que hay al menos una variante
    if (formData.variants.length === 0) {
      newErrors.variants = 'Debe tener al menos una variante';
    }

    // Validar cada variante
    const variantErrors: { [key: string]: { [field: string]: string } } = {};
    const usedSKUs = new Set<string>();

    formData.variants.forEach((variant, index) => {
      const indexStr = index.toString();
      variantErrors[indexStr] = {};

      // Validar campos requeridos
      if (!variant.size) {
        variantErrors[indexStr].size = 'Talla requerida';
      }
      if (!variant.color) {
        variantErrors[indexStr].color = 'Color requerido';
      }
      if (!variant.sku) {
        variantErrors[indexStr].sku = 'SKU requerido';
      }

      // Validar precios > 0
      if (variant.costPrice <= 0) {
        variantErrors[indexStr].costPrice = 'Precio de costo debe ser mayor a 0';
      }
      if (variant.priceCash <= 0) {
        variantErrors[indexStr].priceCash = 'Precio contado debe ser mayor a 0';
      }
      if (variant.priceDebit <= 0) {
        variantErrors[indexStr].priceDebit = 'Precio débito debe ser mayor a 0';
      }
      if (variant.priceFinanced <= 0) {
        variantErrors[indexStr].priceFinanced = 'Precio financiado debe ser mayor a 0';
      }

      // Validar stock >= 0
      if (variant.stockQuantity < 0) {
        variantErrors[indexStr].stockQuantity = 'Stock no puede ser negativo';
      }
      if (variant.minStockAlert < 0) {
        variantErrors[indexStr].minStockAlert = 'Alerta mínima no puede ser negativa';
      }

      // Validar SKUs únicos
      if (variant.sku && usedSKUs.has(variant.sku)) {
        variantErrors[indexStr].sku = 'SKU duplicado';
      } else if (variant.sku) {
        usedSKUs.add(variant.sku);
      }

      // Limpiar errores vacíos
      if (Object.keys(variantErrors[indexStr]).length === 0) {
        delete variantErrors[indexStr];
      }
    });

    if (Object.keys(variantErrors).length > 0) {
      newErrors.variant = variantErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para guardar cambios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const productData = {
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        category: formData.category,
        description: formData.description.trim(),
        barcode: formData.barcode.trim(),
        imageUrl: formData.imageUrl.trim(),
        variants: formData.variants.map(variant => ({
          ...(variant.id && { id: variant.id }), // Solo incluir ID si existe
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          costPrice: variant.costPrice,
          priceCash: variant.priceCash,
          priceDebit: variant.priceDebit,
          priceFinanced: variant.priceFinanced,
          stockQuantity: variant.stockQuantity,
          minStockAlert: variant.minStockAlert
        }))
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Producto actualizado exitosamente');
        router.push('/productos');
      } else {
        alert(`❌ Error al actualizar: ${result.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al actualizar el producto');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando producto...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
          <p className="text-gray-600 mb-6">
            El producto que intentas editar no existe o ha sido eliminado.
          </p>
          <button
            onClick={() => router.push('/productos')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Productos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span>Productos</span>
          <span className="mx-2">›</span>
          <span>Editar</span>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{product?.name}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Edit3 className="mr-3 text-blue-600" />
              Editar Producto
            </h1>
            <p className="mt-2 text-gray-600">
              Modifica la información del producto y sus variantes
            </p>
          </div>
          
          <button
            onClick={() => router.push('/productos')}
            className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </button>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Información del Producto */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Información del Producto</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Producto *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateProductData('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: Remera Deportiva Nike"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Marca */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                Marca
              </label>
              <input
                id="brand"
                type="text"
                value={formData.brand}
                onChange={(e) => updateProductData('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Nike, Adidas, Puma"
              />
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                id="category"
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

            {/* Código de Barras */}
            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                Código de Barras
              </label>
              <input
                id="barcode"
                type="text"
                value={formData.barcode}
                onChange={(e) => updateProductData('barcode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 1234567890123"
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateProductData('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe las características del producto..."
            />
          </div>

          {/* URL de Imagen */}
          <div className="mt-6">
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
              URL de Imagen
            </label>
            <input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => updateProductData('imageUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>
        </div>

        {/* Variantes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Variantes del Producto</h2>
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar Variante
            </button>
          </div>

          {errors.variants && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.variants}</p>
            </div>
          )}

          <div className="space-y-6">
            {formData.variants.map((variant, index) => {
              const isExisting = !!variant.id;
              const variantErrors = errors.variant?.[index.toString()] || {};

              return (
                <div
                  key={variant.id || `new-${index}`}
                  className="border border-gray-200 rounded-lg p-4 relative"
                >
                  {/* Badge para indicar si es existente o nueva */}
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isExisting 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isExisting ? 'Existente' : 'Nueva'}
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                      title="Eliminar variante"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    {/* Talla */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Talla *
                      </label>
                      <select
                        value={variant.size}
                        onChange={(e) => updateVariant(index, 'size', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          variantErrors.size ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Seleccionar</option>
                        {SIZES.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                      {variantErrors.size && <p className="mt-1 text-xs text-red-600">{variantErrors.size}</p>}
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color *
                      </label>
                      <select
                        value={variant.color}
                        onChange={(e) => updateVariant(index, 'color', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          variantErrors.color ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Seleccionar</option>
                        {COLORS.map(color => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                      {variantErrors.color && <p className="mt-1 text-xs text-red-600">{variantErrors.color}</p>}
                    </div>

                    {/* SKU */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU *
                      </label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          variantErrors.sku ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="AUTO-M-NEG"
                      />
                      {variantErrors.sku && <p className="mt-1 text-xs text-red-600">{variantErrors.sku}</p>}
                    </div>

                    {/* Stock Actual */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock Actual *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={variant.stockQuantity}
                        onChange={(e) => updateVariant(index, 'stockQuantity', parseInt(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          variantErrors.stockQuantity ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {variantErrors.stockQuantity && <p className="mt-1 text-xs text-red-600">{variantErrors.stockQuantity}</p>}
                    </div>
                  </div>

                  {/* Precios */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio Costo *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.costPrice}
                        onChange={(e) => updateVariant(index, 'costPrice', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          variantErrors.costPrice ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {variantErrors.costPrice && <p className="mt-1 text-xs text-red-600">{variantErrors.costPrice}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio Contado *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.priceCash}
                        onChange={(e) => updateVariant(index, 'priceCash', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          variantErrors.priceCash ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {variantErrors.priceCash && <p className="mt-1 text-xs text-red-600">{variantErrors.priceCash}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio Débito *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.priceDebit}
                        onChange={(e) => updateVariant(index, 'priceDebit', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          variantErrors.priceDebit ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {variantErrors.priceDebit && <p className="mt-1 text-xs text-red-600">{variantErrors.priceDebit}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio Financiado *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.priceFinanced}
                        onChange={(e) => updateVariant(index, 'priceFinanced', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          variantErrors.priceFinanced ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {variantErrors.priceFinanced && <p className="mt-1 text-xs text-red-600">{variantErrors.priceFinanced}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alerta Stock Mínimo *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={variant.minStockAlert}
                        onChange={(e) => updateVariant(index, 'minStockAlert', parseInt(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          variantErrors.minStockAlert ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {variantErrors.minStockAlert && <p className="mt-1 text-xs text-red-600">{variantErrors.minStockAlert}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/productos')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <X className="h-4 w-4 mr-2 inline" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}