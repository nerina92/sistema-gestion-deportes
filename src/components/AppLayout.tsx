'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

const BARE_ROUTES = ['/login', '/seleccionar-negocio', '/platform-admin', '/tienda'];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Rutas que se muestran sin sidebar/header (el proxy ya controla el acceso).
  const isBareRoute = BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  if (isBareRoute) return <>{children}</>;

  // Solo la primera carga muestra el loader; un update() de sesión no debe
  // desmontar la pantalla.
  if (status === 'loading' && !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <div className="size-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!session?.tenantId) return <>{children}</>;

  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
