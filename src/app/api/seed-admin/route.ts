import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

// Endpoint temporal para crear el usuario admin en producción
// ELIMINAR DESPUÉS DE USAR
export async function GET() {
  try {
    // Verificar si ya existe el usuario admin
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@deporteslaboulaye.com' },
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Usuario admin ya existe',
        user: {
          email: existingUser.email,
          name: existingUser.name,
        },
      });
    }

    // Crear usuario admin
    const hashedPassword = await hashPassword('Admin123!');
    const user = await prisma.user.create({
      data: {
        email: 'admin@deporteslaboulaye.com',
        passwordHash: hashedPassword,
        name: 'Administrador',
        role: 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario admin creado exitosamente',
      user: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Error creando usuario admin:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear usuario admin',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
