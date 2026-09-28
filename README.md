# Gestión Comercial (multinegocio)

Sistema web de gestión para comercios de cualquier rubro: productos con variantes configurables, stock, precios (contado / débito / financiado), compras, proveedores, ventas, facturación electrónica AFIP (Factura C) y sincronización de stock con Tienda Nube.

Es **multitenant**: una sola instalación atiende a varios negocios, cada uno con sus datos aislados. El login es **solo con Google** y **solo por invitación**.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4
- PostgreSQL + Prisma 5 (dos clientes: plataforma y negocio)
- Auth.js v5 (`next-auth@5.0.0-beta.30`) con Google
- Deploy: Railway

## Arquitectura multitenant (mismo patrón que Mi Club)

| Pieza | Dónde | Qué hace |
|---|---|---|
| Schema `public` (plataforma) | `prisma/platform/schema.prisma` | `users`, `tenants`, `user_tenant_roles` (N:M, varios roles por negocio), `user_global_roles` (`PLATFORM_ADMIN`) y `member_invitations` |
| Un schema Postgres por negocio | `prisma/tenant/schema.prisma` | Productos, ventas, compras, facturas, integraciones y `tenant_settings`. Schema `tenant_<slug>` |
| Cliente por negocio | `src/lib/tenant-db.ts` | Un `PrismaClient` por schema (cacheado), fijado con `?schema=` |
| Migraciones por negocio | `src/lib/tenant-migrations.ts` | Aplica `prisma/tenant/migrations/*` en cada schema y las registra en `_tenant_migrations` (equivalente al TenantMigrationService de Mi Club) |
| Sesión | `src/lib/auth.ts`, `src/lib/auth.config.ts` | JWT con `tenants[]` (negocios y roles) y `tenantId` (negocio activo). El negocio se cambia con `update({ tenantId })` desde `/seleccionar-negocio` |
| Guard de APIs | `src/lib/api-auth.ts` → `requireTenant(módulo)` | Valida sesión, negocio activo y roles **contra la base en cada request** (equivalente al TenantRoleEnricher) y devuelve el cliente Prisma del negocio |
| Guard de páginas | `src/proxy.ts` | Redirige a `/login`, `/seleccionar-negocio` o `/platform-admin`, y bloquea páginas según el rol |
| Permisos | `src/lib/role-permissions.ts` | Mapa rol → módulos (fuente única, como en Mi Club) |

### Roles por negocio

| Rol | Acceso |
|---|---|
| Administrador (`ADMIN`) | Todo: configuración, usuarios, integraciones, importación |
| Encargado (`ENCARGADO`) | Productos, categorías, precios, compras, proveedores, ventas, facturas |
| Vendedor (`VENDEDOR`) | Ventas, consulta de productos, facturas |

Un usuario puede tener varios roles; sus permisos son la unión.

### Flujo de acceso

1. Un **administrador de plataforma** (email en `PLATFORM_ADMIN_EMAILS`) entra con Google y da de alta un negocio en `/platform-admin`, con el email de Google del dueño. Se crea el schema del negocio con todas las migraciones.
2. El dueño entra con Google y su invitación se acepta sola (rol Administrador).
3. El dueño invita a su equipo desde **Usuarios** (`/configuracion/usuarios`).
4. Un email sin invitación no puede entrar.

### Configuración por negocio

Desde **Configuración** cada negocio define: rubro, datos fiscales (encabezado de facturas), etiquetas de los atributos de variante (Talle/Color, Medida/Material, Tamaño/Sabor…), márgenes y recargos por defecto, redondeo de precios y alerta de stock mínimo. Los atributos de variante son opcionales.

La importación desde Excel usa una planilla genérica: la fila 1 lleva encabezados (`Nombre` obligatorio; `Marca`, `Categoría`, `SKU`, `Código de barras`, atributos, `Costo`, `Stock` opcionales).

## Desarrollo local

```bash
cp .env.example .env        # completar DATABASE_URL, AUTH_SECRET, Google y PLATFORM_ADMIN_EMAILS
npm install                 # genera los dos clientes Prisma
npm run db:migrate          # migra la plataforma y todos los negocios
npm run dev
```

En Google Cloud Console agregá `http://localhost:3000/api/auth/callback/google` como URI de redirección.

Alta de un negocio sin usar la web:

```bash
npm run tenant:create -- "Nombre del negocio" dueno@gmail.com [slug] [rubro]
```

### Cambios de schema

- **Plataforma**: editar `prisma/platform/schema.prisma` y `npm run db:platform:dev`.
- **Negocios**: editar `prisma/tenant/schema.prisma` y `npm run db:tenant:new -- nombre` (necesita `SHADOW_DATABASE_URL`). La migración se aplica a todos los negocios en el próximo deploy o con `npm run db:migrate:tenants`.

## Deploy en Railway

1. Crear un proyecto en Railway y agregar **PostgreSQL**.
2. Agregar un servicio desde este repo de GitHub. `railway.json` ya define:
   - build: `npm run build`
   - pre-deploy: `npm run db:migrate` (plataforma + todos los negocios)
   - start: `npm start`
   - healthcheck: `/api/health`
3. Variables del servicio:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET`
   - `PLATFORM_ADMIN_EMAILS` (tu email de Google)
4. Generar un dominio público (Settings → Networking) y agregar `https://<dominio>/api/auth/callback/google` en el cliente OAuth de Google.
5. Entrar con Google en `https://<dominio>` y dar de alta el primer negocio en `/platform-admin`.

> Los documentos `AUTENTICACION-COMPLETA.md`, `EMPEZAR-AQUI.md` y los `TESTING-*.md` describen la versión anterior (un solo negocio, login con contraseña) y quedaron desactualizados.
