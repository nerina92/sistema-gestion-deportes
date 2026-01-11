import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Configurar en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/((?!auth|seed-admin).*)'
  ],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('Middleware ejecutándose en:', pathname);

  // Obtener token de las cookies
  const cookieHeader = request.headers.get('cookie');
  let token: string | null = null;
  
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth-token') {
        token = value;
        break;
      }
    }
  }

  // Si no hay token
  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'No autorizado - Token requerido' },
        { status: 401 }
      );
    }
    
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si hay token, verificar básicamente (sin importar la librería jwt aquí)
  try {
    // Decodificar JWT básico sin verificar firma (solo para middleware)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token inválido');
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expirado');
    }

    // Token válido, continuar
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId || '');
    response.headers.set('x-user-email', payload.email || '');
    return response;
    
  } catch (error) {
    console.log('Token inválido:', error);
    
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'No autorizado - Token inválido' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    loginUrl.searchParams.set('expired', 'true');
    return NextResponse.redirect(loginUrl);
  }
}