import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api-auth';
import { buildSalesReport } from '@/lib/reports';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 366;

// GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const ctx = await requireTenant('reportes');
  if (ctx instanceof NextResponse) return ctx;

  const from = request.nextUrl.searchParams.get('from') ?? '';
  const to = request.nextUrl.searchParams.get('to') ?? '';
  if (!DATE_RE.test(from) || !DATE_RE.test(to) || from > to) {
    return NextResponse.json({ success: false, error: 'Rango de fechas inválido' }, { status: 400 });
  }
  const days = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1;
  if (days > MAX_DAYS) {
    return NextResponse.json({ success: false, error: 'El rango máximo es de un año' }, { status: 400 });
  }

  try {
    const report = await buildSalesReport(ctx.db, { from, to });
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Error generando reporte:', error);
    return NextResponse.json({ success: false, error: 'No se pudo generar el reporte' }, { status: 500 });
  }
}
