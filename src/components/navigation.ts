import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Package,
  Tags,
  BadgeDollarSign,
  Truck,
  Building2,
  FileText,
  BarChart3,
  Plug,
  Users,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { ModuleKey } from '@/lib/role-permissions';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  module: ModuleKey;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Menú principal agrupado por área de trabajo. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operación',
    items: [
      { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
      { name: 'Ventas', href: '/ventas', icon: ShoppingCart, module: 'ventas' },
      { name: 'Pedidos', href: '/pedidos', icon: ClipboardList, module: 'pedidos' },
      { name: 'Facturas', href: '/facturas', icon: FileText, module: 'facturas' },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { name: 'Productos', href: '/productos', icon: Package, module: 'productos' },
      { name: 'Categorías', href: '/categorias', icon: Tags, module: 'categorias' },
      { name: 'Precios', href: '/precios', icon: BadgeDollarSign, module: 'precios' },
    ],
  },
  {
    label: 'Abastecimiento',
    items: [
      { name: 'Compras', href: '/compras', icon: Truck, module: 'compras' },
      { name: 'Proveedores', href: '/proveedores', icon: Building2, module: 'proveedores' },
    ],
  },
  {
    label: 'Negocio',
    items: [
      { name: 'Reportes', href: '/reportes', icon: BarChart3, module: 'reportes' },
      { name: 'Integraciones', href: '/integraciones', icon: Plug, module: 'integraciones' },
      { name: 'Usuarios', href: '/configuracion/usuarios', icon: Users, module: 'usuarios' },
      { name: 'Configuración', href: '/configuracion', icon: Settings, module: 'configuracion' },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

/** Ítem del menú que corresponde a la ruta actual (el prefijo más largo gana). */
export function activeNavItem(pathname: string): NavItem | undefined {
  return ALL_ITEMS.filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`)).sort(
    (a, b) => b.href.length - a.href.length
  )[0];
}
