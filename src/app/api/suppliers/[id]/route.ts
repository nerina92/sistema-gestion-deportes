import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        notes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, address, notes, isActive } = body;

    // Verificar que el proveedor existe
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Validaciones
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre es requerido y debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }

    // Validar email si se proporciona
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'El formato del email no es válido' },
          { status: 400 }
        );
      }
    }

    // Verificar si ya existe otro proveedor con el mismo nombre
    const duplicateSupplier = await prisma.supplier.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        },
        id: {
          not: id
        }
      }
    });

    if (duplicateSupplier) {
      return NextResponse.json(
        { error: 'Ya existe otro proveedor con ese nombre' },
        { status: 400 }
      );
    }

    // Actualizar el proveedor
    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        isActive: isActive !== undefined ? isActive : existingSupplier.isActive
      }
    });

    return NextResponse.json(updatedSupplier);
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar que el proveedor existe
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          where: {
            status: {
              in: ['pending', 'completed']
            }
          }
        }
      }
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si tiene compras pendientes
    if (existingSupplier.purchases.length > 0) {
      return NextResponse.json(
        { error: 'No se puede desactivar el proveedor porque tiene compras asociadas' },
        { status: 400 }
      );
    }

    // Desactivar el proveedor (soft delete)
    const deactivatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    return NextResponse.json({
      message: 'Proveedor desactivado correctamente',
      supplier: deactivatedSupplier
    });
  } catch (error) {
    console.error('Error al desactivar proveedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}