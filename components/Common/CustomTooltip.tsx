import React from 'react';

const CustomTooltip = ({ active, payload, label, labelFormatter, formatTooltip }: any) => {
  if (active && payload && payload.length) {
    const originalValue = payload[0].payload.originalValue;
    const netValue = payload[0].payload.net_profit;
    const formattedLabel = labelFormatter ? labelFormatter(label) : label;
    let valueLabel,netLabel, name,netName;

    if (formatTooltip && typeof originalValue !== 'undefined') {
      [valueLabel, name] = formatTooltip(originalValue, payload[0].name, payload[0].payload);
    } else {
      valueLabel = originalValue?.toString() || 'N/A';
      netLabel = netValue?.toString() || 'N/A';
      name = payload[0].name || 'Value';
      netName = 'Net';
    }

    return (
      <div className="custom-tooltip bg-background p-2 border border-border rounded shadow-md">
        <p className="label">{formattedLabel}</p>
        <p className="value">{`${name}: ${valueLabel}`}</p>
        <p className="value">{`${netName}: ${netLabel}`}</p>
      </div>
    );
  }

  return null;
};

export default CustomTooltip;
