import React from 'react';
import { Card, CardContent } from "@/components/ui/card"

interface DataCardProps {
  title: string;
  value: string;
  amount: number;
  className?: string;
}

const DataCard: React.FC<DataCardProps> = ({ title, value, amount, className }) => {
  const textColorClass = amount >= 0 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400';

  return (
    <Card className={`${className} p-2`}>
      <CardContent className="p-0">
        <div className="text-xs font-medium text-foreground mb-1">{title}</div>
        <div className={`text-sm font-bold ${textColorClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
};

export default DataCard;
