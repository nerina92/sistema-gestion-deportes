import { NextResponse } from 'next/server';
import { platformDb } from '@/lib/platform-db';

// Healthcheck para Railway: verifica que la app responde y llega a la base.
export async function GET() {
  try {
    await platformDb.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok' });
  } catch {
    return NextResponse.json({ status: 'db_unreachable' }, { status: 503 });
  }
}
