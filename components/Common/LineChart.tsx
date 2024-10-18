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
  labelFormatter?: (label: string) => string;
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
  labelFormatter,
}) => {
  
  const transformedData = data.map(item => ({
    ...item,
    [yDataKey]: Math.abs(item[yDataKey]),
    originalValue: item[yDataKey] // Keep the original value for color coding and tooltip
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsLineChart data={transformedData}>
        <XAxis 
          dataKey={xDataKey} 
          tickFormatter={formatXAxis}
        />
        <YAxis 
          tickFormatter={formatYAxis}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: color, strokeWidth: 2 }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey={yDataKey} 
          stroke={color} 
          dot={{ fill: color, strokeWidth: 2 }}
          activeDot={{ r: 8 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;
