import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DataCardProps {
  title: string;
  value: string;
  amount: number;
  className?: string;
}

const DataCard: React.FC<DataCardProps> = ({ title, value, amount, className }) => {
  const textColorClass = amount >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${textColorClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
};

export default DataCard;
