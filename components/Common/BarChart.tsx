import React from 'react';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import CustomTooltip from './CustomTooltip';

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
    ? { top: 10, right: 10, left: 30, bottom: 5 }
    : { top: 5, right: 2, left: 5, bottom: 5 };

  // Transform data to use absolute values for scaling
  const transformedData = data.map(item => ({
    ...item,
    [yDataKey]: Math.abs(item[yDataKey]),
    originalValue: item[yDataKey] // Keep the original value for color coding and tooltip
  }));

  const calculateDomain = (dataKey: string) => {
    const values = transformedData.map(item => item[dataKey]);
    const maxValue = Math.max(...values);
    const padding = maxValue * 0.1; // Reduce padding to 10%
    return [0, Math.ceil(maxValue + padding)]; // Round up to the nearest integer
  };

  const chartHeight = isLargeScreen ? 400 : Math.max(400, data.length * 20);
  const calculatedBarSize = Math.min(barSize, (isLargeScreen ? 400 : chartHeight) / data.length / 2);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <RechartsBarChart
        data={transformedData}
        layout={layout}
        margin={margin}
        //barCategoryGap={`${calculatedBarSize}%`}
        barCategoryGap={0.5}
        barGap={2}
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
              tickFormatter={(value) => formatYAxis ? formatYAxis(value) : value.toString()}
              domain={calculateDomain(yDataKey)}
              padding={{ top: 10, bottom: 10 }}
            />
          </>
        ) : (
          <>
            <XAxis
              type="number"
              tickFormatter={(value) => formatYAxis ? formatYAxis(value) : value.toString()}
              domain={calculateDomain(yDataKey)}
              padding={{ left: 5, right: 5 }}
            />
            <YAxis
              dataKey={xDataKey}
              type="category"
              width={30}
              tickFormatter={formatXAxis}
              interval={0}
              tick={{ fontSize: 10 }}
            />
          </>
        )}
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'transparent' }}
        />
        <Bar 
          dataKey={yDataKey} 
          name="Value" 
          //barSize={calculatedBarSize}
          minPointSize={2}
        >
          {transformedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.originalValue >= 0 ? colors.positive : colors.negative}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;
