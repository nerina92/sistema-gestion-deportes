import { NextRequest, NextResponse } from 'next/server';
import { validateLoginCredentials, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validar que los campos estén presentes
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validar credenciales
    const user = await validateLoginCredentials(email, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    // Generar token JWT
    const token = generateToken(user);

    // Crear respuesta con token en cookie httpOnly
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login exitoso',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Configurar cookie httpOnly con el token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días en segundos
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Opcional: GET para verificar estado de autenticación
export async function GET() {
  return NextResponse.json(
    { message: 'Endpoint de login - usa POST para autenticar' },
    { status: 200 }
  );
}