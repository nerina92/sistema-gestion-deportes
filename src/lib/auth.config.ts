import type { NextAuthConfig } from 'next-auth';

/**
 * Config de NextAuth apta para el proxy (sin providers ni acceso a DB).
 * Mismo split que Mi Club: el proxy usa esta config y src/lib/auth.ts agrega
 * el provider de Google y el callback jwt que consulta la base.
 */
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  trustHost: true,
  callbacks: {
    async session({ session, token }) {
      session.userId = token.userId ?? '';
      session.tenantId = token.tenantId;
      session.tenants = token.tenants ?? [];
      session.isPlatformAdmin = token.isPlatformAdmin ?? false;
      return session;
    },
  },
};
