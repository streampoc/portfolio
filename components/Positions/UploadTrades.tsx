'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import MoneyMovementsSummary from '../MoneyMovements/MoneyMovementsSummary';
import { useUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { set } from 'zod';

type Trade = Record<string, string>;
type MatchedTrade = {
  open_date: string;
  close_date: string;
  symbol: string;
  underlying_symbol: string;
  quantity: number;
  open_price: number;
  close_price: number;
  profit_loss: number;
  commissions: number;
  fees: number;
  account: string;
};

// Type for summary data
type SummaryRow = {
  underlying_symbol: string;
  realized: number;
  unrealized: number;
  commissions: number;
  fees: number;
};

type MoneyMovement = {
  date: string;
  symbol: string;
  type: string;
  amount: number;
  description: string;
  account: string;
};

export default function UploadTrades() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [matched, setMatched] = useState<MatchedTrade[] | null>(null);
  const [rawRows, setRawRows] = useState<Trade[] | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [remainingOpen, setRemainingOpen] = useState<any[] | null>(null);
  const [fileCount, setFileCount] = useState<number>(0);
  const [processedFileCount, setProcessedFileCount] = useState<number>(0);
  const [allMatched, setAllMatched] = useState<MatchedTrade[]>([]);
  const [allRemainingOpen, setAllRemainingOpen] = useState<any[]>([]);
  const [matchedPreviousOpenCount, setMatchedPreviousOpenCount] = useState<number>(0);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [moneyMovements, setMoneyMovements] = useState<MoneyMovement[]>([]);
  const [brokerAccounts, setBrokerAccounts] = useState<Array<{ id: number; broker_name: string; account_number: string }>>([]);
  const [selectedBrokerAccount, setSelectedBrokerAccount] = useState<string>('');
  const [selectedBrokerText, setSelectedBrokerText] = useState<string>('');
  
  // Debug logging for money movements detail
  const logMoneyMovements = (description: string, movements: MoneyMovement[] | undefined) => {
    console.debug(`[Money Movements] ${description}:`, {
      count: movements?.length || 0,
      movements: movements?.map(m => ({
        type: m.type,
        description: m.description,
        amount: m.amount,
        isACH: (m.description || '').toUpperCase().includes('ACH'),
        date: m.date
      }))
    });
  };

  // Money movement tracking functions
  const logMoneyMovement = (description: string, movements: MoneyMovement[] | undefined) => {
    console.debug(`[Money Movements] ${description}:`, {
      count: movements?.length || 0,
      movements: movements?.map(m => ({
        type: m.type,
        description: m.description,
        amount: m.amount,
        isACH: (m.description || '').toUpperCase().includes('ACH'),
        date: m.date
      }))
    });
  };

  // Quick filter states
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [underlyingFilter, setUnderlyingFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('All Years');
  const [summaryCollapsed, setSummaryCollapsed] = useState<boolean>(false);
  const [matchedTradesPreviewCollapsed, setMatchedTradesPreviewCollapsed] = useState<boolean>(false);
  const [matchedTradesCollapsed, setMatchedTradesCollapsed] = useState<boolean>(false);
  const [openTradesCollapsed, setOpenTradesCollapsed] = useState<boolean>(false);
  
  // Calculate total amount for a specific type of money movement
  const calculateTotalByType = (movements: MoneyMovement[], type: string) => {
    if (!movements) {
      console.debug(`[Money Movements] No movements array provided for type ${type}`);
      return 0;
    }

    console.debug(`[Money Movements] Processing ${movements.length} movements for type ${type}`);

    const matchingMovements = movements.filter(m => {
      const movementType = (m.type || '').trim().toUpperCase();
      const targetType = type.trim().toUpperCase();
      const description = (m.description || '').toUpperCase();

      // Special handling for ACH/Funds
      if (targetType === 'FUNDS') {
        const isMatch = movementType === 'FUNDS' || description.includes('ACH');
        if (isMatch) {
          console.debug('[Money Movements] Found matching FUNDS/ACH movement:', {
            type: movementType,
            description,
            amount: m.amount,
            date: m.date
          });
        }
        return isMatch;
      }

      const isMatch = movementType === targetType;
      if (isMatch) {
        console.debug(`[Money Movements] Found matching ${type} movement:`, {
          type: movementType,
          description,
          amount: m.amount,
          date: m.date
        });
      }
      return isMatch;
    });

    const total = matchingMovements.reduce((total, m) => total + m.amount, 0);
    console.debug(`[Money Movements] Total for ${type}: ${total} (${matchingMovements.length} movements)`);

    return total;
  };

  // Get transaction count for a specific type of money movement
  const getTransactionCountByType = (movements: MoneyMovement[], type: string) => {
    if (!movements) return 0;
    
    const targetType = type.trim().toUpperCase();
    return movements.filter(m => {
      const movementType = (m.type || '').trim().toUpperCase();
      
      // Match the same logic as calculateTotalByType
      if (targetType === 'FUNDS') {
        return movementType === 'FUNDS' || 
               (m.description || '').toUpperCase().includes('ACH');
      }
      
      return movementType === targetType;
    }).length;
  };

  // Years array for the dropdown
  const availableYears = useMemo(() => ['All Years', ...Array.from({ length: 20 }, (_, i) => (2015 + i).toString())], []);

  // Compute filtered trades for preview using matched trades
  const filteredMatched = useMemo(() => {
    if (!matched || matched.length === 0) return [];
    
    return matched.filter(trade => {
      const symbol = (trade.symbol || '').replace(/\s+/g, '').toLowerCase();
      const filterSymbol = symbolFilter.replace(/\s+/g, '').toLowerCase();
      const underlying = (trade.underlying_symbol || '').toLowerCase();
      
      // Get the year from the close date if available
      const tradeYear = trade.close_date ? 
        new Date(trade.close_date).getFullYear().toString() : 
        new Date(trade.open_date).getFullYear().toString();
        
      return (
        (!symbolFilter || symbol.includes(filterSymbol)) &&
        (!underlyingFilter || underlying.includes(underlyingFilter.toLowerCase())) &&
        (!dateFilter || trade.open_date.toLowerCase().includes(dateFilter.toLowerCase())) &&
        (yearFilter === 'All Years' || tradeYear === yearFilter)
      );
    });
  }, [matched, symbolFilter, underlyingFilter, dateFilter, yearFilter]);

  // Compute filtered remaining open trades
  const filteredRemainingOpen = useMemo(() => {
    if (!remainingOpen || remainingOpen.length === 0) return [];
    
    return remainingOpen.filter(trade => {
      const symbol = (trade.Symbol || '').replace(/\s+/g, '').toLowerCase();
      const filterSymbol = symbolFilter.replace(/\s+/g, '').toLowerCase();
      const underlying = (trade['Underlying Symbol'] || '').toLowerCase();
      const dateStr = (trade.Date || '').toLowerCase();
      
      // Get the year from the trade date
      const tradeYear = trade.Date ? new Date(trade.Date).getFullYear().toString() : '';
        
      return (
        (!symbolFilter || symbol.includes(filterSymbol)) &&
        (!underlyingFilter || underlying.includes(underlyingFilter.toLowerCase())) &&
        (!dateFilter || dateStr.includes(dateFilter.toLowerCase())) &&
        (yearFilter === 'All Years' || tradeYear === yearFilter)
      );
    });
  }, [remainingOpen, symbolFilter, underlyingFilter, dateFilter, yearFilter]);

  // Calculate P/L summary by underlying symbol using filtered trades
  const summaryByUnderlying = useMemo(() => {
    const summary = new Map<string, SummaryRow>();
    
    // Add realized P/L from matched trades
    if (filteredMatched.length > 0) {
      // Debug log for commissions and fees
      if (filteredMatched.length > 0) {
/*         console.log('Sample trade for summary calculation:', {
          symbol: filteredMatched[0].symbol,
          profit_loss: filteredMatched[0].profit_loss,
          commissions: filteredMatched[0].commissions,
          fees: filteredMatched[0].fees,
          commissions_type: typeof filteredMatched[0].commissions,
          fees_type: typeof filteredMatched[0].fees
        }); */
      }
      
      filteredMatched.forEach(trade => {
        const underlying = trade.underlying_symbol;
        if (!summary.has(underlying)) {
          summary.set(underlying, {
            underlying_symbol: underlying,
            realized: 0,
            unrealized: 0,
            commissions: 0,
            fees: 0
          });
        }
        
        const row = summary.get(underlying)!;
        row.realized += typeof trade.profit_loss === 'number' ? trade.profit_loss : 0;
        row.commissions += typeof trade.commissions === 'number' ? trade.commissions : 0;
        row.fees += typeof trade.fees === 'number' ? trade.fees : 0;
      });
    }
    
    // Calculate estimated unrealized P/L from open trades
    if (filteredRemainingOpen) {
      filteredRemainingOpen.forEach(trade => {
        const underlying = trade['Underlying Symbol'] || '';
        if (!summary.has(underlying)) {
          summary.set(underlying, {
            underlying_symbol: underlying,
            realized: 0,
            unrealized: 0,
            commissions: 0,
            fees: 0
          });
        }
        
        // Calculate unrealized P/L
        const row = summary.get(underlying)!;
        
        // Check if this is an equity position (Symbol equals Underlying Symbol)
        const isEquity = trade.Symbol === trade['Underlying Symbol'];
        const quantity = parseFloat(trade.remainingQty || '0');
        const openPrice = parseFloat(trade['Average Price'] || '0');
        
        if (isEquity && !isNaN(quantity) && !isNaN(openPrice)) {
          // For equities, calculate as Open Price * Quantity
          row.unrealized += openPrice * quantity;
          
          // Log the calculation for debugging
          /* console.log('Equity unrealized P/L calculation:', {
            symbol: trade.Symbol,
            quantity,
            openPrice,
            calculated: openPrice * quantity
          }); */
        } else {
          // For non-equity positions, use the Value field as before
          const value = parseFloat(trade.Value || '0');
          row.unrealized += isNaN(value) ? 0 : value;
        }
      });
    }
    
    // Convert Map to array and sort by underlying symbol
    return Array.from(summary.values())
      .sort((a, b) => a.underlying_symbol.localeCompare(b.underlying_symbol));
  }, [filteredMatched, filteredRemainingOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setMessage(null);
    setFileCount(files.length);
    setProcessingProgress(0);

    // Process the selected file
    const file = files[0]; // We'll process one file at a time
    
    Papa.parse<Trade>(file, {
      header: true,
      complete: async (results) => {
        try {
          const trades = results.data as Trade[];
          // Trim all fields in each row
          const trimmedTrades = trades.map(row => {
            const trimmed: Trade = {};
            for (const k in row) {
              trimmed[k.trim()] = typeof row[k] === 'string' ? row[k].trim() : row[k];
            }
            return trimmed;
          });
          
          setRawRows(trimmedTrades);
          setProcessingProgress(33);

          const res = await fetch('/api/matchTrades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trades: trimmedTrades,
              previousOpenTrades: allRemainingOpen,
              brokerId: selectedBrokerAccount
            }),
          });
          
          setProcessingProgress(66);
          
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to match trades');
          }
          
          const data = await res.json();
          
          // Debug logging for money movements
          console.log('Money movements received:', {
            count: data.moneyMovements?.length || 0,
            movements: data.moneyMovements
          });
          
          // --- Consistent validation and sorting for money movements ---
          const validMovements = (data.moneyMovements || []).filter((m: MoneyMovement) => {
            const isValid = Boolean(m.date) && typeof m.amount === 'number' && !isNaN(m.amount);
            if (!isValid) {
              console.warn('[Money Movements] Filtering out invalid movement:', m);
            }
            return isValid;
          });
          const sortedMovements = [...validMovements].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
          });
          // --- End consistent logic ---

          // Accumulate the matched trades
          const newMatched = [...allMatched, ...(data.matched || [])];
          // Calculate how many previously open trades were matched
          // Only count matches from previously open trades if this isn't the first file
          const previousOpenTradesCount = allRemainingOpen.length;
          const newRemainingOpenCount = data.remainingOpenTrades?.length || 0;
          
          let matchedFromPrevious = 0;
          // Reset matchedPreviousOpenCount if this is the first file after a reset
          if (processedFileCount === 0) {
            setMatchedPreviousOpenCount(0);
          }
          
          if (processedFileCount > 0) { // Only calculate if this isn't the first file
            matchedFromPrevious = previousOpenTradesCount - newRemainingOpenCount + (data.matched?.length || 0) - trimmedTrades.filter(t => 
              t.Action === 'BUY_TO_CLOSE' || 
              t.Action === 'SELL_TO_CLOSE' || 
              (t.Action === 'SELL' && t.Type === 'Trade') ||
              (t.Action === 'BUY' && t.Type === 'Trade')
            ).length;
            
            // Ensure we don't get negative values
            matchedFromPrevious = Math.max(0, matchedFromPrevious);
            
            setMatchedPreviousOpenCount(prev => prev + matchedFromPrevious);
          }
          // IMPORTANT: Replace all remaining open trades with the new list
          // This ensures open trades are correctly updated with each file
          const newRemainingOpen = data.remainingOpenTrades || [];
          
          // Update both the current view and the accumulated state
          setMatched(data.matched);
          setRemainingOpen(data.remainingOpenTrades);
          setAllMatched(newMatched);
          setAllRemainingOpen(newRemainingOpen);
          setProcessedFileCount(prev => prev + 1);
          setProcessingProgress(100);
          const matchedMsg = (processedFileCount > 0 && matchedFromPrevious > 0)
            ? ` (including ${matchedFromPrevious} trades matched with previously open positions)` 
            : '';
          const openPositionsMsg = newRemainingOpen.length > 0
            ? ` Currently tracking ${newRemainingOpen.length} open positions.`
            : '';
          setMessage(`Processed ${file.name} successfully. ${data.matched?.length || 0} trades matched${matchedMsg}. Total: ${newMatched.length} trades from ${processedFileCount + 1} files.${openPositionsMsg}`);
          // --- Move updateMoneyMovements to the end ---
          updateMoneyMovements(sortedMovements);
        } catch (error) {
          setMessage('Error processing trades: ' + (error as Error).message);
          setProcessingProgress(0);
        } finally {
          setUploading(false);
        }
      },
      error: (error: Error, file: File) => {
        setMessage('Error parsing CSV: ' + error.message);
        setUploading(false);
        setProcessingProgress(0);
      }
    });
  };

  // Function to handle confirmation
  const handleConfirm = async () => {
    await handleSave();
  };
  
  const handleSave = async () => {
    if (allMatched.length === 0) return;
    
    try {
      //setUploading(true);

      // Prepare the CSV data
      const csvRows = [];
      
      // Add header row
      csvRows.push([
        "id", "transaction_type", "open_date", "close_date", "symbol", "underlying_symbol",
        "quantity", "open_price", "close_price", "buy_value", "sell_value", "profit_loss",
        "is_closed", "commissions", "fees", "open_year", "close_year", "open_month",
        "close_month", "open_week", "close_week", "account", "user_id", "creation_date", "updated_date"
      ]);

      let rowIndex = 1;
      
      // Process money movements
      moneyMovements.forEach((movement) => {
        const date = new Date(movement.date);
        const weekRange = `${movement.date.split('T')[0]} to ${new Date(date.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`;
        
        csvRows.push([
          "",//rowIndex.toString(),
          "Money",
          date.toISOString(),
          date.toISOString(),
          movement.type,
          movement.type,
          "1",
          "0",
          "0",
          "0",
          "0",
          movement.amount.toString(),
          "true",
          "0",
          "0",
          date.getFullYear().toString(),
          date.getFullYear().toString(),
          (date.getMonth() + 1).toString(),
          (date.getMonth() + 1).toString(),
          weekRange,
          weekRange,
          selectedBrokerText,
          user?.id?.toString() || '',
          new Date().toISOString(),
          new Date().toISOString()
        ]);
        rowIndex++;
      });
      
      // Process matched trades
      allMatched.forEach((trade) => {
        const openDate = new Date(trade.open_date);
        const closeDate = new Date(trade.close_date);
        const openWeekRange = `${trade.open_date.split('T')[0]} to ${new Date(openDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`;
        const closeWeekRange = `${trade.close_date.split('T')[0]} to ${new Date(closeDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`;
        
        csvRows.push([
          "",//rowIndex.toString(),
          "Trade",
          openDate.toISOString(),
          closeDate.toISOString(),
          trade.symbol,
          trade.underlying_symbol,
          trade.quantity.toString(),
          trade.open_price.toString(),
          trade.close_price.toString(),
          (trade.quantity * Math.abs(trade.open_price)).toString(),
          (trade.quantity * Math.abs(trade.close_price)).toString(),
          trade.profit_loss.toString(),
          "true",
          trade.commissions.toString(),
          trade.fees.toString(),
          openDate.getFullYear().toString(),
          closeDate.getFullYear().toString(),
          (openDate.getMonth() + 1).toString(),
          (closeDate.getMonth() + 1).toString(),
          openWeekRange,
          closeWeekRange,
          selectedBrokerText,
          user?.id?.toString() || '',
          new Date().toISOString(),
          new Date().toISOString()
        ]);
        rowIndex++;
      });

      // Process remaining open trades
      allRemainingOpen.forEach((trade) => {
        const openDate = new Date(trade.Date);
        const openWeekRange = `${trade.Date.split('T')[0]} to ${new Date(openDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`;
        
        csvRows.push([
          "",//rowIndex.toString(),
          "Trade",
          openDate.toISOString(),
          "", // No close date for open trades
          trade.Symbol,
          trade['Underlying Symbol'] || trade.Symbol,
          trade.remainingQty.toString(),
          trade['Average Price'].toString(),
          "", // No close price for open trades
          (parseFloat(trade.remainingQty) * Math.abs(parseFloat(trade['Average Price']))).toString(),
          "", // No sell value for open trades
          "", // No profit/loss for open trades
          "false", // Not closed
          trade.Commissions || "0",
          trade.Fees || "0",
          openDate.getFullYear().toString(),
          "", // No close year for open trades
          (openDate.getMonth() + 1).toString(),
          "", // No close month for open trades
          openWeekRange,
          "", // No close week for open trades
          selectedBrokerText,
          user?.id?.toString() || '',
          new Date().toISOString(),
          new Date().toISOString()
        ]);
        rowIndex++;
      });

      // Convert to CSV string and ensure data format matches PostgreSQL requirements
      const csvContent = csvRows.map(row => 
        row.map(cell => {
          if (cell === null || cell === undefined) return '""';
          // For dates and regular values, keep them as is
          return `"${cell.toString().replace(/"/g, '""')}"`;
        })
        .join(',')
      ).join('\n');

      // Create a blob with the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      // Create a link to download the CSV
      const fileName = `trades_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('href', window.URL.createObjectURL(blob));
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Create FormData for upload
      const formData = new FormData();
      formData.append('trades', new Blob([csvContent], { type: 'text/csv' }), fileName);
      formData.append('brokerId', selectedBrokerAccount);

      setMessage('Trades saved to CSV successfully.');
      setShowConfirm(false);

    } catch (error) {
      const errorMessage = 'Error saving trades: ' + (error as Error).message;
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setMessage(errorMessage);
      setShowConfirm(false);
    } finally {
      //setUploading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setMatched(null);
    setRawRows(null);
    // Note: We're not clearing allMatched and allRemainingOpen here
    // to preserve accumulated data
    setMessage('Upload preview cancelled. Previous data preserved.');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset function to clear all accumulated data
  const handleReset = () => {
    setAllMatched([]);
    setAllRemainingOpen([]);
    setProcessedFileCount(0);
    setMatchedPreviousOpenCount(0);
    setMatched(null);
    setRawRows(null);
    setProcessingProgress(0);
    setRemainingOpen(null);
    setMoneyMovements([]);
    setMessage('All accumulated data has been reset.');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Process all files at once
  const handleProcessAllFiles = async () => {
    if (!validateBrokerSelection()) {
      return;
    }

    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setMessage("No files selected.");
      return;
    }
    
    setUploading(true);
    setMessage(`Processing all ${files.length} files...`);
    setProcessingProgress(0);
    
    // Reset accumulated data
    setAllMatched([]);
    setAllRemainingOpen([]);
    setProcessedFileCount(0);
    setMatchedPreviousOpenCount(0);
    setMoneyMovements([]);

    // Convert FileList to array and sort by filename
    const fileArray = Array.from(files);
    try {
      fileArray.sort((a, b) => a.name.localeCompare(b.name));
      console.debug("[Money Movements] Processing files in order:", fileArray.map(f => f.name));
    } catch (error) {
      console.warn("Error sorting files:", error);
    }

    let allTrades: MatchedTrade[] = [];
    let currentRemainingOpen: any[] = [];
    let allMoneyMovements: MoneyMovement[] = [];
    let filesProcessed = 0;
    let totalMatchedFromPrevious = 0;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        setProcessingProgress(Math.round((i / fileArray.length) * 100));
        
        const results = await new Promise<Papa.ParseResult<Trade>>((resolve, reject) => {
          Papa.parse<Trade>(file, {
            header: true,
            complete: (results) => resolve(results),
            error: (error) => reject(error)
          });
        });

        const trades = results.data;
        const trimmedTrades = trades.map(row => {
          const trimmed: Trade = {};
          for (const k in row) {
            trimmed[k.trim()] = typeof row[k] === 'string' ? row[k].trim() : row[k];
          }
          return trimmed;
        });

        const res = await fetch('/api/matchTrades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trades: trimmedTrades,
            previousOpenTrades: currentRemainingOpen,
            brokerId: selectedBrokerAccount
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(`Failed to match trades in ${file.name}: ${error.error}`);
        }

        const data: {
          matched: MatchedTrade[];
          remainingOpenTrades: any[];
          moneyMovements: MoneyMovement[];
        } = await res.json();

        if (data.moneyMovements && data.moneyMovements.length > 0) {
          logMoneyMovement(`Found in file ${file.name}`, data.moneyMovements);
          allMoneyMovements = [...allMoneyMovements, ...data.moneyMovements];
        }

        // Calculate matches from previous open positions
        if (i > 0) {
          const matchedFromPrevious = Math.max(
            0,
            currentRemainingOpen.length - (data.remainingOpenTrades?.length || 0) +
              (data.matched?.length || 0) -
              trimmedTrades.filter(
                (t) =>
                  t.Action === 'BUY_TO_CLOSE' ||
                  t.Action === 'SELL_TO_CLOSE' ||
                  (t.Action === 'SELL' && t.Type === 'Trade') ||
                  (t.Action === 'BUY' && t.Type === 'Trade')
              ).length
          );
          totalMatchedFromPrevious += matchedFromPrevious;
        }

        allTrades = [...allTrades, ...(data.matched || [])];
        currentRemainingOpen = data.remainingOpenTrades || [];
        filesProcessed++;

        setMessage(`Processed ${filesProcessed} of ${fileArray.length} files. ${allTrades.length} trades matched so far.`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setMessage(`Error processing ${file.name}: ${errorMessage}. ${filesProcessed} files processed successfully.`);
        break;
      }
    }        
    
    // Update all state variables with the final data
    setAllMatched(allTrades);
    setAllRemainingOpen(currentRemainingOpen);
    setMatched(allTrades);
    setRemainingOpen(currentRemainingOpen);
    setProcessedFileCount(filesProcessed);
    setMatchedPreviousOpenCount(totalMatchedFromPrevious);
    // Update money movements state with all accumulated movements
    // Validate and sort movements before updating state
    const validMovements = allMoneyMovements.filter(m => {
      const isValid = Boolean(m.date) && typeof m.amount === 'number' && !isNaN(m.amount);
      if (!isValid) {
        console.warn('[Money Movements] Filtering out invalid movement:', m);
      }
      return isValid;
    });

    // Sort by date (newest first) before updating state
    const sortedMovements = [...validMovements].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    console.debug('[Money Movements] About to update state:', {
      original: allMoneyMovements.length,
      valid: validMovements.length,
      sorted: sortedMovements.length,
      firstDate: sortedMovements[0]?.date,
      lastDate: sortedMovements[sortedMovements.length - 1]?.date
    });

    updateMoneyMovements(sortedMovements);
    setProcessingProgress(100);
    
    // Log final money movement summary
    console.debug('[Money Movements] Final accumulated movements:', {
      totalCount: allMoneyMovements.length,
      byType: {
        FUNDS: allMoneyMovements.filter(m => m.type === 'FUNDS' || (m.description || '').toUpperCase().includes('ACH')).length,
        DIVIDEND: allMoneyMovements.filter(m => m.type === 'DIVIDEND').length,
        INTEREST: allMoneyMovements.filter(m => m.type === 'INTEREST').length,
        MARGIN: allMoneyMovements.filter(m => m.type === 'MARGIN').length,
        MTM: allMoneyMovements.filter(m => m.type === 'MTM').length
      },
      movements: allMoneyMovements.map(m => ({
        type: m.type,
        description: m.description,
        amount: m.amount,
        isACH: (m.description || '').toUpperCase().includes('ACH'),
        date: m.date
      }))
    });

    const matchedMsg = totalMatchedFromPrevious > 0 ? 
      ` (including ${totalMatchedFromPrevious} trades matched with previously open positions)` : '';
    const openPositionsMsg = currentRemainingOpen.length > 0 ? 
      ` Currently tracking ${currentRemainingOpen.length} open positions.` : '';
    const moneyMovementsMsg = allMoneyMovements.length > 0 ? 
      ` Found ${allMoneyMovements.length} money movements.` : '';
    
    setMessage(`Batch processing complete. Processed ${filesProcessed} of ${fileArray.length} files. ${allTrades.length} trades matched${matchedMsg}.${openPositionsMsg}${moneyMovementsMsg}`);
    setUploading(false);
  };

  // Debug money movements
  useEffect(() => {
    console.log('Money movements state updated:', {
      hasMovements: moneyMovements && moneyMovements.length > 0,
      count: moneyMovements?.length || 0,
      movements: moneyMovements
    });
  }, [moneyMovements]);

  // Add debug logging for money movements state updates
  useEffect(() => {
    console.debug('[Money Movements] State updated:', {
      hasMovements: moneyMovements && moneyMovements.length > 0,
      count: moneyMovements?.length || 0,
      movements: moneyMovements?.map(m => ({
        date: m.date,
        type: m.type,
        amount: m.amount
      }))
    });
  }, [moneyMovements]);

  // Enhanced debug logging for money movements state
  useEffect(() => {
    console.debug('[UploadTrades] Money movements state updated:', {
      hasMovements: Boolean(moneyMovements && moneyMovements.length > 0),
      count: moneyMovements?.length || 0,
      sampleMovements: moneyMovements?.slice(0, 3)?.map(m => ({
        date: m.date,
        type: m.type,
        amount: m.amount,
        description: m.description
      }))
    });
  }, [moneyMovements]);

  // Watch for money movements in batch processing
  const updateMoneyMovements = (newMovements: MoneyMovement[]) => {
    console.debug('[UploadTrades] Setting money movements:', {
      newCount: newMovements?.length || 0,
      currentCount: moneyMovements?.length || 0
    });
    setMoneyMovements(newMovements);
  };

  // Compute filtered money movements
  const filteredMoneyMovements = useMemo(() => {
    if (!moneyMovements || moneyMovements.length === 0) return [];
    
    return moneyMovements.filter(movement => {
      // Get the year from the movement date
      const movementYear = movement.date ? 
        new Date(movement.date).getFullYear().toString() : '';
      
      // Apply year filter to all types
      const yearMatches = yearFilter === 'All Years' || movementYear === yearFilter;
      
      // For DIVIDEND type, also apply the underlying filter
      if (movement.type === 'DIVIDEND') {
        const filterUnderlyingText = underlyingFilter.toLowerCase();
        const symbol = (movement.symbol || '').toLowerCase();
        const description = (movement.description || '').toLowerCase();
        
        return yearMatches && (
          !underlyingFilter || 
          symbol.includes(filterUnderlyingText) || 
          description.includes(filterUnderlyingText)
        );
      }
      
      // For FUNDS, INTEREST, and MARGIN, only apply year filter
      return yearMatches;
    });
  }, [moneyMovements, underlyingFilter, yearFilter]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchBrokerAccounts = async () => {
      try {
        const response = await fetch('/api/getBrokerAccounts');
        if (!response.ok) throw new Error('Failed to fetch broker accounts');
        const data = await response.json();
        setBrokerAccounts(data);
      } catch (error) {
        console.error('Error fetching broker accounts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load broker accounts',
          variant: 'destructive',
        });
      }
    };

    fetchBrokerAccounts();
  }, [user, router, toast]);

  // Check if broker is selected before processing
  const validateBrokerSelection = () => {
    if (!selectedBrokerAccount) {
      toast({
        title: 'Required',
        description: 'Please select a broker account before processing files',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  // Modify handleFileChange to include broker validation
  const handleFileChangeWithValidation = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!validateBrokerSelection()) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    await handleFileChange(e);
  };

  // Modify handleProcessAllFiles to include broker validation
  const handleProcessAllFilesWithValidation = async () => {
    if (!validateBrokerSelection()) {
      return;
    }
    await handleProcessAllFiles();
  };

  return (
    <div className="p-4 border rounded bg-muted">
      <h2 className="font-bold mb-2">Upload Trades CSV</h2>
      
      {/* Add broker account selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Select Broker Account
        </label>
        <select
          value={selectedBrokerAccount}
          onChange={(e) => {
            const account = brokerAccounts.find(a => a.id.toString() === e.target.value);
            setSelectedBrokerAccount(e.target.value);
            setSelectedBrokerText(account ? `${account.broker_name}-${account.account_number}` : '');
          }}
          className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
        >
          <option value="">Select a broker account</option>
          {brokerAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.broker_name} - {account.account_number}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <input
          type="file"
          accept=".csv"
          multiple
          ref={fileInputRef}
          onChange={handleFileChangeWithValidation}
          disabled={uploading}
          className="mb-2"
        />
        
        <button
          onClick={handleProcessAllFilesWithValidation}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          disabled={uploading}
        >
          Process All Files
        </button>
        
        {processedFileCount > 0 && (
          <>
            <button
              onClick={() => setShowConfirm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={uploading}
            >
              Save All Trades
            </button>
            <button
              onClick={handleReset}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
              disabled={uploading}
            >
              Reset Data
            </button>
          </>
        )}
      </div>
      
      {/* Add helpful information about file processing */}
      <div className="mb-4 text-sm bg-blue-50 dark:bg-blue-900 p-3 rounded-md">
        <p><strong>Tip:</strong> When processing multiple files, the system will match open positions from previous files with closing trades in new files. 
          For best results, upload files in chronological order or use "Process All Files" which will attempt to sort files by date.</p>
      </div>
      
      {processedFileCount > 0 && (
        <div className="mb-2 text-sm">
          <span className="font-semibold">{processedFileCount}</span> file{processedFileCount !== 1 ? 's' : ''} processed. 
          Total trades: <span className="font-semibold">{allMatched.length}</span>
          {processedFileCount > 1 && matchedPreviousOpenCount > 0 && (
            <span className="ml-1">(including <span className="font-semibold text-green-600 dark:text-green-400">{matchedPreviousOpenCount}</span> trades matched with previously open positions)</span>
          )}
        </div>
      )}
      
      {message && (
        <div className="mb-4">
          <p className="text-green-600">{message}</p>
        </div>
      )}
      
      {uploading && (
        <div className="mb-4">
          <p className="mb-2">Processing...</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Filter Section */}
      {moneyMovements && moneyMovements.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Filter Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="symbolFilter" className="block text-sm font-medium mb-1">
                Symbol Filter
              </label>
              <input
                id="symbolFilter"
                type="text"
                value={symbolFilter}
                onChange={(e) => setSymbolFilter(e.target.value)}
                placeholder="Filter by symbol..."
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
              />
            </div>
            <div>
              <label htmlFor="underlyingFilter" className="block text-sm font-medium mb-1">
                Underlying Filter
              </label>
              <input
                id="underlyingFilter"
                type="text"
                value={underlyingFilter}
                onChange={(e) => setUnderlyingFilter(e.target.value)}
                placeholder="Filter by underlying..."
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
              />
            </div>
            <div>
              <label htmlFor="yearFilter" className="block text-sm font-medium mb-1">
                Year Filter
              </label>
              <select
                id="yearFilter"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <MoneyMovementsSummary movements={filteredMoneyMovements} />

      {matched && matched.length > 0 && (
        <div className="mb-4">
          <div 
            className="flex items-center justify-between cursor-pointer bg-gray-100 dark:bg-gray-700 p-2 rounded-t border border-b-0"
            onClick={() => setMatchedTradesPreviewCollapsed(!matchedTradesPreviewCollapsed)}
          >
            <h2 className="text-lg font-semibold">Matched Trades Preview ({filteredMatched.length})</h2>
            <span>{matchedTradesPreviewCollapsed ? '▼' : '▲'}</span>
          </div>
          
          {!matchedTradesPreviewCollapsed && (
            <table className="min-w-full border text-black dark:text-white">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="border p-2">Symbol</th>
                  <th className="border p-2">Underlying</th>
                  <th className="border p-2">Open Date</th>
                  <th className="border p-2">Close Date</th>
                  <th className="border p-2">Quantity</th>
                  <th className="border p-2">Open Price</th>
                  <th className="border p-2">Close Price</th>
                  <th className="border p-2">P/L</th>
                  <th className="border p-2">Commissions</th>
                  <th className="border p-2">Fees</th>
                  <th className="border p-2">Account</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatched.map((trade, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}>
                    <td className="border p-2">{trade.symbol}</td>
                    <td className="border p-2">{trade.underlying_symbol}</td>
                    <td className="border p-2">{trade.open_date}</td>
                    <td className="border p-2">{trade.close_date || 'Open'}</td>
                    <td className="border p-2">{trade.quantity}</td>
                    <td className="border p-2">${typeof trade.open_price === 'number' ? trade.open_price.toFixed(2) : '0.00'}</td>
                    <td className="border p-2">
                      {trade.close_price !== undefined && trade.close_price !== null && Number(trade.close_price) !== 0
                        ? `$${Number(trade.close_price).toFixed(2)}` 
                        : '$0.00'}
                    </td>
                    <td className={`border p-2 ${typeof trade.profit_loss === 'number' && trade.profit_loss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      ${typeof trade.profit_loss === 'number' ? trade.profit_loss.toFixed(2) : '0.00'}
                    </td>
                    <td className="border p-2 text-red-600 dark:text-red-400">${typeof trade.commissions === 'number' ? trade.commissions.toFixed(2) : '0.00'}</td>
                    <td className="border p-2 text-red-600 dark:text-red-400">${typeof trade.fees === 'number' ? trade.fees.toFixed(2) : '0.00'}</td>
                    <td className="border p-2">{trade.account}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {remainingOpen && remainingOpen.length > 0 && (
        <div className="mb-4">
          <div 
            className="flex items-center justify-between cursor-pointer bg-gray-100 dark:bg-gray-700 p-2 rounded-t border border-b-0"
            onClick={() => setOpenTradesCollapsed(!openTradesCollapsed)}
          >
            <h2 className="text-lg font-semibold">Remaining Open Trades Preview ({remainingOpen.length})</h2>
            <span>{openTradesCollapsed ? '▼' : '▲'}</span>
          </div>
          
          {!openTradesCollapsed && (
            <table className="min-w-full border text-black dark:text-white">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Symbol</th>
                  <th className="border p-2">Underlying Symbol</th>
                  <th className="border p-2">Quantity</th>
                  <th className="border p-2">Average Price</th>
                  <th className="border p-2">Value</th>
                  <th className="border p-2">Commissions</th>
                  <th className="border p-2">Fees</th>
                  <th className="border p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRemainingOpen.map((trade, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                    <td className="border p-2">{trade.Date}</td>
                    <td className="border p-2">{trade.Symbol}</td>
                    <td className="border p-2">{trade['Underlying Symbol']}</td>
                    <td className="border p-2">{trade.remainingQty}</td>
                    <td className="border p-2">{trade['Average Price']}</td>
                    <td className="border p-2">{trade.Value}</td>
                    <td className="border p-2 text-red-600 dark:text-red-400">{trade.Commissions}</td>
                    <td className="border p-2 text-red-600 dark:text-red-400">{trade.Fees}</td>
                    <td className="border p-2">
                      {trade.isPreviouslyOpen ? 
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">From previous file</span> : 
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">New</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full border dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Confirm Upload</h2>
            <p className="mb-4 dark:text-gray-300">You have matched {allMatched.length} trades across {processedFileCount} files. Do you want to upload these trades?</p>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleConfirm}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {allMatched.length > 0 && (
        <div className="mt-4">
          <div 
            className="flex items-center justify-between cursor-pointer bg-gray-100 dark:bg-gray-700 p-2 rounded-t border border-b-0"
            onClick={() => setSummaryCollapsed(!summaryCollapsed)}
          >
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Summary by Underlying Symbol ({summaryByUnderlying.length})</h2>
            </div>
            <span>{summaryCollapsed ? '▼' : '▲'}</span>
          </div>

          {!summaryCollapsed && (
            <table className="min-w-full border text-black dark:text-white">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="border p-2">Underlying Symbol</th>
                  <th className="border p-2">Realized P/L</th>
                  <th className="border p-2">Commissions</th>
                  <th className="border p-2">Fees</th>
                  <th className="border p-2">Unrealized P/L</th>
                  <th className="border p-2">Total P/L</th>
                </tr>
              </thead>
              <tbody>
                {summaryByUnderlying.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}>
                    <td className="border p-2">{row.underlying_symbol}</td>
                    <td className={`border p-2 ${row.realized >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      ${row.realized.toFixed(2)}
                    </td>
                    <td className="border p-2 text-red-600 dark:text-red-400">
                      ${row.commissions.toFixed(2)}
                    </td>
                    <td className="border p-2 text-red-600 dark:text-red-400">
                      ${row.fees.toFixed(2)}
                    </td>
                    <td className={`border p-2 ${row.unrealized >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      ${row.unrealized.toFixed(2)}
                    </td>
                    <td className={`border p-2 font-semibold ${row.realized + row.commissions + row.fees >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      ${(row.realized + row.commissions + row.fees).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {/* Add a total row */}
                <tr className="bg-gray-200 dark:bg-gray-600 font-bold text-black dark:text-white">
                  <td className="border p-2">TOTAL</td>
                  <td className={`border p-2 ${summaryByUnderlying.reduce((sum, row) => sum + row.realized, 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${summaryByUnderlying.reduce((sum, row) => sum + row.realized, 0).toFixed(2)}
                  </td>
                  <td className="border p-2 text-red-600 dark:text-red-400">
                    ${summaryByUnderlying.reduce((sum, row) => sum + row.commissions, 0).toFixed(2)}
                  </td>
                  <td className="border p-2 text-red-600 dark:text-red-400">
                    ${summaryByUnderlying.reduce((sum, row) => sum + row.fees, 0).toFixed(2)}
                  </td>
                  <td className={`border p-2 ${summaryByUnderlying.reduce((sum, row) => sum + row.unrealized, 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${summaryByUnderlying.reduce((sum, row) => sum + row.unrealized, 0).toFixed(2)}
                  </td>
                  <td className={`border p-2 ${summaryByUnderlying.reduce((sum, row) => sum + row.realized + row.commissions + row.fees, 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${summaryByUnderlying.reduce((sum, row) => sum + row.realized + row.commissions + row.fees, 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}
            
      {(showConfirm || processedFileCount > 0) && allMatched.length > 0 && (
        <div className="mt-4">
          <div 
            className="flex items-center justify-between cursor-pointer bg-gray-100 dark:bg-gray-700 p-2 rounded-t border border-b-0"
            onClick={() => setMatchedTradesCollapsed(!matchedTradesCollapsed)}
          >
            <h3 className="font-semibold">Matched Trades ({filteredMatched.length})</h3>
            <span>{matchedTradesCollapsed ? '▼' : '▲'}</span>
          </div>
          
          {!matchedTradesCollapsed && (
            <table className="min-w-full border text-black dark:text-white mb-8">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="border p-2">Symbol</th>
                  <th className="border p-2">Underlying</th>
                  <th className="border p-2">Open Date</th>
                  <th className="border p-2">Close Date</th>
                  <th className="border p-2">Quantity</th>
                  <th className="border p-2">Open Price</th>
                  <th className="border p-2">Close Price</th>
                  <th className="border p-2">P/L</th>
                  <th className="border p-2">Commissions</th>
                  <th className="border p-2">Fees</th>
                  <th className="border p-2">Account</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatched.map((trade, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}>
                    <td className="border p-2">{trade.symbol}</td>
                    <td className="border p-2">{trade.underlying_symbol}</td>
                    <td className="border p-2">{trade.open_date}</td>
                    <td className="border p-2">{trade.close_date || 'Open'}</td>
                    <td className="border p-2">{trade.quantity}</td>
                    <td className="border p-2">${typeof trade.open_price === 'number' ? trade.open_price.toFixed(2) : '0.00'}</td>
                    <td className="border p-2">
                      {trade.close_price !== undefined && trade.close_price !== null && Number(trade.close_price) !== 0
                        ? `$${Number(trade.close_price).toFixed(2)}` 
                        : '$0.00'}
                    </td>
                    <td className={`border p-2 ${typeof trade.profit_loss === 'number' && trade.profit_loss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      ${typeof trade.profit_loss === 'number' ? trade.profit_loss.toFixed(2) : '0.00'}
                    </td>
                    <td className="border p-2 text-red-600 dark:text-red-400">${typeof trade.commissions === 'number' ? trade.commissions.toFixed(2) : '0.00'}</td>
                    <td className="border p-2 text-red-600 dark:text-red-400">${typeof trade.fees === 'number' ? trade.fees.toFixed(2) : '0.00'}</td>
                    <td className="border p-2">{trade.account}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
