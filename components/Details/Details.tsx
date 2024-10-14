'use client';

import React, { useEffect, useState } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { DataTable } from '../Common/DataTable';
import { ColumnDef } from "@tanstack/react-table";

interface DetailRow {
  underlying_symbol: string;
  realized: number;
  unrealized: number;
  commissions: number;
  fees: number;
  net: number;
}

const Details: React.FC = () => {
  const { appliedFilters } = useFilters();
  const [detailsData, setDetailsData] = useState<DetailRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetailsData = async () => {
      setIsLoading(true);
      try {
        const filterParams = Object.entries(appliedFilters).reduce((acc, [key, value]) => {
          acc[key] = value.toString();
          return acc;
        }, {} as Record<string, string>);
  
        const queryParams = new URLSearchParams(filterParams);
        const response = await fetch('/api/getDetailsData?' + queryParams);
        if (!response.ok) {
          throw new Error('Failed to fetch details data');
        }
        const data = await response.json();
        // Ensure all numeric fields are properly parsed
        const parsedData = data.map((row: any) => ({
          ...row,
          realized: parseFloat(row.realized),
          unrealized: parseFloat(row.unrealized),
          commissions: parseFloat(row.commissions),
          fees: parseFloat(row.fees),
          net: parseFloat(row.net),
        }));
        setDetailsData(parsedData);
      } catch (error) {
        console.error('Error fetching details data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetailsData();
  }, [appliedFilters]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const columns: ColumnDef<DetailRow>[] = [
    {
      accessorKey: "underlying_symbol",
      header: "Symbol",
      footer: "Total"
    },
    {
      accessorKey: "realized",
      header: "Realized",
      cell: ({ row }) => formatCurrency(row.getValue("realized") as number),
      footer: ({ table }) => {
        const total = table.getFilteredRowModel().rows.reduce((sum, row) => sum + (row.getValue("realized") as number), 0);
        return formatCurrency(total);
      }
    },
    {
      accessorKey: "unrealized",
      header: "Unrealized",
      cell: ({ row }) => formatCurrency(row.getValue("unrealized") as number),
      footer: ({ table }) => {
        const total = table.getFilteredRowModel().rows.reduce((sum, row) => sum + (row.getValue("unrealized") as number), 0);
        return formatCurrency(total);
      }
    },
    {
      accessorKey: "commissions",
      header: "Commissions",
      cell: ({ row }) => formatCurrency(row.getValue("commissions") as number),
      footer: ({ table }) => {
        const total = table.getFilteredRowModel().rows.reduce((sum, row) => sum + (row.getValue("commissions") as number), 0);
        return formatCurrency(total);
      }
    },
    {
      accessorKey: "fees",
      header: "Fees",
      cell: ({ row }) => formatCurrency(row.getValue("fees") as number),
      footer: ({ table }) => {
        const total = table.getFilteredRowModel().rows.reduce((sum, row) => sum + (row.getValue("fees") as number), 0);
        return formatCurrency(total);
      }
    },
    {
      accessorKey: "net",
      header: "Net",
      cell: ({ row }) => formatCurrency(row.getValue("net") as number),
      footer: ({ table }) => {
        const total = table.getFilteredRowModel().rows.reduce((sum, row) => sum + (row.getValue("net") as number), 0);
        return formatCurrency(total);
      }
    },
  ];

  if (isLoading) {
    return <div>Loading details data...</div>;
  }

  return (
    <div>
      <DataTable 
        columns={columns} 
        data={detailsData}
        showFooter={true}
        showPagination={false}
      />
    </div>
  );
};

export default Details;
