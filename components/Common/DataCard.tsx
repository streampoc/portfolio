import React from 'react';
import { Card, CardContent } from "@/components/ui/card"

interface DataCardProps {
  title: string;
  value: string;
  amount: number|undefined;
  className?: string;
}

const DataCard: React.FC<DataCardProps> = ({ title, value, amount, className }) => {
  const textColorClass = amount !== undefined && amount >= 0 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400';

  return (
    <Card className={`${className} p-4 transition-all duration-200`}>
      <CardContent className="p-0">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{title}</div>
        <div className={`text-lg font-bold ${textColorClass}`}>
          {value.startsWith('$') || value.startsWith('-$') ? value : `$${value}`}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataCard;
