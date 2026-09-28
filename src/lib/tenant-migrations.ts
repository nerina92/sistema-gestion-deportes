import { promises as fs } from 'fs';
import path from 'path';
import { Client } from 'pg';
import { assertValidSchemaName, pgConnectionString } from './db-url';

/**
 * Runner de migraciones por schema de negocio (equivalente al
 * TenantMigrationService/Flyway de Mi Club).
 *
 * Las migraciones viven en prisma/tenant/migrations/<nombre>/migration.sql
 * (generadas por Prisma con `npm run db:tenant:new`). Se aplican en orden
 * alfabético dentro del schema del negocio y se registran en la tabla
 * `_tenant_migrations` de ese mismo schema.
 */

const MIGRATIONS_DIR = path.join(process.cwd(), 'prisma', 'tenant', 'migrations');

async function listMigrations(): Promise<{ name: string; sql: string }[]> {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  return Promise.all(
    dirs.map(async (name) => ({
      name,
      sql: await fs.readFile(path.join(MIGRATIONS_DIR, name, 'migration.sql'), 'utf8'),
    }))
  );
}

/**
 * Crea el schema si no existe y aplica las migraciones pendientes.
 * Devuelve los nombres de las migraciones aplicadas.
 */
export async function migrateTenantSchema(schemaName: string): Promise<string[]> {
  assertValidSchemaName(schemaName);
  const migrations = await listMigrations();
  const client = new Client({ connectionString: pgConnectionString() });
  await client.connect();
  const applied: string[] = [];
  try {
    await client.query('BEGIN');
    // Serializa migraciones concurrentes del mismo schema (dos deploys, o
    // un deploy y un alta de negocio al mismo tiempo).
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`tenant-migrate:${schemaName}`]);
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    await client.query(`SET LOCAL search_path TO "${schemaName}"`);
    await client.query(
      `CREATE TABLE IF NOT EXISTS "_tenant_migrations" (
         "name" TEXT PRIMARY KEY,
         "applied_at" TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    );
    const { rows } = await client.query<{ name: string }>('SELECT name FROM "_tenant_migrations"');
    const done = new Set(rows.map((r) => r.name));
    for (const m of migrations) {
      if (done.has(m.name)) continue;
      await client.query(m.sql);
      await client.query('INSERT INTO "_tenant_migrations" (name) VALUES ($1)', [m.name]);
      applied.push(m.name);
    }
    await client.query('COMMIT');
    return applied;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

/** Elimina el schema de un negocio (solo para revertir un alta fallida). */
export async function dropTenantSchema(schemaName: string): Promise<void> {
  assertValidSchemaName(schemaName);
  const client = new Client({ connectionString: pgConnectionString() });
  await client.connect();
  try {
    await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  } finally {
    await client.end();
  }
}
