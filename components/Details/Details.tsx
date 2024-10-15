'use client';

import React, { useEffect, useState } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { DataTable } from '../Common/DataTable';
import { ColumnDef } from "@tanstack/react-table";
import LoadingSpinner from '../Common/LoadingSpinner';

interface DetailRow {
  year: number;
  underlying_symbol: string;
  realized: number;
  unrealized: number;
  commissions: number;
  fees: number;
  net: number;
}

interface DetailsProps {
    onContentLoaded: () => void;
}

const Details: React.FC<DetailsProps> = ({ onContentLoaded }) => {
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
        // Ensure all numeric fields are properly parsed and group by year
        const parsedData = data.reduce((acc: DetailRow[], row: any) => {
          const year = parseInt(row.year);
          const existingRow = acc.find(r => r.underlying_symbol === row.underlying_symbol);
          if (existingRow) {
            existingRow.realized += parseFloat(row.realized);
            existingRow.unrealized += parseFloat(row.unrealized);
            existingRow.commissions += parseFloat(row.commissions);
            existingRow.fees += parseFloat(row.fees);
            existingRow.net += parseFloat(row.net);
          } else {
            acc.push({
              year,
              underlying_symbol: row.underlying_symbol,
              realized: parseFloat(row.realized),
              unrealized: parseFloat(row.unrealized),
              commissions: parseFloat(row.commissions),
              fees: parseFloat(row.fees),
              net: parseFloat(row.net),
            });
          }
          return acc;
        }, []);
        
        // Sort the data by symbol before setting it to state
        const sortedData = parsedData.sort((a:any, b:any) => 
          a.underlying_symbol.localeCompare(b.underlying_symbol)
        );
        
        setDetailsData(sortedData);
      } catch (error) {
        console.error('Error fetching details data:', error);
      } finally {
        setIsLoading(false);
        onContentLoaded();
      }
    };

    fetchDetailsData();
  }, [appliedFilters]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatColoredCurrency = (value: number): JSX.Element => {
    const formattedValue = formatCurrency(value);
    const colorClass = value >= 0 ? 'text-green-600' : 'text-red-600';
    return <span className={colorClass}>{formattedValue}</span>;
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
      cell: ({ row }) => formatColoredCurrency(row.getValue("realized") as number),
      footer: ({ table }) => {
        const total = table.getFilteredRowModel().rows.reduce((sum, row) => sum + (row.getValue("realized") as number), 0);
        return formatColoredCurrency(total);
      }
    },
    {
      accessorKey: "unrealized",
      header: "Unrealized",
      cell: ({ row }) => formatColoredCurrency(row.getValue("unrealized") as number),
      footer: ({ table }) => {
        const total = table.getFilteredRowModel().rows.reduce((sum, row) => sum + (row.getValue("unrealized") as number), 0);
        return formatColoredCurrency(total);
      }
    },
    {
      accessorKey: "commissions",
      header: "Commissions",
      cell: ({ row }) => formatColoredCurrency(row.getValue("commissions") as number),
      footer: ({ table }) => {
        const total = table.getFilteredRowModel().rows.reduce((sum, row) => sum + (row.getValue("commissions") as number), 0);
        return formatColoredCurrency(total);
      }
    },
    {
      accessorKey: "fees",
      header: "Fees",
      cell: ({ row }) => formatColoredCurrency(row.getValue("fees") as number),
      footer: ({ table }) => {
        const total = table.getFilteredRowModel().rows.reduce((sum, row) => sum + (row.getValue("fees") as number), 0);
        return formatColoredCurrency(total);
      }
    },
    {
      accessorKey: "net",
      header: "Realized Net",
      cell: ({ row }) => formatColoredCurrency(row.getValue("net") as number),
      footer: ({ table }) => {
        const total = table.getFilteredRowModel().rows.reduce((sum, row) => sum + (row.getValue("net") as number), 0);
        return formatColoredCurrency(total);
      }
    },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <DataTable 
        columns={columns} 
        data={detailsData}
        showFooter={true}
        showPagination={false}
        showNoResultsMessage={!isLoading && detailsData.length === 0}
      />
    </div>
  );
};

export default Details;
