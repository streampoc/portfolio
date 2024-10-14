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
  formatTooltip?: (value: any, name: string | number, props: any) => [string, string];
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
      <RechartsLineChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 50,
          bottom: 30,
        }}
      >
        <XAxis 
          dataKey={xDataKey} 
          tickFormatter={formatXAxis}
          axisLine={{ stroke: '#E0E0E0' }}
          tick={{ fill: '#666', fontSize: 12 }}
          label={{ value: xAxisLabel, position: 'insideBottom', offset: -10, fill: '#666' }}
        />
        <YAxis 
          tickFormatter={formatYAxis}
          axisLine={{ stroke: '#E0E0E0' }}
          tick={{ fill: '#666', fontSize: 12 }}
          label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', offset: -40, fill: '#666' }}
        />
        <Tooltip 
          content={<CustomTooltip />}
          formatter={(value, name, props) => {
            if (formatTooltip) {
              return formatTooltip(value, name.toString(), props);
            }
            return [value, name.toString()];
          }}
        />
        <Legend verticalAlign="top" height={36}/>
        <Line
          type="monotone"
          dataKey={yDataKey}
          stroke={color}
          activeDot={{ r: 8 }}
          dot={{ r: 4 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;
