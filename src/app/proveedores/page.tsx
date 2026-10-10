'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Plus, 
  Search, 
  RefreshCw, 
  Eye, 
  Edit, 
  Trash2, 
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';

// Tipos para los datos
interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProveedoresPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Cargar proveedores
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const url = showInactive 
        ? '/api/suppliers' 
        : '/api/suppliers?isActive=true';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al cargar proveedores');
      }
      
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  // Efecto para cargar proveedores inicialmente
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Filtrar proveedores por búsqueda
  useEffect(() => {
    const filtered = suppliers.filter(supplier => {
      const searchLower = searchTerm.toLowerCase();
      return supplier.name.toLowerCase().includes(searchLower) ||
             (supplier.email && supplier.email.toLowerCase().includes(searchLower));
    });
    setFilteredSuppliers(filtered);
  }, [suppliers, searchTerm]);

  // Manejar desactivación de proveedor
  const handleDeactivateSupplier = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres desactivar este proveedor?')) {
      return;
    }

    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Error al desactivar proveedor');
        return;
      }

      fetchSuppliers();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al desactivar proveedor');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header de la página */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 flex items-center gap-3">
              <Building2 className="size-6 shrink-0 text-brand-600" />
              Proveedores
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Administra tu red de proveedores y sus datos de contacto
            </p>
          </div>
          <button 
            onClick={() => router.push('/proveedores/nuevo')}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
        <div className="bg-white p-6 rounded-card shadow-card border border-zinc-200">
          <div className="flex items-center">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <Building2 className="h-6 w-6 text-zinc-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-600">Total Proveedores</p>
              <p className="text-2xl font-semibold tracking-tight text-zinc-900 tabular">{suppliers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-card shadow-card border border-zinc-200">
          <div className="flex items-center">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-zinc-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-600">Activos</p>
              <p className="text-2xl font-semibold tracking-tight text-zinc-900 tabular">
                {suppliers.filter(s => s.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-card shadow-card border border-zinc-200">
          <div className="flex items-center">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <Phone className="h-6 w-6 text-zinc-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-600">Con Teléfono</p>
              <p className="text-2xl font-semibold tracking-tight text-zinc-900 tabular">
                {suppliers.filter(s => s.phone).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-card shadow-card border border-zinc-200">
          <div className="flex items-center">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <Mail className="h-6 w-6 text-zinc-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-600">Con Email</p>
              <p className="text-2xl font-semibold tracking-tight text-zinc-900 tabular">
                {suppliers.filter(s => s.email).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de búsqueda y filtros */}
      <div className="bg-white p-4 rounded-card shadow-card border border-zinc-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-zinc-700">Mostrar inactivos</span>
            </label>
          </div>

          <button
            onClick={fetchSuppliers}
            className="flex items-center px-3 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabla de proveedores */}
      <div className="bg-white rounded-card shadow-card border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-brand-600 mx-auto mb-4" />
            <p className="text-zinc-600">Cargando proveedores...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="h-24 w-24 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-12 w-12 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3">
                {searchTerm ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
              </h3>
              <p className="text-zinc-600 mb-6">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza agregando tu primer proveedor para gestionar tus compras'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => router.push('/proveedores/nuevo')}
                  className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center mx-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer proveedor
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-zinc-200">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-zinc-900">
                          {supplier.name}
                        </div>
                        {supplier.address && (
                          <div className="text-sm text-zinc-500 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {supplier.address}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {supplier.email && (
                          <div className="text-sm text-zinc-900 flex items-center">
                            <Mail className="h-3 w-3 mr-2 text-zinc-400" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="text-sm text-zinc-900 flex items-center">
                            <Phone className="h-3 w-3 mr-2 text-zinc-400" />
                            {supplier.phone}
                          </div>
                        )}
                        {!supplier.email && !supplier.phone && (
                          <span className="text-sm text-zinc-400">Sin contacto</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        supplier.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {supplier.isActive ? '🟢 Activo' : '⚫ Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            setShowDetailModal(true);
                          }}
                          className="text-zinc-600 hover:text-brand-600 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/proveedores/${supplier.id}/editar`)}
                          className="text-zinc-600 hover:text-brand-600 transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {supplier.isActive && (
                          <button
                            onClick={() => handleDeactivateSupplier(supplier.id)}
                            className="text-zinc-600 hover:text-red-600 transition-colors"
                            title="Desactivar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showDetailModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-zinc-900">
                  Detalles del Proveedor
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Nombre
                  </label>
                  <p className="mt-1 text-sm text-zinc-900">{selectedSupplier.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-zinc-900">
                    {selectedSupplier.email || 'No especificado'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Teléfono
                  </label>
                  <p className="mt-1 text-sm text-zinc-900">
                    {selectedSupplier.phone || 'No especificado'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Dirección
                  </label>
                  <p className="mt-1 text-sm text-zinc-900">
                    {selectedSupplier.address || 'No especificada'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Notas
                  </label>
                  <p className="mt-1 text-sm text-zinc-900">
                    {selectedSupplier.notes || 'Sin notas'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Estado
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedSupplier.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedSupplier.isActive ? '🟢 Activo' : '⚫ Inactivo'}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Fecha de registro
                  </label>
                  <p className="mt-1 text-sm text-zinc-900">
                    {new Date(selectedSupplier.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-zinc-300 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    router.push(`/proveedores/${selectedSupplier.id}/editar`);
                  }}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}