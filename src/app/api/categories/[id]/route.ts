import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/categories/:id — renombrar
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name } = await request.json();
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    const trimmed = name.trim();
    const dup = await prisma.category.findFirst({ where: { name: trimmed, NOT: { id } } });
    if (dup) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 409 });
    }
    const category = await prisma.category.update({ where: { id }, data: { name: trimmed } });
    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error('Error PUT category:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/categories/:id — bloquea si tiene productos
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `No se puede borrar: la categoría tiene ${count} producto(s) asignado(s).` },
        { status: 409 }
      );
    }
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error DELETE category:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
