'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useModules } from '@/lib/use-modules';
import { useBusinessSettings } from '@/lib/use-business-settings';
import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { formatMoney } from '@/lib/format';

// Tipos para los datos
interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  stockQuantity: number;
  minStockAlert: number;
  priceCash: number;
  priceDebit: number;
  priceFinanced: number;
  costPrice: number;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  category: { id: string; name: string } | null;
  categoryId?: string | null;
  barcode?: string;
  imageUrl?: string;
  image_url?: string; // fallback por compatibilidad
  variants: ProductVariant[];
  totalStock: number;
  variantCount: number;
  hasLowStock: boolean;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Hook personalizado para debounce
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ProductosPage() {
  // Estados
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const canEdit = useModules().has('productos-editar');
  const settings = useBusinessSettings();
  
  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  // Acceso directo desde el inicio: /productos?lowStock=1
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('lowStock')) setShowLowStock(true);
  }, []);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  // Estados para filtros únicos
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Modal para detalles del producto
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Debounce para búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Función para cargar productos
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(selectedCategory && { categoryId: selectedCategory }),
        ...(selectedBrand && { brand: selectedBrand }),
        ...(showLowStock && { lowStock: 'true' })
      });

      const response = await fetch(`/api/products?${params}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Procesar productos para agregar campos calculados
      const processedProducts = data.products.map((product: any) => ({
        ...product,
        totalStock: product.variants.reduce((sum: number, variant: any) => 
          sum + (variant.stockQuantity || variant.stock_quantity || 0), 0),
        variantCount: product.variants.length,
        hasLowStock: product.variants.some((variant: any) => 
          (variant.stockQuantity || variant.stock_quantity || 0) <= (variant.minStockAlert || variant.min_stock_alert || 5))
      }));

      setProducts(processedProducts);
      setPagination(data.pagination);

      // Extraer categorías y marcas únicas para los filtros
      if (data.filters) {
        setCategories(data.filters.categories || []);
        setBrands(data.filters.brands || []);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar productos');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, selectedCategory, selectedBrand, showLowStock]);

  // Cargar productos cuando cambien los filtros
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Resetear página cuando cambien filtros
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, selectedCategory, selectedBrand, showLowStock]);

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedBrand('');
    setShowLowStock(false);
    setCurrentPage(1);
  };

  // Función para eliminar producto
  const handleDelete = async (product: Product) => {
    if (product.totalStock > 0) {
      alert('No se puede eliminar un producto con stock disponible. Primero ajuste el stock a 0.');
      return;
    }

    const confirmed = window.confirm(`¿Está seguro que desea eliminar "${product.name}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Producto eliminado exitosamente');
        loadProducts(); // Recargar la lista
      } else {
        const error = await response.json();
        alert(`Error al eliminar: ${error.message}`);
      }
    } catch (err) {
      alert('Error al conectar con el servidor');
    }
  };

  // Componente para placeholder de imagen (miniatura en tabla)
  const ProductImage = ({ product, size = 'sm' }: { product: Product; size?: 'sm' | 'lg' }) => {
    const imgUrl = product.imageUrl || product.image_url;
    const sizeClass = size === 'lg' ? 'w-full h-56 rounded-xl' : 'w-12 h-12 rounded-lg';
    const placeholderClass = size === 'lg'
      ? 'w-full h-56 rounded-xl flex items-center justify-center bg-zinc-100'
      : 'w-12 h-12 rounded-lg flex items-center justify-center bg-zinc-200';

    if (imgUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgUrl}
          alt={product.name}
          className={`${sizeClass} object-cover`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }

    const initials = product.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return (
      <div className={placeholderClass}>
        <span className={`text-zinc-500 font-semibold ${size === 'lg' ? 'text-4xl' : 'text-sm'}`}>{initials}</span>
      </div>
    );
  };

  // Componente de Badge para stock
  const StockBadge = ({ product }: { product: Product }) => {
    if (product.totalStock === 0) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">Sin stock</span>;
    } else if (product.hasLowStock) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Stock bajo</span>;
    } else {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Stock OK</span>;
    }
  };

  // Componente de paginación
  const Pagination = () => {
    const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Generar números de página a mostrar
    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (
        let i = Math.max(2, currentPage - delta);
        i <= Math.min(totalPages - 1, currentPage + delta);
        i++
      ) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between border-t border-zinc-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-700">
              Mostrando <span className="font-medium">{startItem}</span> a{' '}
              <span className="font-medium">{endItem}</span> de{' '}
              <span className="font-medium">{totalItems}</span> productos
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <ChevronsLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`dots-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-inset ring-zinc-300">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(Number(page))}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 ${
                      currentPage === page
                        ? 'z-10 bg-brand-600 text-white ring-brand-600'
                        : 'text-zinc-900'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <ChevronsRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // Modal para ver detalles del producto
  const ProductDetailsModal = () => {
    if (!showModal || !selectedProduct) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-zinc-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900">Detalles del Producto</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {/* Imagen grande + info */}
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="md:w-56 flex-shrink-0">
                <ProductImage product={selectedProduct} size="lg" />
                <div className="hidden text-center text-zinc-400 text-sm mt-2 h-56 items-center justify-center bg-zinc-100 rounded-xl">
                  Sin imagen
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-semibold tracking-tight text-zinc-900 tabular">{selectedProduct.name}</h4>
                <p className="text-zinc-500 text-sm mt-1">{selectedProduct.brand} • {selectedProduct.category?.name ?? ''}</p>
                {selectedProduct.barcode && (
                  <p className="text-sm text-zinc-400 mt-1">Código: {selectedProduct.barcode}</p>
                )}
                <div className="flex items-center gap-3 mt-4">
                  <StockBadge product={selectedProduct} />
                  <span className="text-sm text-zinc-600">
                    {selectedProduct.totalStock} unidades en stock
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-zinc-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-semibold tracking-tight text-zinc-900 tabular">{selectedProduct.variantCount}</p>
                    <p className="text-xs text-zinc-500">Variantes</p>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-semibold tracking-tight text-zinc-900 tabular">{selectedProduct.totalStock}</p>
                    <p className="text-xs text-zinc-500">Stock total</p>
                  </div>
                </div>
              </div>
            </div>
            
            <h5 className="text-lg font-semibold text-zinc-900 mb-4">
              Variantes ({selectedProduct.variants.length})
            </h5>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      {settings.variantAttr1Label}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      {settings.variantAttr2Label}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Stock Mín.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Precio Contado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-200">
                  {selectedProduct.variants.map((variant) => (
                    <tr key={variant.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                        {variant.size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {variant.color}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {(variant as any).stockQuantity || (variant as any).stock_quantity || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                        {(variant as any).minStockAlert || (variant as any).min_stock_alert || 5}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {formatMoney((variant as any).priceCash || (variant as any).price_cash || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {((variant as any).stockQuantity || (variant as any).stock_quantity || 0) <= ((variant as any).minStockAlert || (variant as any).min_stock_alert || 5) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Bajo
                          </span>
                        ) : ((variant as any).stockQuantity || (variant as any).stock_quantity || 0) === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Sin stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header de la página */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 flex items-center gap-3">
              <Package className="size-6 shrink-0 text-brand-600" />
              Productos
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Gestiona tu inventario de productos y variantes
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadProducts}
              disabled={loading}
              className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="sm:hidden lg:inline">Actualizar</span>
            </button>
            {canEdit && (
              <>
                <button
                  onClick={() => router.push('/productos/importar')}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 shadow-xs transition hover:bg-zinc-50"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Importar Excel
                </button>
                <button
                  onClick={() => router.push('/productos/nuevo')}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-xs transition hover:bg-brand-700"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo producto
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Área de contenido principal */}
      <div className="bg-white rounded-card shadow-card border border-zinc-200">
        {/* Barra de búsqueda y filtros */}
        <div className="p-6 border-b border-zinc-200">
          <div className="flex flex-col space-y-4">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, marca o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            
            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="h-5 w-5 text-zinc-400" />
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-zinc-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="border border-zinc-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
              >
                <option value="">Todas las marcas</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
              
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showLowStock}
                  onChange={(e) => setShowLowStock(e.target.checked)}
                  className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                />
                <span>Solo stock bajo</span>
              </label>
              
              {(searchTerm || selectedCategory || selectedBrand || showLowStock) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-zinc-500 hover:text-zinc-700 underline"
                >
                  Limpiar filtros
                </button>
              )}
              
              {pagination.totalItems > 0 && (
                <div className="text-sm text-zinc-500 ml-auto">
                  {pagination.totalItems} producto{pagination.totalItems !== 1 ? 's' : ''} encontrado{pagination.totalItems !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-brand-600 mx-auto mb-4" />
            <p className="text-zinc-600">Cargando productos...</p>
          </div>
        )}

        {/* Estado de error */}
        {error && (
          <div className="p-12 text-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadProducts}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Tabla de productos */}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Marca
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Variantes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Stock Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-zinc-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ProductImage product={product} />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-zinc-900">
                              {product.name}
                            </div>
                            {product.barcode && (
                              <div className="text-sm text-zinc-500">
                                Código: {product.barcode}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {product.brand}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {product.category?.name ?? ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                        {product.variantCount} variante{product.variantCount !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900">
                        {product.totalStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StockBadge product={product} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowModal(true);
                          }}
                          className="inline-flex size-8 items-center justify-center rounded-md text-zinc-500 hover:text-brand-700 hover:bg-brand-50" title="Ver" aria-label="Ver"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canEdit && (
                        <>
                        <button
                          onClick={() => router.push(`/productos/${product.id}/editar`)}
                          className="inline-flex size-8 items-center justify-center rounded-md text-zinc-500 hover:text-brand-700 hover:bg-brand-50" title="Editar" aria-label="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="inline-flex size-8 items-center justify-center rounded-md text-zinc-500 hover:text-red-700 hover:bg-red-50" title="Eliminar" aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        </>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Paginación */}
            <Pagination />
          </>
        )}

        {/* Estado vacío - sin productos */}
        {!loading && !error && products.length === 0 && !searchTerm && !selectedCategory && !selectedBrand && !showLowStock && (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">No hay productos</h3>
            <p className="text-zinc-600 mb-6">
              Aún no tienes productos en tu inventario. ¡Comienza agregando tu primer producto!
            </p>
            <button 
              onClick={() => router.push('/productos/nuevo')}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center mx-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Producto
            </button>
          </div>
        )}

        {/* Estado vacío - búsqueda sin resultados */}
        {!loading && !error && products.length === 0 && (searchTerm || selectedCategory || selectedBrand || showLowStock) && (
          <div className="p-12 text-center">
            <Search className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Sin resultados</h3>
            <p className="text-zinc-600 mb-6">
              No se encontraron productos que coincidan con los filtros aplicados.
            </p>
            <button
              onClick={clearFilters}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      <ProductDetailsModal />
    </div>
  );
}