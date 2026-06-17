'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaTags,
  FaPlus,
  FaSync,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
} from 'react-icons/fa';

interface Category {
  id: string;
  name: string;
  productCount: number;
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Crear
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const newNameInputRef = useRef<HTMLInputElement>(null);

  // Editar inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Cargar categorías
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }
      setCategories(data.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar categorías');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Crear categoría
  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      // En vez de quedarse mudo, guiamos al usuario al campo de texto.
      newNameInputRef.current?.focus();
      return;
    }
    setCreating(true);
    setError('');
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }
      setNewName('');
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la categoría');
    } finally {
      setCreating(false);
    }
  };

  // Iniciar edición
  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  // Guardar edición
  const handleUpdate = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    setSavingEdit(true);
    setError('');
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }
      cancelEdit();
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la categoría');
    } finally {
      setSavingEdit(false);
    }
  };

  // Borrar categoría
  const handleDelete = async (category: Category) => {
    if (category.productCount > 0) return;
    const confirmed = window.confirm(
      `¿Está seguro que desea eliminar la categoría "${category.name}"?`
    );
    if (!confirmed) return;
    setError('');
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Error ${response.status}`);
      }
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la categoría');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header de la página */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaTags className="mr-3 text-blue-600" />
              Categorías
            </h1>
            <p className="mt-2 text-gray-600">
              Gestiona las categorías de tus productos
            </p>
          </div>
          <button
            onClick={loadCategories}
            disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50"
          >
            <FaSync className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FaExclamationTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Área de contenido principal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Crear nueva categoría */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              ref={newNameInputRef}
              type="text"
              placeholder="Nombre de la categoría..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Nueva categoría
            </button>
          </div>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div className="p-12 text-center">
            <FaSync className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando categorías...</p>
          </div>
        )}

        {/* Tabla de categorías */}
        {!loading && categories.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Productos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => {
                  const isEditing = editingId === category.id;
                  const hasProducts = category.productCount > 0;
                  return (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdate(category.id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">
                            {category.name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.productCount} producto
                        {category.productCount !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleUpdate(category.id)}
                              disabled={savingEdit || !editName.trim()}
                              className="text-green-600 hover:text-green-900 inline-flex items-center disabled:opacity-50"
                            >
                              <FaCheck className="h-4 w-4 mr-1" />
                              Guardar
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={savingEdit}
                              className="text-gray-500 hover:text-gray-700 inline-flex items-center disabled:opacity-50"
                            >
                              <FaTimes className="h-4 w-4 mr-1" />
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(category)}
                              className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                            >
                              <FaEdit className="h-4 w-4 mr-1" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(category)}
                              disabled={hasProducts}
                              title={
                                hasProducts
                                  ? 'No se puede borrar: la categoría tiene productos asignados'
                                  : 'Borrar categoría'
                              }
                              className="text-red-600 hover:text-red-900 inline-flex items-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-red-600"
                            >
                              <FaTrash className="h-4 w-4 mr-1" />
                              Borrar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Estado vacío */}
        {!loading && categories.length === 0 && (
          <div className="p-12 text-center">
            <FaTags className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay categorías
            </h3>
            <p className="text-gray-600">
              Aún no tienes categorías. Crea la primera usando el formulario de arriba.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
