'use client';

import React, { useRef, useState, useMemo } from 'react';
import Papa from 'papaparse';

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

export default function UploadTrades() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [matched, setMatched] = useState<MatchedTrade[] | null>(null);
  const [rawRows, setRawRows] = useState<Trade[] | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [remainingOpen, setRemainingOpen] = useState<any[] | null>(null);
  
  // Quick filter states
  const [symbolFilter, setSymbolFilter] = useState('');
  const [underlyingFilter, setUnderlyingFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Compute filtered trades for preview
  const filteredMatched = useMemo(() => {
    if (!matched) return [];
    return matched.filter(trade => {
      const symbol = trade.symbol.replace(/\s+/g, '').toLowerCase();
      const filterSymbol = symbolFilter.replace(/\s+/g, '').toLowerCase();
      const underlying = trade.underlying_symbol.toLowerCase();
      const dateStr = `${trade.open_date} ${trade.close_date}`.toLowerCase();
      return (
        (!symbolFilter || symbol.includes(filterSymbol)) &&
        (!underlyingFilter || underlying.includes(underlyingFilter.toLowerCase())) &&
        (!dateFilter || dateStr.includes(dateFilter.toLowerCase()))
      );
    });
  }, [matched, symbolFilter, underlyingFilter, dateFilter]);

  // Compute filtered remaining open trades for preview
  const filteredRemainingOpen = useMemo(() => {
    if (!remainingOpen) return [];
    return remainingOpen.filter(trade => {
      const symbol = (trade.Symbol || '').replace(/\s+/g, '').toLowerCase();
      const filterSymbol = symbolFilter.replace(/\s+/g, '').toLowerCase();
      const underlying = (trade['Underlying Symbol'] || '').toLowerCase();
      const dateStr = `${trade.Date || ''}`.toLowerCase();
      return (
        (!symbolFilter || symbol.includes(filterSymbol)) &&
        (!underlyingFilter || underlying.includes(underlyingFilter.toLowerCase())) &&
        (!dateFilter || dateStr.includes(dateFilter.toLowerCase()))
      );
    });
  }, [remainingOpen, symbolFilter, underlyingFilter, dateFilter]);

  // Calculate P/L summary by underlying symbol
  const summaryByUnderlying = useMemo(() => {
    const summary = new Map<string, SummaryRow>();
    
    // Add realized P/L from matched trades
    if (filteredMatched) {
      // Debug log for commissions and fees
      if (filteredMatched.length > 0) {
        console.log('Sample trade for summary calculation:', {
          symbol: filteredMatched[0].symbol,
          profit_loss: filteredMatched[0].profit_loss,
          commissions: filteredMatched[0].commissions,
          fees: filteredMatched[0].fees,
          commissions_type: typeof filteredMatched[0].commissions,
          fees_type: typeof filteredMatched[0].fees
        });
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
          console.log('Equity unrealized P/L calculation:', {
            symbol: trade.Symbol,
            quantity,
            openPrice,
            calculated: openPrice * quantity
          });
        } else {
          // For non-equity positions, use the Value field as before
          const value = parseFloat(trade.Value || '0');
          row.unrealized += isNaN(value) ? 0 : value;
        }
      });
    }
    
    // Convert Map to array and sort by total P/L
    return Array.from(summary.values())
      .sort((a, b) => ((b.realized + b.commissions + b.fees) - (a.realized + a.commissions + a.fees)));
  }, [filteredMatched, filteredRemainingOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setMessage(null);

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

          // Call the API route to match trades
          const res = await fetch('/api/matchTrades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(trimmedTrades),
          });
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to match trades');
          }
          const data = await res.json();
          // Log the first 3 matched trades for debugging
          if (data.matched && data.matched.length > 0) {
            console.log('First 3 matched trades:', data.matched.slice(0, 3));
            console.log('Sample commissions and fees:', data.matched.slice(0, 3).map((t: MatchedTrade) => ({
              symbol: t.symbol,
              commissions: t.commissions,
              fees: t.fees,
              commissions_type: typeof t.commissions,
              fees_type: typeof t.fees
            })));
          }
          setMatched(data.matched);
          setRemainingOpen(data.remainingOpenTrades);
          setShowConfirm(true);
        } catch (error) {
          setMessage('Error processing trades: ' + (error as Error).message);
        } finally {
          setUploading(false);
        }
      },
      error: (error: Error, file: File) => {
        setMessage('Error parsing CSV: ' + error.message);
        setUploading(false);
      }
    });
  };

  const handleSave = async () => {
    if (!matched) return;
    
    try {
      setUploading(true);
      // Create form data from the original file
      const formData = new FormData();
      if (fileInputRef.current?.files?.[0]) {
        formData.append('file', fileInputRef.current.files[0]);
      }
      const res = await fetch('/api/uploadTrades', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setMessage('Trades uploaded successfully!');
        setShowConfirm(false);
        setMatched(null);
        setRawRows(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const error = await res.text();
        setMessage('Error uploading trades: ' + error);
      }
    } catch (error) {
      setMessage('Error uploading trades: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setMatched(null);
    setRawRows(null);
    setMessage('Upload cancelled.');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 border rounded bg-muted">
      <h2 className="font-bold mb-2">Upload Trades CSV</h2>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={uploading}
        className="mb-2"
      />
      {uploading && <div>Processing...</div>}
      {message && <div className="mt-2 text-sm">{message}</div>}
      
      {showConfirm && matched && (
        <div className="mt-4">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Filter by symbol..."
              className="border p-2 rounded"
              value={symbolFilter}
              onChange={e => setSymbolFilter(e.target.value)}
            />
            <input
              type="text"
              placeholder="Filter by underlying..."
              className="border p-2 rounded"
              value={underlyingFilter}
              onChange={e => setUnderlyingFilter(e.target.value)}
            />
            <input
              type="text"
              placeholder="Filter by date..."
              className="border p-2 rounded"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>
          <h3 className="font-semibold mb-2">Matched Trades</h3>
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
                  <td className="border p-2">${typeof trade.profit_loss === 'number' ? trade.profit_loss.toFixed(2) : '0.00'}</td>
                  <td className="border p-2 text-red-600">${typeof trade.commissions === 'number' ? trade.commissions.toFixed(2) : '0.00'}</td>
                  <td className="border p-2 text-red-600">${typeof trade.fees === 'number' ? trade.fees.toFixed(2) : '0.00'}</td>
                  <td className="border p-2">{trade.account}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {remainingOpen && filteredRemainingOpen.length > 0 && (
            <>
              <h3 className="font-semibold mb-2">Remaining Open Trades</h3>
              <table className="min-w-full border text-black dark:text-white mb-8">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="border p-2">Symbol</th>
                    <th className="border p-2">Underlying</th>
                    <th className="border p-2">Open Date</th>
                    <th className="border p-2">Quantity</th>
                    <th className="border p-2">Open Price</th>
                    <th className="border p-2">Account</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRemainingOpen.map((trade, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}>
                      <td className="border p-2">{trade.Symbol}</td>
                      <td className="border p-2">{trade['Underlying Symbol']}</td>
                      <td className="border p-2">{trade.Date}</td>
                      <td className="border p-2">{trade.remainingQty}</td>
                      <td className="border p-2">
                        ${trade['Average Price'] && trade['Average Price'] !== '--' 
                          ? parseFloat(trade['Average Price']).toFixed(2) 
                          : '0.00'}
                      </td>
                      <td className="border p-2">{trade.Account}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          
          {/* Summary Table by Underlying Symbol */}
          {summaryByUnderlying.length > 0 && (
            <>
              <h3 className="font-semibold mb-2">P/L Summary by Underlying Symbol</h3>
              <table className="min-w-full border text-black dark:text-white mb-8">
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
                      <td className={`border p-2 ${row.realized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${row.realized.toFixed(2)}
                      </td>
                      <td className="border p-2 text-red-600">
                        ${row.commissions.toFixed(2)}
                      </td>
                      <td className="border p-2 text-red-600">
                        ${row.fees.toFixed(2)}
                      </td>
                      <td className={`border p-2 ${row.unrealized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${row.unrealized.toFixed(2)}
                      </td>
                      <td className={`border p-2 font-semibold ${row.realized + row.commissions + row.fees >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${(row.realized + row.commissions + row.fees).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {/* Add a total row */}
                  <tr className="bg-gray-200 dark:bg-gray-600 font-bold">
                    <td className="border p-2">TOTAL</td>
                    <td className={`border p-2 ${summaryByUnderlying.reduce((sum, row) => sum + row.realized, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${summaryByUnderlying.reduce((sum, row) => sum + row.realized, 0).toFixed(2)}
                    </td>
                    <td className="border p-2 text-red-600">
                      ${summaryByUnderlying.reduce((sum, row) => sum + row.commissions, 0).toFixed(2)}
                    </td>
                    <td className="border p-2 text-red-600">
                      ${summaryByUnderlying.reduce((sum, row) => sum + row.fees, 0).toFixed(2)}
                    </td>
                    <td className={`border p-2 ${summaryByUnderlying.reduce((sum, row) => sum + row.unrealized, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${summaryByUnderlying.reduce((sum, row) => sum + row.unrealized, 0).toFixed(2)}
                    </td>
                    <td className={`border p-2 ${summaryByUnderlying.reduce((sum, row) => sum + row.realized + row.commissions + row.fees, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${summaryByUnderlying.reduce((sum, row) => sum + row.realized + row.commissions + row.fees, 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
          
          <div className="mt-4 space-x-4">
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={uploading}
            >
              {uploading ? 'Saving...' : 'Save Trades'}
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
              disabled={uploading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
