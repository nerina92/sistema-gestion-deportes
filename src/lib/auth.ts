import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tipos para el usuario
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || 'desarrollo-secreto-clave-2025';
const JWT_EXPIRES_IN = '7d';

/**
 * Genera un hash de la contraseña usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compara una contraseña en texto plano con su hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Genera un token JWT para un usuario
 */
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verifica y decodifica un token JWT
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Error verifying JWT token:', error);
    return null;
  }
}

/**
 * Obtiene un usuario por email desde la base de datos
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: false, // No retornamos el hash por seguridad
      },
    });
    
    return user;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

/**
 * Obtiene un usuario por email incluyendo el hash de la contraseña (para login)
 */
export async function getUserWithPasswordByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
      },
    });
    
    return user;
  } catch (error) {
    console.error('Error fetching user with password by email:', error);
    return null;
  }
}

/**
 * Obtiene un usuario por ID desde la base de datos
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: false, // No retornamos el hash por seguridad
      },
    });
    
    return user;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

/**
 * Extrae el token JWT desde las cookies de la request
 */
export function getTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'auth-token') {
      return value;
    }
  }
  
  return null;
}

/**
 * Valida las credenciales de login
 */
export async function validateLoginCredentials(email: string, password: string): Promise<User | null> {
  try {
    const user = await getUserWithPasswordByEmail(email);
    if (!user) return null;

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) return null;

    // Retornamos el usuario sin el hash de la contraseña
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error validating login credentials:', error);
    return null;
  }
}