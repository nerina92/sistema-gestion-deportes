# 🚀 Guía para Empezar - Opción Híbrida

¡Bienvenida! Vamos a construir tu sistema usando GitHub Copilot primero y Ralph después.

---

## 📋 FASE 1: Manual con Copilot (HOY)

Implementaremos las 5 user stories más importantes:

1. ✅ **US-001:** Base de datos (ESTE PRIMERO)
2. ✅ **US-016:** Autenticación
3. ✅ **US-019:** Importación desde Excel ⭐
4. ✅ **US-002:** CRUD de productos
5. ✅ **US-018:** Layout y navegación

---

## 🎯 US-001: Configurar Base de Datos (AHORA)

### Paso 1: Configurar variable de entorno

```bash
# En la terminal, dentro del proyecto:
cp .env.example .env
```

Luego edita `.env` y pon tu conexión de PostgreSQL.

**Opciones:**

**A) PostgreSQL local (si lo tienes instalado):**
```
DATABASE_URL="postgresql://tu_usuario:tu_password@localhost:5432/sistema_deportes"
```

**B) Docker (recomendado si no tienes PostgreSQL):**
```bash
# Instala y corre PostgreSQL con Docker:
docker run --name postgres-deportes \
  -e POSTGRES_PASSWORD=dev123 \
  -e POSTGRES_DB=sistema_deportes \
  -p 5432:5432 \
  -d postgres

# En .env usa:
DATABASE_URL="postgresql://postgres:dev123@localhost:5432/sistema_deportes"
```

**C) Vercel Postgres (gratis, más fácil):**
1. Ve a: https://vercel.com/dashboard
2. Crea nuevo proyecto o usa uno existente
3. Storage → Create Database → Postgres
4. Copia el `DATABASE_URL` que te da Vercel
5. Pégalo en tu `.env`

---

### Paso 2: Generar cliente de Prisma

```bash
npx prisma generate
```

---

### Paso 3: Crear la base de datos

```bash
npx prisma migrate dev --name init
```

Esto creará todas las tablas: products, product_variants, users, suppliers, purchases, sales.

---

### Paso 4: Verificar

```bash
npx prisma studio
```

Se abre un navegador con una interfaz para ver tu base de datos vacía.

---

## ✅ US-001 COMPLETA

Una vez que veas las tablas creadas en Prisma Studio, la historia US-001 está completa.

---

## 📝 Siguiente Historia: US-019 (Importación Excel)

Esta es la MÁS IMPORTANTE porque te permitirá traer tus 193 productos.

Cuando termines US-001, avísame y seguimos con US-019.

---

## 💡 Cómo usar GitHub Copilot

1. **Abre VS Code** en este proyecto
2. **Abre GitHub Copilot Chat** (Cmd+Shift+I o botón de chat)
3. **Pregúntale a Copilot:**

```
Necesito implementar US-019 del PRD.
Lee scripts/ralph/prd.json y dame el código para:
1. Una API route que reciba un archivo .xlsx
2. Parsear la hoja "STOCK INICIAL"
3. Importar productos agrupando por nombre+marca
4. Crear variantes por cada fila
```

4. Copilot te dará el código completo
5. Copia y pega donde te indique
6. Prueba y ajusta si es necesario

---

## 🤖 FASE 2: Ralph Automático (DESPUÉS)

Cuando tengas presupuesto para Anthropic:

```bash
cd scripts/ralph
./ralph.sh 14  # Completa las 14 historias restantes
```

---

## 📞 ¿Necesitas ayuda?

Avísame cuando:
- ✅ Termines US-001 (base de datos funcionando)
- ✅ Estés lista para US-019 (importación Excel)
- ✅ Tengas algún error

¡Éxito! 🚀
