/**
 * Mapa rol → módulos. Fuente única de verdad de permisos (mismo patrón que
 * web/lib/role-permissions.ts de Mi Club). Lo consumen el proxy (guard de
 * páginas), las rutas de API (requireTenant) y el Sidebar.
 *
 * Un usuario puede tener varios roles en el mismo negocio: sus permisos son la
 * UNIÓN de los módulos de cada rol.
 */

export const MODULE_KEYS = [
  'dashboard',
  'ventas',
  'pedidos', // pedidos de la tienda online
  'productos', // ver catálogo y stock
  'productos-editar', // alta/edición/baja de productos e importación
  'categorias',
  'precios',
  'compras',
  'proveedores',
  'facturas',
  'reportes',
  'integraciones', // AFIP y Tienda Nube
  'configuracion', // datos y parámetros del negocio
  'usuarios', // invitar y administrar usuarios del negocio
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export const TENANT_ROLES = ['ADMIN', 'ENCARGADO', 'VENDEDOR'] as const;
export type TenantRole = (typeof TENANT_ROLES)[number];

export const ROLE_LABELS: Record<TenantRole, string> = {
  ADMIN: 'Administrador',
  ENCARGADO: 'Encargado',
  VENDEDOR: 'Vendedor',
};

export const ROLE_DESCRIPTIONS: Record<TenantRole, string> = {
  ADMIN: 'Acceso total: configuración, usuarios e integraciones.',
  ENCARGADO: 'Productos, precios, compras, proveedores, ventas, pedidos y facturas.',
  VENDEDOR: 'Ventas, pedidos, consulta de productos y facturas.',
};

const ROLE_MODULES: Record<TenantRole, readonly ModuleKey[] | '*'> = {
  ADMIN: '*',
  ENCARGADO: [
    'dashboard',
    'ventas',
    'pedidos',
    'productos',
    'productos-editar',
    'categorias',
    'precios',
    'compras',
    'proveedores',
    'facturas',
    'reportes',
  ],
  VENDEDOR: ['dashboard', 'ventas', 'pedidos', 'productos', 'facturas'],
};

export function isTenantRole(value: string): value is TenantRole {
  return (TENANT_ROLES as readonly string[]).includes(value);
}

export function getModulesForRoles(roles: readonly string[]): Set<ModuleKey> {
  const result = new Set<ModuleKey>();
  for (const role of roles) {
    if (!isTenantRole(role)) continue;
    const modules = ROLE_MODULES[role];
    if (modules === '*') return new Set(MODULE_KEYS);
    modules.forEach((m) => result.add(m));
  }
  return result;
}

export function hasModule(roles: readonly string[], module: ModuleKey): boolean {
  return getModulesForRoles(roles).has(module);
}

/**
 * Módulo requerido para abrir una página. `null` = no requiere módulo
 * específico (solo sesión + negocio seleccionado).
 */
const PAGE_MODULES: [prefix: string, module: ModuleKey][] = [
  ['/productos/nuevo', 'productos-editar'],
  ['/productos/importar', 'productos-editar'],
  ['/productos/', 'productos'], // /productos/[id]/editar se chequea abajo
  ['/productos', 'productos'],
  ['/categorias', 'categorias'],
  ['/precios', 'precios'],
  ['/ventas', 'ventas'],
  ['/pedidos', 'pedidos'],
  ['/compras', 'compras'],
  ['/proveedores', 'proveedores'],
  ['/facturas', 'facturas'],
  ['/reportes', 'reportes'],
  ['/integraciones', 'integraciones'],
  ['/configuracion/usuarios', 'usuarios'],
  ['/configuracion', 'configuracion'],
  ['/dashboard', 'dashboard'],
];

export function requiredModuleForPath(pathname: string): ModuleKey | null {
  if (/^\/productos\/[^/]+\/editar/.test(pathname)) return 'productos-editar';
  for (const [prefix, module] of PAGE_MODULES) {
    if (pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`)) {
      return module;
    }
  }
  return null;
}
