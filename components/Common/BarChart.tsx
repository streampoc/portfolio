import React from 'react';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BarChartProps {
  data: any[];
  xDataKey: string;
  yDataKey: string;
  layout: 'vertical' | 'horizontal';
  isLargeScreen: boolean;
  formatXAxis?: (value: any) => string;
  formatYAxis?: (value: any) => string;
  formatTooltip?: (value: any, name: string, props: any) => [string, string];
  labelFormatter?: (label: string) => string;
  barSize?: number;
  colors: {
    positive: string;
    negative: string;
  };
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  xDataKey,
  yDataKey,
  layout,
  isLargeScreen,
  formatXAxis,
  formatYAxis,
  formatTooltip,
  labelFormatter,
  barSize = 20,
  colors
}) => {
  const margin = isLargeScreen 
    ? { top: 10, right: 30, left: 40, bottom: 5 }
    : { top: 5, right: 5, left: 10, bottom: 5 };

  const calculateDomain = (dataKey: string) => {
    const values = data.map(item => item[dataKey]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const absMax = Math.max(Math.abs(minValue), Math.abs(maxValue));
    const padding = absMax * 0.1; // Add 10% padding
    return [-absMax - padding, absMax + padding];
  };

  const chartHeight = isLargeScreen ? 400 : Math.max(400, data.length * 25);
  const calculatedBarSize = isLargeScreen ? barSize : Math.min(15, 300 / data.length);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={margin}
        barGap={1}
        barCategoryGap={isLargeScreen ? "10%" : "5%"}
      >
        {layout === 'horizontal' ? (
          <>
            <XAxis
              dataKey={xDataKey}
              type="category"
              tickFormatter={formatXAxis}
              interval={0}
              tick={{ fontSize: 12 }}
              height={60}
              tickSize={8}
              angle={-90}
              textAnchor="end"
            />
            <YAxis
              type="number"
              tickFormatter={formatYAxis}
              domain={calculateDomain(yDataKey)}
              padding={{ top: 10, bottom: 10 }}
            />
          </>
        ) : (
          <>
            <XAxis
              type="number"
              tickFormatter={formatYAxis}
              domain={calculateDomain(yDataKey)}
              padding={{ left: 5, right: 5 }}
            />
            <YAxis
              dataKey={xDataKey}
              type="category"
              width={60}
              tickFormatter={formatXAxis}
              interval={0}
              tick={{ fontSize: 10 }}
            />
          </>
        )}
        <Tooltip
          formatter={formatTooltip}
          labelFormatter={labelFormatter}
        />
        <Bar 
          dataKey={yDataKey} 
          name="Value" 
          barSize={calculatedBarSize}
          minPointSize={2}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry[yDataKey] >= 0 ? colors.positive : colors.negative}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;
