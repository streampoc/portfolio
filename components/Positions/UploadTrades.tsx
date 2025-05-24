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

export default function UploadTrades() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [matched, setMatched] = useState<MatchedTrade[] | null>(null);
  const [rawRows, setRawRows] = useState<Trade[] | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  
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
          console.log('Matched trades:', data.matched); // Debug log
          setMatched(data.matched);
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
                  <td className="border p-2">${trade.open_price.toFixed(2)}</td>
                  <td className="border p-2">{trade.close_price ? `$${trade.close_price.toFixed(2)}` : '—'}</td>
                  <td className="border p-2">${trade.profit_loss.toFixed(2)}</td>
                  <td className="border p-2">{trade.account}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
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
