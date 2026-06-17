'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaShoppingCart, FaSearch, FaTrash, FaPlus } from 'react-icons/fa';

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  priceCash: number;
  priceDebit: number;
  priceFinanced: number;
  stockQuantity: number;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  category: { name: string } | null;
  variants: ProductVariant[];
}

interface SaleItem {
  productVariantId: string;
  productName: string;
  variantDetails: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  stock: number;
  priceCash: number;
  priceDebit: number;
  priceFinanced: number;
}

type PriceType = 'cash' | 'debit' | 'financed';
type PaymentMethod = 'cash' | 'card' | 'transfer';

export default function NuevaVentaPage() {
  const router = useRouter();
  
  // Form state
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [priceType, setPriceType] = useState<PriceType>('cash');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<SaleItem[]>([]);
  
  // Product search
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Search products when term changes
  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.variants.some(v => v.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setSearchResults(filtered);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchTerm, products]);

  // Update prices when priceType changes
  useEffect(() => {
    setItems(prevItems => prevItems.map(item => {
      let newUnitPrice = item.priceCash;
      if (priceType === 'debit') newUnitPrice = item.priceDebit;
      if (priceType === 'financed') newUnitPrice = item.priceFinanced;
      
      return {
        ...item,
        unitPrice: newUnitPrice,
        subtotal: newUnitPrice * item.quantity
      };
    }));
  }, [priceType]);

  const fetchProducts = async () => {
    setIsSearching(true);
    try {
      const response = await fetch('/api/products?page=1&pageSize=1000');
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const addItem = (product: Product, variant: ProductVariant) => {
    // Check if already added
    const existingIndex = items.findIndex(i => i.productVariantId === variant.id);
    
    if (existingIndex >= 0) {
      // Increment quantity
      const newItems = [...items];
      const currentQty = newItems[existingIndex].quantity;
      if (currentQty < variant.stockQuantity) {
        newItems[existingIndex].quantity += 1;
        newItems[existingIndex].subtotal = newItems[existingIndex].unitPrice * newItems[existingIndex].quantity;
        setItems(newItems);
      }
    } else {
      // Add new item
      let unitPrice = variant.priceCash;
      if (priceType === 'debit') unitPrice = variant.priceDebit;
      if (priceType === 'financed') unitPrice = variant.priceFinanced;

      const newItem: SaleItem = {
        productVariantId: variant.id,
        productName: product.name,
        variantDetails: `${variant.size} - ${variant.color}`,
        quantity: 1,
        unitPrice,
        subtotal: unitPrice,
        stock: variant.stockQuantity,
        priceCash: variant.priceCash,
        priceDebit: variant.priceDebit,
        priceFinanced: variant.priceFinanced
      };

      setItems([...items, newItem]);
    }

    // Clear search
    setSearchTerm('');
    setShowResults(false);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    const newItems = [...items];
    const item = newItems[index];

    // Validate quantity - minimum 1
    if (newQuantity < 1) {
      newItems[index].quantity = 1;
      newItems[index].subtotal = newItems[index].unitPrice * 1;
      setItems(newItems);
      return;
    }

    // Validate quantity - maximum stock
    if (newQuantity > item.stock) {
      // Limit to maximum available stock
      newItems[index].quantity = item.stock;
      newItems[index].subtotal = newItems[index].unitPrice * item.stock;
      setItems(newItems);
      setError(`Stock insuficiente. Máximo disponible: ${item.stock}`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Valid quantity - update normally
    newItems[index].quantity = newQuantity;
    newItems[index].subtotal = newItems[index].unitPrice * newQuantity;
    setItems(newItems);
    setError(''); // Clear any previous errors
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      setError('Debes agregar al menos un producto');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saleDate: new Date(saleDate).toISOString(),
          paymentMethod,
          priceType,
          notes: notes || undefined,
          items: items.map(item => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity
          }))
        })
      });

      const data = await response.json();

      if (data.success) {
        // Success - redirect to ventas list or show success
        alert(`Venta registrada exitosamente!\nTotal: $${data.data.totalAmount}`);
        router.push('/ventas');
      } else {
        setError(data.error || 'Error al registrar la venta');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priceTypeLabels = {
    cash: 'Contado',
    debit: 'Débito',
    financed: 'Financiado'
  };

  const paymentMethodLabels = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia'
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FaShoppingCart className="mr-3 text-green-600" />
          Nueva Venta
        </h1>
        <p className="mt-2 text-gray-600">
          Registra una nueva venta y el stock se actualizará automáticamente
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic info card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Información de la Venta</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Payment method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago
                  </label>
                  <div className="flex gap-2">
                    {(['cash', 'card', 'transfer'] as PaymentMethod[]).map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          paymentMethod === method
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {paymentMethodLabels[method]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price type */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Precio
                </label>
                <div className="flex gap-2">
                  {(['cash', 'debit', 'financed'] as PriceType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPriceType(type)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        priceType === type
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {priceTypeLabels[type]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  El precio se calculará automáticamente según el tipo seleccionado
                </p>
              </div>

              {/* Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Observaciones sobre la venta..."
                />
              </div>
            </div>

            {/* Product search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Agregar Productos</h2>
              
              <div className="relative">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre, marca o SKU..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Search results dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {searchResults.map(product => (
                      <div key={product.id} className="border-b border-gray-100 last:border-0">
                        <div className="px-4 py-2 bg-gray-50">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.brand} - {product.category?.name ?? ''}</div>
                        </div>
                        {product.variants.map(variant => (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => addItem(product, variant)}
                            disabled={variant.stockQuantity === 0 || variant.priceCash === 0}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-sm text-gray-700">{variant.size} - {variant.color}</span>
                                <span className="text-xs text-gray-500 ml-2">SKU: {variant.sku}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  ${priceType === 'cash' ? variant.priceCash : priceType === 'debit' ? variant.priceDebit : variant.priceFinanced}
                                </div>
                                <div className={`text-xs ${variant.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  Stock: {variant.stockQuantity}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {showResults && searchResults.length === 0 && searchTerm && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    No se encontraron productos
                  </div>
                )}
              </div>
            </div>

            {/* Items list */}
            {items.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Productos en la Venta</h2>
                
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.productName}</div>
                        <div className="text-sm text-gray-500">{item.variantDetails}</div>
                        <div className="flex gap-4 mt-1 text-xs">
                          <span className={`${priceType === 'cash' ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                            Contado: ${item.priceCash}
                          </span>
                          <span className={`${priceType === 'debit' ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                            Débito: ${item.priceDebit}
                          </span>
                          <span className={`${priceType === 'financed' ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                            Financiado: ${item.priceFinanced}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={item.stock}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        <span className="text-xs text-gray-500">de {item.stock}</span>
                      </div>

                      <div className="text-right min-w-[100px]">
                        <div className="font-semibold text-gray-900">${item.subtotal.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">${item.unitPrice} x {item.quantity}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Resumen</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Productos:</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items totales:</span>
                  <span className="font-medium">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tipo de precio:</span>
                  <span className="font-medium">{priceTypeLabels[priceType]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Método de pago:</span>
                  <span className="font-medium">{paymentMethodLabels[paymentMethod]}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-green-600">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>Registrando...</>
                ) : (
                  <>
                    <FaShoppingCart className="mr-2" />
                    Registrar Venta
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/ventas')}
                className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
