import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    // Construir condiciones de filtro
    const where: any = {};
    
    // Filtrar por estado activo si se especifica
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: {
        name: 'asc'
      },
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

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, notes } = body;

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

    // Verificar si ya existe un proveedor con el mismo nombre
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Ya existe un proveedor con ese nombre' },
        { status: 400 }
      );
    }

    // Crear el proveedor
    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        isActive: true
      }
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}