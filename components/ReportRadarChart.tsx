import React from 'react';
import { SvgRadarChart } from './SvgRadarChart';

interface ReportRadarChartProps {
  data: Array<{
    subject: string;
    A: number;
    fullMark: number;
  }>;
}

export const ReportRadarChart: React.FC<ReportRadarChartProps> = ({ data }) => (
  <SvgRadarChart
    labels={data.map((item) => item.subject)}
    maxValue={100}
    levels={4}
    height={200}
    labelColor="#666"
    labelSize={2.9}
    series={[
      {
        id: 'report-radar',
        values: data.map((item) => item.A),
        stroke: 'var(--skin-accent-color)',
        fill: 'var(--skin-accent-color)',
        fillOpacity: 0.4,
        strokeWidth: 1.2,
      },
    ]}
  />
);
