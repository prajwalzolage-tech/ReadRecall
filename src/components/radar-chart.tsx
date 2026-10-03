// src/components/radar-chart.tsx
// Responsive Radar Chart showing student's dimension profile

'use client';

import React from 'react';
import {
  ResponsiveContainer,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import type { DimensionScores } from '@/types';

interface RadarChartProps {
  scores: DimensionScores;
  className?: string;
}

export function RadarChart({ scores, className = '' }: RadarChartProps) {
  const data = [
    { subject: 'Coverage', score: Math.round(scores.coverage * 100), fullMark: 100 },
    { subject: 'Main Idea', score: Math.round(scores.mainIdea * 100), fullMark: 100 },
    { subject: 'Faithfulness', score: Math.round(scores.faithfulness * 100), fullMark: 100 },
    { subject: 'Clarity', score: Math.round(scores.clarity * 100), fullMark: 100 },
    { subject: 'Purpose', score: Math.round(scores.appliedPurpose * 100), fullMark: 100 },
  ];

  return (
    <div className={`w-full h-64 sm:h-72 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            stroke="#e2e8f0"
          />
          <Radar
            name="Comprehension"
            dataKey="score"
            stroke="#0f172a"
            strokeWidth={1.5}
            fill="#4f46e5"
            fillOpacity={0.18}
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
            formatter={(value: any) => [`${value}%`, 'Score']}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
