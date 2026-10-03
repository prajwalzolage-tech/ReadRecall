// src/components/trend-chart.tsx
// Responsive trend chart showing 1-10 rating improvement over time

'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface TrendPoint {
  date: string;
  rating: number;
  label?: string;
}

interface TrendChartProps {
  data: TrendPoint[];
  className?: string;
}

export function TrendChart({ data, className = '' }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        No attempt history yet to display trend.
      </div>
    );
  }

  const chartData = data.map((d, i) => ({
    name: d.label || `#${i + 1}`,
    rating: d.rating,
    fullDate: new Date(d.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <div className={`w-full h-64 sm:h-72 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#cbd5e1"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            domain={[1, 10]}
            ticks={[1, 2, 4, 6, 8, 10]}
            stroke="#cbd5e1"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              borderRadius: '0.75rem',
              color: '#0f172a',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
            formatter={(value: any) => [`${value} / 10`, 'Rating']}
            labelFormatter={(_, payload) => {
              if (payload && payload[0]) {
                return `${payload[0].payload.name} (${payload[0].payload.fullDate})`;
              }
              return '';
            }}
          />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="#0f172a"
            strokeWidth={2}
            dot={{ fill: '#ffffff', stroke: '#0f172a', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
