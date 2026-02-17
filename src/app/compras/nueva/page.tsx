'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Save, 
  X, 
  Plus,
  Trash2,
  Search,
  Calendar,
  Building2,
  FileText,
  DollarSign,
  Hash
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  variants: ProductVariant[];
}

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  stockQuantity: number;
  costPrice: number;
}

interface PurchaseItem {
  id: string;
  productId: string;
  productVariantId: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

interface FormData {
  supplierId: string;
  purchaseDate: string;
  notes: string;
  items: PurchaseItem[];
}

interface FormErrors {
  supplierId?: string;
  items?: string[];
  general?: string;
}

export default function NuevaCompraPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const [formData, setFormData] = useState<FormData>({
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{
      id: Date.now().toString(),
      productId: '',
      productVariantId: '',
      quantity: 1,
      unitCost: 0,
      subtotal: 0
    }]
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch('/api/suppliers?isActive=true');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setSuppliers(result.data || []);
          } else {
            setSuppliers(Array.isArray(result) ? result : []);
          }
        }
      } catch (error) {
        console.error('Error cargando proveedores:', error);
      }
    };

    fetchSuppliers();
  }, []);

  const fetchProducts = useCallback(async (searchTerm = '') => {
    try {
      setLoadingProducts(true);
      const url = searchTerm 
        ? `/api/products?search=${encodeURIComponent(searchTerm)}&limit=20`
        : '/api/products?page=1&limit=20';
      
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        setProducts(result.products || result.data || []);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(productSearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [productSearch, fetchProducts]);

  const totalAmount = useMemo(() => {
    return formData.items.reduce((sum, item) => sum + item.subtotal, 0);
  }, [formData.items]);

  const getProductById = (productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  };

  const getVariantById = (productId: string, variantId: string): ProductVariant | undefined => {
    const product = getProductById(productId);
    return product?.variants.find(v => v.id === variantId);
  };

  const handleInputChange = (field: keyof Omit<FormData, 'items'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleItemChange = (itemId: string, field: keyof PurchaseItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          
          if (field === 'quantity' || field === 'unitCost') {
            updatedItem.subtotal = updatedItem.quantity * updatedItem.unitCost;
          }
          
          if (field === 'productVariantId' && value) {
            const variant = getVariantById(item.productId, value as string);
            if (variant && updatedItem.unitCost === 0) {
              updatedItem.unitCost = variant.costPrice;
              updatedItem.subtotal = updatedItem.quantity * updatedItem.unitCost;
            }
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const addItem = () => {
    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      productId: '',
      productVariantId: '',
      quantity: 1,
      unitCost: 0,
      subtotal: 0
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (itemId: string) => {
    if (formData.items.length <= 1) {
      alert('Debe mantener al menos un item en la compra');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.supplierId) {
      newErrors.supplierId = 'Debe seleccionar un proveedor';
    }

    const itemErrors: string[] = [];
    const usedVariants = new Set<string>();

    formData.items.forEach((item, index) => {
      let itemError = '';

      if (!item.productId) {
        itemError += 'Debe seleccionar un producto. ';
      }
      if (!item.productVariantId) {
        itemError += 'Debe seleccionar una variante. ';
      } else if (usedVariants.has(item.productVariantId)) {
        itemError += 'Esta variante ya está en la lista. ';
      } else {
        usedVariants.add(item.productVariantId);
      }
      if (item.quantity <= 0) {
        itemError += 'La cantidad debe ser mayor a 0. ';
      }
      if (item.unitCost <= 0) {
        itemError += 'El costo unitario debe ser mayor a 0. ';
      }

      itemErrors[index] = itemError.trim();
    });

    if (itemErrors.some(error => error !== '')) {
      newErrors.items = itemErrors;
    }

    if (formData.items.length === 0) {
      newErrors.general = 'Debe agregar al menos un item';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const purchaseData = {
        supplierId: formData.supplierId,
        purchaseDate: new Date(formData.purchaseDate + 'T00:00:00Z').toISOString(),
        notes: formData.notes.trim() || undefined,
        items: formData.items.map(item => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          unitCost: item.unitCost
        }))
      };

      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Compra registrada exitosamente. Stock actualizado.');
        router.push('/compras');
      } else {
        alert(`❌ Error al registrar compra: ${result.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al registrar compra. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Package className="mr-3 text-purple-600" />
          Nueva Compra
        </h1>
        <p className="mt-2 text-gray-600">
          Registra una nueva compra para actualizar el inventario
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Información de la compra</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <select
                  id="supplier"
                  value={formData.supplierId}
                  onChange={(e) => handleInputChange('supplierId', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.supplierId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccione un proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.supplierId && (
                <p className="mt-1 text-sm text-red-600">{errors.supplierId}</p>
              )}
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de compra
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  id="date"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Información adicional sobre la compra..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Items de la compra</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar item
            </button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar productos por nombre o marca..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => {
              const product = getProductById(item.productId);
              const variant = getVariantById(item.productId, item.productVariantId);
              
              return (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 relative"
                >
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Producto *
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          handleItemChange(item.id, 'productId', e.target.value);
                          handleItemChange(item.id, 'productVariantId', '');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Seleccione producto</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {product.brand}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Variante *
                      </label>
                      <select
                        value={item.productVariantId}
                        onChange={(e) => handleItemChange(item.id, 'productVariantId', e.target.value)}
                        disabled={!item.productId}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="">Seleccione variante</option>
                        {product?.variants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.size} - {variant.color} ({variant.sku})
                          </option>
                        ))}
                      </select>
                      {variant && (
                        <p className="text-xs text-gray-500 mt-1">
                          Stock actual: {variant.stockQuantity}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad *
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Costo unitario *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(e) => handleItemChange(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      {variant && variant.costPrice > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Costo anterior: {formatPrice(variant.costPrice)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subtotal
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-900">
                        {formatPrice(item.subtotal)}
                      </div>
                    </div>
                  </div>

                  {errors.items?.[index] && (
                    <p className="mt-2 text-sm text-red-600">{errors.items[index]}</p>
                  )}
                </div>
              );
            })}
          </div>

          {errors.general && (
            <p className="mt-4 text-sm text-red-600">{errors.general}</p>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/compras')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <X className="h-4 w-4 mr-2 inline" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Guardando...' : 'Guardar compra'}
          </button>
        </div>
      </form>
    </div>
  );
}