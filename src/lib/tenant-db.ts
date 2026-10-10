import { PrismaClient } from '@/generated/tenant';
import { prismaUrlForSchema } from './db-url';

export type TenantDb = PrismaClient;

/**
 * Un PrismaClient por schema de negocio, cacheado en memoria.
 * Patrón schema-per-tenant (igual que Mi Club): cada negocio tiene su schema
 * Postgres y el cliente queda fijado a ese schema vía `?schema=` en la URL,
 * así que las queries no necesitan filtrar por tenant.
 */
const globalForTenants = globalThis as unknown as {
  tenantClients: Map<string, PrismaClient> | undefined;
};

const clients = globalForTenants.tenantClients ?? new Map<string, PrismaClient>();
globalForTenants.tenantClients = clients;

export function getTenantDb(schemaName: string): PrismaClient {
  let client = clients.get(schemaName);
  if (!client) {
    client = new PrismaClient({
      datasourceUrl: prismaUrlForSchema(schemaName),
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
    clients.set(schemaName, client);
  }
  return client;
}
