import React from 'react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip bg-gray-800 text-white p-2 rounded shadow-lg">
        <p className="label font-bold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="value">
            {`${entry.name}: ${formatValue(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const formatValue = (value: any): string => {
  if (typeof value === 'number') {
    return value.toFixed(2);
  } else if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toFixed(2);
  } else {
    return String(value);
  }
};

export default CustomTooltip;
