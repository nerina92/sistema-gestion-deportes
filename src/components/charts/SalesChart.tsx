'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney, formatMoneyCompact } from '@/lib/format';

interface Point {
  date: string;
  revenue: number;
  count: number;
}

function shortDate(iso: string) {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const weekday = new Date(`${p.date}T12:00:00-03:00`).toLocaleDateString('es-AR', { weekday: 'long' });
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-pop">
      <p className="font-medium capitalize text-zinc-500">
        {weekday} {shortDate(p.date)}
      </p>
      <p className="mt-1 text-sm font-semibold text-zinc-900 tabular">{formatMoney(p.revenue)}</p>
      <p className="text-zinc-500">
        {p.count} {p.count === 1 ? 'venta' : 'ventas'}
      </p>
    </div>
  );
}

/** Ventas por día: una sola serie, columnas en el color de marca. */
export default function SalesChart({ data, height = 288 }: { data: Point[]; height?: number }) {
  const tickEvery = Math.max(1, Math.ceil(data.length / 10));
  return (
    <div className="w-full" style={{ height }} role="img" aria-label="Gráfico de ventas por día">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={data.length > 45 ? 1 : '20%'}>
          <CartesianGrid vertical={false} stroke="#f0f0f2" />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            interval={tickEvery - 1}
            tick={{ fontSize: 11, fill: '#71717a' }}
            axisLine={{ stroke: '#e4e4e7' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatMoneyCompact(v)}
            tick={{ fontSize: 11, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(139 92 246 / 0.08)' }} />
          <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={28} activeBar={{ fill: '#6d28d9' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
