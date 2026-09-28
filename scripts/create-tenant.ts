// Alta de un negocio desde la línea de comandos (alternativa a /platform-admin).
// Uso: npm run tenant:create -- "Nombre del negocio" dueno@gmail.com [slug] [rubro]
import { platformDb } from '../src/lib/platform-db';
import { createTenant, slugify } from '../src/lib/tenants';

async function main() {
  const [name, ownerEmail, slugArg, businessType] = process.argv.slice(2);
  if (!name || !ownerEmail) {
    console.error('Uso: npm run tenant:create -- "Nombre" dueno@gmail.com [slug] [rubro]');
    process.exitCode = 1;
    return;
  }
  const tenant = await createTenant({ name, ownerEmail, slug: slugArg || slugify(name), businessType });
  console.log(`Negocio creado: ${tenant.name} (${tenant.slug}) — schema ${tenant.schemaName}`);
  console.log(`${ownerEmail} ya puede entrar con Google como Administrador.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => platformDb.$disconnect());
