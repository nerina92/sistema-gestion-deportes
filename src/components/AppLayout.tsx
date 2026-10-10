'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const pathname = usePathname();

  // Rutas que no necesitan autenticación
  const publicRoutes = ['/login', '/'];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Mientras se verifica la autenticación, mostrar loading
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 w-8 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-sm">DL</span>
            </div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  const isPublicRoute = publicRoutes.includes(pathname);
  const shouldShowLayout = isAuthenticated && !isPublicRoute;

  if (!shouldShowLayout) {
    // Para rutas públicas o usuarios no autenticados, mostrar solo el contenido
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}