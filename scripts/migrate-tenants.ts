// Aplica las migraciones pendientes de prisma/tenant/migrations en el schema
// de cada negocio. Se corre en cada deploy (pre-deploy de Railway) después de
// las migraciones de plataforma.
// Uso: npm run db:migrate:tenants
import { platformDb } from '../src/lib/platform-db';
import { migrateTenantSchema } from '../src/lib/tenant-migrations';

async function main() {
  const tenants = await platformDb.tenant.findMany({ select: { slug: true, schemaName: true } });
  console.log(`Migrando ${tenants.length} negocio(s)...`);
  let failed = 0;
  for (const t of tenants) {
    try {
      const applied = await migrateTenantSchema(t.schemaName);
      console.log(`  ${t.slug}: ${applied.length ? applied.join(', ') : 'al día'}`);
    } catch (error) {
      failed++;
      console.error(`  ${t.slug}: ERROR`, error);
    }
  }
  if (failed > 0) {
    console.error(`${failed} negocio(s) con error de migración`);
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => platformDb.$disconnect());
