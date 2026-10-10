/**
 * Helpers para armar la URL de conexión a un schema de Postgres concreto.
 */

const SCHEMA_NAME_RE = /^[a-z][a-z0-9_]{0,62}$/;

export function assertValidSchemaName(schemaName: string): void {
  if (!SCHEMA_NAME_RE.test(schemaName)) {
    throw new Error(`Nombre de schema inválido: ${schemaName}`);
  }
}

function baseDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL no está configurada');
  return url;
}

/** URL para Prisma apuntando al schema indicado (Prisma setea el search_path). */
export function prismaUrlForSchema(schemaName: string): string {
  assertValidSchemaName(schemaName);
  const url = new URL(baseDatabaseUrl());
  url.searchParams.set('schema', schemaName);
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', process.env.TENANT_DB_CONNECTION_LIMIT ?? '5');
  }
  return url.toString();
}

/** URL para `pg` sin parámetros propios de Prisma. */
export function pgConnectionString(): string {
  const url = new URL(baseDatabaseUrl());
  for (const p of ['schema', 'connection_limit', 'pool_timeout', 'pgbouncer']) {
    url.searchParams.delete(p);
  }
  return url.toString();
}
