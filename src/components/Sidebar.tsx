'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaHome,
  FaBox,
  FaShoppingCart,
  FaTruck,
  FaChartBar,
  FaCog,
  FaTimes,
  FaFileInvoice,
  FaPlug,
  FaTag,
  FaTags
} from 'react-icons/fa';
import { Building2, ClipboardList, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { getModulesForRoles, type ModuleKey } from '@/lib/role-permissions';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  module: ModuleKey;
  disabled?: boolean;
  tooltip?: string;
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: FaHome, module: 'dashboard' },
  { name: 'Ventas', href: '/ventas', icon: FaShoppingCart, module: 'ventas' },
  { name: 'Pedidos', href: '/pedidos', icon: ClipboardList, module: 'pedidos' },
  { name: 'Productos', href: '/productos', icon: FaBox, module: 'productos' },
  { name: 'Categorías', href: '/categorias', icon: FaTags, module: 'categorias' },
  { name: 'Precios', href: '/precios', icon: FaTag, module: 'precios' },
  { name: 'Compras', href: '/compras', icon: FaTruck, module: 'compras' },
  { name: 'Proveedores', href: '/proveedores', icon: Building2, module: 'proveedores' },
  { name: 'Facturas', href: '/facturas', icon: FaFileInvoice, module: 'facturas' },
  {
    name: 'Reportes',
    href: '/reportes',
    icon: FaChartBar,
    module: 'reportes',
    disabled: true,
    tooltip: 'Próximamente disponible',
  },
  { name: 'Integraciones', href: '/configuracion#integraciones', icon: FaPlug, module: 'integraciones' },
  { name: 'Usuarios', href: '/configuracion/usuarios', icon: Users, module: 'usuarios' },
  { name: 'Configuración', href: '/configuracion', icon: FaCog, module: 'configuracion' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const activeTenant = session?.tenants.find((t) => t.tenantId === session.tenantId);
  const modules = getModulesForRoles(activeTenant?.roles ?? []);
  const visibleItems = menuItems.filter((item) => modules.has(item.module));
  const initials = (activeTenant?.name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header del sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-white">{initials}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">{activeTenant?.name ?? ''}</h2>
              <p className="text-sm text-gray-300">Gestión Comercial</p>
            </div>
          </div>

          {/* Botón cerrar en móvil */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (item.disabled) {
              return (
                <div
                  key={item.name}
                  className="relative group"
                >
                  <div
                    className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-not-allowed
                      text-gray-500 bg-gray-800
                    `}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </div>
                  
                  {/* Tooltip */}
                  {item.tooltip && (
                    <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {item.tooltip}
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-700"></div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  // Cerrar sidebar en móvil después de navegar
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }
                `}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer del sidebar */}
        <div className="border-t border-gray-700 p-4">
          <div className="text-xs text-gray-400 text-center">
            <p>Sistema de Gestión</p>
            <p>Versión 1.0.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}