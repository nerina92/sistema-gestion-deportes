import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Crear respuesta de logout exitoso
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logout exitoso',
      },
      { status: 200 }
    );

    // Eliminar la cookie del token configurando maxAge = 0
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Esto elimina la cookie
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Opcional: GET para información del endpoint
export async function GET() {
  return NextResponse.json(
    { message: 'Endpoint de logout - usa POST para cerrar sesión' },
    { status: 200 }
  );
}