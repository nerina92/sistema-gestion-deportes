// Genera una migración nueva para el schema de negocios comparando las
// migraciones existentes con prisma/tenant/schema.prisma.
// Requiere SHADOW_DATABASE_URL (una base vacía descartable).
// Uso: npm run db:tenant:new -- nombre_de_la_migracion
import { execFileSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const name = (process.argv[2] ?? '').replace(/[^a-z0-9_]/gi, '_').toLowerCase();
if (!name) {
  console.error('Uso: npm run db:tenant:new -- nombre_de_la_migracion');
  process.exit(1);
}
if (!process.env.SHADOW_DATABASE_URL) {
  console.error('Falta SHADOW_DATABASE_URL (base vacía para calcular el diff)');
  process.exit(1);
}

const sql = execFileSync(
  'npx',
  [
    'prisma', 'migrate', 'diff',
    '--from-migrations', 'prisma/tenant/migrations',
    '--to-schema-datamodel', 'prisma/tenant/schema.prisma',
    '--shadow-database-url', process.env.SHADOW_DATABASE_URL,
    '--script',
  ],
  { encoding: 'utf8' }
);

if (!sql.trim() || sql.includes('This is an empty migration')) {
  console.log('No hay cambios en el schema de negocios.');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const dir = path.join('prisma', 'tenant', 'migrations', `${stamp}_${name}`);
mkdirSync(dir, { recursive: true });
writeFileSync(path.join(dir, 'migration.sql'), sql);
console.log(`Migración creada: ${dir}/migration.sql`);
