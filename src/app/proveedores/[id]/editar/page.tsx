'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Building2, Save, X, Mail, Phone, MapPin, FileText, RefreshCw } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  isActive: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
}

export default function EditarProveedorPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    isActive: true
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Cargar datos del proveedor
  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setLoadingData(true);
        const response = await fetch(`/api/suppliers/${supplierId}`);

        if (!response.ok) {
          if (response.status === 404) {
            alert('Proveedor no encontrado');
            router.push('/proveedores');
            return;
          }
          throw new Error('Error al cargar proveedor');
        }

        const supplierData = await response.json();
        setSupplier(supplierData);
        
        // Llenar el formulario con los datos cargados
        setFormData({
          name: supplierData.name,
          email: supplierData.email || '',
          phone: supplierData.phone || '',
          address: supplierData.address || '',
          notes: supplierData.notes || '',
          isActive: supplierData.isActive
        });
      } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos del proveedor');
        router.push('/proveedores');
      } finally {
        setLoadingData(false);
      }
    };

    if (supplierId) {
      fetchSupplier();
    }
  }, [supplierId, router]);

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar nombre (requerido, min 2 caracteres)
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar email (opcional pero debe ser válido si se ingresa)
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en los campos
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        isActive: formData.isActive
      };

      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Si el error es de nombre duplicado, mostrarlo en el campo específico
        if (errorData.error?.includes('nombre')) {
          setErrors({ name: errorData.error });
          return;
        }
        
        throw new Error(errorData.error || 'Error al actualizar proveedor');
      }

      // Mostrar éxito y redirigir
      alert('Proveedor actualizado exitosamente');
      router.push('/proveedores');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error al actualizar proveedor');
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de carga
  if (loadingData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando datos del proveedor...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no se encontró el proveedor
  if (!supplier) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Building2 className="mr-3 text-indigo-600" />
          Editar Proveedor
        </h1>
        <p className="mt-2 text-gray-600">
          Modifica los datos de <strong>{supplier.name}</strong>
        </p>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del proveedor *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: Nike Argentina S.A."
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email de contacto
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="contacto@proveedor.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="phone"
                type="text"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="+54 11 4567-8900"
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={2}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Av. Corrientes 1234, CABA, Buenos Aires"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notas adicionales
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Información adicional sobre el proveedor, términos especiales, etc."
              />
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado del proveedor
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={() => handleInputChange('isActive', true)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">🟢 Activo</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isActive"
                  checked={!formData.isActive}
                  onChange={() => handleInputChange('isActive', false)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">⚫ Inactivo</span>
              </label>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/proveedores')}
              disabled={loading}
              className="flex-1 sm:flex-none border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* Información adicional */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Información:</strong> Los campos marcados con (*) son obligatorios. 
          Los cambios se aplicarán inmediatamente después de guardar.
        </p>
      </div>
    </div>
  );
}