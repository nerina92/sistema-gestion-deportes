// Script para resolver migraciones fallidas en producción
// Uso: npx tsx scripts/resolve-failed-migration.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Buscando migraciones fallidas...');

    // Eliminar registro de migración fallida
    const deleted = await prisma.$executeRaw`
      DELETE FROM "_prisma_migrations"
      WHERE migration_name = '20260216180042_change_afip_certs_to_content'
      AND finished_at IS NULL
    `;

    console.log(`✅ Eliminados ${deleted} registros de migraciones fallidas`);
    console.log('✨ Ahora puedes ejecutar: npm run build');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
