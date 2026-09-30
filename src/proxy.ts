import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';
import { getModulesForRoles, requiredModuleForPath } from '@/lib/role-permissions';

// Config liviana (sin providers ni DB), igual que el middleware de Mi Club.
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ['/login'];
// Páginas accesibles con sesión pero sin negocio seleccionado.
const NO_TENANT_PATHS = ['/seleccionar-negocio', '/platform-admin'];

function matches(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isApi = pathname.startsWith('/api/');

  // Rutas de NextAuth y healthcheck: públicas.
  if (pathname.startsWith('/api/auth/') || pathname === '/api/health') return NextResponse.next();
  // Tienda online pública (catálogo y pedidos): con o sin sesión.
  if (matches(pathname, ['/tienda']) || pathname.startsWith('/api/tienda/')) return NextResponse.next();

  const session = req.auth;
  if (!session?.userId) {
    if (matches(pathname, PUBLIC_PATHS)) return NextResponse.next();
    if (isApi) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') loginUrl.searchParams.set('callbackUrl', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // Las APIs validan negocio y permisos contra la base (requireTenant).
  if (isApi) return NextResponse.next();

  if (pathname === '/' || matches(pathname, PUBLIC_PATHS)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (matches(pathname, ['/platform-admin']) && !session.isPlatformAdmin) {
    return NextResponse.redirect(new URL('/seleccionar-negocio', req.url));
  }

  if (matches(pathname, NO_TENANT_PATHS)) return NextResponse.next();

  if (!session.tenantId) {
    const target = session.isPlatformAdmin && session.tenants.length === 0 ? '/platform-admin' : '/seleccionar-negocio';
    return NextResponse.redirect(new URL(target, req.url));
  }

  // Guard de páginas por rol (el backend igual valida cada API).
  const requiredModule = requiredModuleForPath(pathname);
  if (requiredModule) {
    const active = session.tenants.find((t) => t.tenantId === session.tenantId);
    const modules = getModulesForRoles(active?.roles ?? []);
    if (!modules.has(requiredModule)) {
      const fallback = modules.has('dashboard') ? '/dashboard' : '/ventas';
      if (pathname !== fallback) return NextResponse.redirect(new URL(fallback, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
