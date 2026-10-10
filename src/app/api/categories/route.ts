import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api-auth';


// GET /api/categories — lista con conteo de productos
export async function GET() {
  const ctx = await requireTenant('productos');
  if (ctx instanceof NextResponse) return ctx;
  const prisma = ctx.db;

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json({
      success: true,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        productCount: c._count.products,
      })),
    });
  } catch (error: any) {
    console.error('Error GET categories:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/categories — crear
export async function POST(request: NextRequest) {
  const ctx = await requireTenant('categorias');
  if (ctx instanceof NextResponse) return ctx;
  const prisma = ctx.db;

  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    const trimmed = name.trim();
    const existing = await prisma.category.findUnique({ where: { name: trimmed } });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 409 });
    }
    const category = await prisma.category.create({ data: { name: trimmed } });
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    console.error('Error POST category:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
