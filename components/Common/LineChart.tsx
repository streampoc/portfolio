import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import CustomTooltip from './CustomTooltip';

interface LineChartProps {
  data: any[];
  xDataKey: string;
  yDataKey: string;
  color: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  formatXAxis?: (value: any) => string;
  formatYAxis?: (value: any) => string;
  formatTooltip?: (value: any, name: string, props: any) => [string, string];
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  xDataKey,
  yDataKey,
  color,
  xAxisLabel,
  yAxisLabel,
  formatXAxis,
  formatYAxis,
  formatTooltip,
}) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsLineChart data={data}>
        <XAxis 
          dataKey={xDataKey} 
          tickFormatter={formatXAxis}
        />
        <YAxis 
          tickFormatter={formatYAxis}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line type="monotone" dataKey={yDataKey} stroke={color} />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;
