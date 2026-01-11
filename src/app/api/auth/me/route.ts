import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken, getUserById } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Obtener token de las cookies
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { 
          authenticated: false, 
          error: 'No token provided' 
        },
        { status: 401 }
      );
    }

    // Verificar token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { 
          authenticated: false, 
          error: 'Invalid token' 
        },
        { status: 401 }
      );
    }

    // Obtener información actualizada del usuario
    const user = await getUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { 
          authenticated: false, 
          error: 'User not found' 
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json(
      { 
        authenticated: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}