import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';
import {
  fetchUserTenants,
  findUserIdByEmail,
  isPlatformAdmin,
  resolveGoogleSignIn,
  type TenantSummary,
} from './memberships';

declare module 'next-auth' {
  interface Session {
    userId?: string;
    /** Negocio activo (Tenant.id). Se elige en /seleccionar-negocio. */
    tenantId?: string;
    tenants: TenantSummary[];
    isPlatformAdmin: boolean;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    userId?: string;
    tenantId?: string;
    tenants?: TenantSummary[];
    tenantsFetchedAt?: number;
    isPlatformAdmin?: boolean;
  }
}

// Cada cuánto se re-leen de la base los negocios/roles del usuario, para que
// una invitación nueva o una baja se refleje sin volver a loguearse.
const TENANTS_REFRESH_MS = 60_000;

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      // Lee AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET del entorno.
      authorization: { params: { prompt: 'select_account' } },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Acceso solo por invitación: si el email no tiene usuario ni invitación
    // pendiente, se rechaza el login.
    async signIn({ account, profile }) {
      if (account?.provider !== 'google' || !profile?.email) return false;
      if (profile.email_verified === false) return false;
      const userId = await resolveGoogleSignIn({
        email: profile.email,
        name: profile.name,
        image: typeof profile.picture === 'string' ? profile.picture : null,
        sub: profile.sub,
      });
      return userId ? true : '/login?error=NoInvitation';
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.email) {
        token.userId = (await findUserIdByEmail(user.email)) ?? undefined;
        token.tenantsFetchedAt = undefined;
      }
      if (!token.userId) return token;

      const mustRefresh =
        !token.tenantsFetchedAt ||
        Date.now() - token.tenantsFetchedAt > TENANTS_REFRESH_MS ||
        (trigger === 'update' && session?.refreshTenants);

      if (mustRefresh) {
        const [tenants, platformAdmin] = await Promise.all([
          fetchUserTenants(token.userId),
          isPlatformAdmin(token.userId),
        ]);
        token.tenants = tenants;
        token.isPlatformAdmin = platformAdmin;
        token.tenantsFetchedAt = Date.now();
      }

      const tenants = token.tenants ?? [];
      // Cambio de negocio desde el selector: solo a uno donde tenga rol.
      if (trigger === 'update' && typeof session?.tenantId === 'string') {
        if (tenants.some((t) => t.tenantId === session.tenantId)) {
          token.tenantId = session.tenantId;
        }
      }
      if (token.tenantId && !tenants.some((t) => t.tenantId === token.tenantId)) {
        token.tenantId = undefined;
      }
      if (!token.tenantId && tenants.length === 1) {
        token.tenantId = tenants[0].tenantId;
      }
      return token;
    },
  },
});
