import { PrismaClient } from '@/generated/platform';

/**
 * Cliente Prisma del schema de plataforma (`public`): usuarios, negocios,
 * roles por negocio e invitaciones. Los datos de cada negocio NO están acá —
 * usar getTenantDb() (src/lib/tenant-db.ts).
 */
const globalForPlatform = globalThis as unknown as {
  platformDb: PrismaClient | undefined;
};

export const platformDb =
  globalForPlatform.platformDb ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPlatform.platformDb = platformDb;
