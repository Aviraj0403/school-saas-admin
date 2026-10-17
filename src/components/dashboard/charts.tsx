'use client';

import React, { useId } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const AXIS = { fontSize: 12, fill: 'var(--muted-foreground)' };

function ChartTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; color?: string }>;
  label?: string;
  format: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-pop">
      {label && <p className="text-[11px] font-medium text-zinc-500">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-display text-sm font-semibold text-zinc-900 dark:text-white">
          {format(Number(p.value))}
        </p>
      ))}
    </div>
  );
}

/** Smooth gradient area chart, e.g. monthly fee collection. */
export function AreaTrend({
  data,
  xKey,
  yKey,
  format = (v) => String(v),
  height = 260,
}: {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  format?: (v: number) => string;
  height?: number;
}) {
  const id = useId().replace(/:/g, '');
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 6, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`stroke-${id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--brand)" />
              <stop offset="100%" stopColor="var(--brand-2)" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 6" />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={AXIS} dy={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS}
            width={56}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip
            cursor={{ stroke: 'var(--brand)', strokeOpacity: 0.25, strokeWidth: 24 }}
            content={<ChartTooltip format={format} />}
          />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={`url(#stroke-${id})`}
            strokeWidth={3}
            fill={`url(#fill-${id})`}
            activeDot={{ r: 6, strokeWidth: 3, stroke: 'var(--card)', fill: 'var(--brand)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Rounded vertical bars coloured by value, e.g. attendance % per day. */
export function BarTrend({
  data,
  xKey,
  yKey,
  format = (v) => String(v),
  colorFor,
  height = 220,
  domainMax,
}: {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  format?: (v: number) => string;
  colorFor?: (v: number) => string;
  height?: number;
  domainMax?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          barCategoryGap="28%"
        >
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 6" />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={AXIS} dy={8} />
          <YAxis tickLine={false} axisLine={false} tick={AXIS} domain={[0, domainMax ?? 'auto']} />
          <Tooltip
            cursor={{ fill: 'var(--brand-muted)', radius: 12 }}
            content={<ChartTooltip format={format} />}
          />
          <Bar dataKey={yKey} radius={[10, 10, 10, 10]} maxBarSize={38}>
            {data.map((d, i) => (
              <Cell key={i} fill={colorFor ? colorFor(Number(d[yKey])) : 'var(--brand)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut with a centred headline value. */
export function Donut({
  data,
  center,
  caption,
  size = 200,
}: {
  data: Array<{ name: string; value: number; color: string }>;
  center: React.ReactNode;
  caption?: string;
  size?: number;
}) {
  const hasData = data.some((d) => d.value > 0);
  const series = hasData ? data : [{ name: 'empty', value: 1, color: 'var(--muted)' }];
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={series}
            dataKey="value"
            nameKey="name"
            innerRadius="72%"
            outerRadius="100%"
            paddingAngle={hasData && data.filter((d) => d.value > 0).length > 1 ? 3 : 0}
            cornerRadius={10}
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {series.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display tabular text-2xl font-semibold text-zinc-900 dark:text-white">
          {center}
        </span>
        {caption && <span className="mt-0.5 text-xs text-zinc-500">{caption}</span>}
      </div>
    </div>
  );
}

/** Single-value radial gauge (0–100). Light variant is for use on the hero gradient. */
export function RadialGauge({
  value,
  label,
  sublabel,
  size = 168,
  light = false,
}: {
  value: number;
  label?: React.ReactNode;
  sublabel?: string;
  size?: number;
  light?: boolean;
}) {
  const v = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="78%"
          outerRadius="100%"
          data={[{ v }]}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="v"
            cornerRadius={20}
            background={{ fill: light ? 'rgba(255,255,255,0.18)' : 'var(--muted)' }}
            fill={light ? '#ffffff' : 'var(--brand)'}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className={`font-display tabular text-3xl font-semibold ${light ? 'text-white' : 'text-zinc-900 dark:text-white'}`}
        >
          {label ?? `${Math.round(v)}%`}
        </span>
        {sublabel && (
          <span className={`mt-0.5 text-xs ${light ? 'text-white/75' : 'text-zinc-500'}`}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
