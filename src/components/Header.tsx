'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaBars, FaSignOutAlt, FaUser } from 'react-icons/fa';

interface HeaderProps {
  onMenuClick: () => void;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  // Obtener información del usuario al cargar el componente
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/login');
        router.refresh();
      } else {
        console.error('Error during logout');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between">
          {/* Botón hamburguesa (solo visible en móvil) */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
          >
            <FaBars className="h-5 w-5" />
          </button>

          {/* Título de la página (en móvil se centra) */}
          <div className="lg:hidden flex-1 text-center">
            <h1 className="text-lg font-semibold text-gray-900">Deportes Laboulaye</h1>
          </div>

          {/* Información del usuario y logout */}
          <div className="flex items-center space-x-4">
            {/* Información del usuario */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FaUser className="h-4 w-4 text-blue-600" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || 'Cargando...'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role || ''}
                </p>
              </div>
            </div>

            {/* Botón de logout */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              disabled={loggingOut}
            >
              <FaSignOutAlt className="h-4 w-4" />
              <span className="hidden sm:inline">
                {loggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Modal de confirmación de logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FaSignOutAlt className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Cerrar Sesión</h3>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                ¿Estás seguro de que quieres cerrar sesión? Serás redirigido a la página de login.
              </p>

              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  disabled={loggingOut}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loggingOut}
                >
                  {loggingOut ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cerrando...
                    </>
                  ) : (
                    'Cerrar Sesión'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}