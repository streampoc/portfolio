import { sql } from "@vercel/postgres";
import { getUser } from '@/lib/db/queries';
import { User } from "@/lib/db/schema";

// Utility function to get week number from a date
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Utility to match trades before inserting into the database
function parseNumber(val: any) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    // Remove currency symbols, commas and handle negative values with parentheses
    const cleanedVal = val.replace(/[$,]/g, '').replace(/\(([^)]+)\)/, '-$1');
    const result = Number(cleanedVal);
    return isNaN(result) ? 0 : result;
  }
  return 0;
}

// Preprocess trade data to normalize and enhance matching
function preprocessTrade(trade: any) {
  const normalizedTrade = { ...trade };
  
  // Normalize whitespace in all string fields
  for (const key in normalizedTrade) {
    if (typeof normalizedTrade[key] === 'string') {
      normalizedTrade[key] = normalizedTrade[key].trim().replace(/\s+/g, ' ');
    }
  }
  
  // Handle empty Action field
  if (!normalizedTrade.Action || normalizedTrade.Action.trim() === '') {
    if (normalizedTrade.Type === 'Receive Deliver') {
      const hasSpecialSymbol = normalizedTrade.Symbol && (
        normalizedTrade.Symbol.includes('SPXW') || normalizedTrade.Symbol.includes('NDXP')
      );

      // Handle both removal and cash settlement entries
      if (normalizedTrade.Description) {
        // Set flags and store relevant information without returning early
        if (normalizedTrade.Description.includes("Cash settlement")) {
          normalizedTrade.isCashSettlement = true;
          normalizedTrade.ActionNorm = 'CLOSE';
          normalizedTrade.Action = 'CLOSE';
          normalizedTrade.closePrice = parseNumber(normalizedTrade['Average Price']);
        }
        if (normalizedTrade.Description.includes("Removal of option")) {
          normalizedTrade.isRemoval = true;
          normalizedTrade.ActionNorm = 'CLOSE';
          normalizedTrade.Action = 'CLOSE';
        }
        if (normalizedTrade.Description.includes("assignment") ||
            normalizedTrade.Description.includes("exercise")) {
          normalizedTrade.ActionNorm = 'CLOSE';
          normalizedTrade.Action = 'CLOSE';
        }
      }
      
      // If none of the above conditions matched, check other cases
      if (!normalizedTrade.Action) {
        const hasSpecialDesc = normalizedTrade.Description && (
          (!normalizedTrade.Description.includes("Removal of option") || 
            normalizedTrade.Description.includes("Cash settlement"))
        );
        
        const hasStandardDesc = normalizedTrade.Description && (
          normalizedTrade.Description.includes("assignment") || 
          normalizedTrade.Description.includes("expiration") || 
          normalizedTrade.Description.includes("exercise")
        );
        
        if ((hasSpecialSymbol && hasSpecialDesc) || 
            (!hasSpecialSymbol && hasStandardDesc)) {
          normalizedTrade.Action = 'CLOSE';
          normalizedTrade.ActionNorm = 'CLOSE';
        }
      }
    }
  }

  // Handle options (including NDX options)
  if (normalizedTrade['Instrument Type'] === 'Equity Option') {
    // Remove whitespace from option symbols (safely handle undefined)
    if (normalizedTrade.Symbol) {
      normalizedTrade.Symbol = normalizedTrade.Symbol.replace(/\s+/g, '');
    }
    
    // Normalize action types
    if (normalizedTrade.Action) {
      if (normalizedTrade.Action.includes('BUY_TO_OPEN')) {
        normalizedTrade.Action = 'BUY_TO_OPEN';
      } else if (normalizedTrade.Action.includes('SELL_TO_OPEN')) {
        normalizedTrade.Action = 'SELL_TO_OPEN';
      } else if (normalizedTrade.Action.includes('BUY_TO_CLOSE')) {
        normalizedTrade.Action = 'BUY_TO_CLOSE';
      } else if (normalizedTrade.Action.includes('SELL_TO_CLOSE')) {
        normalizedTrade.Action = 'SELL_TO_CLOSE';
      }
    }
  } else if (normalizedTrade['Instrument Type'] === 'Equity' && 
             normalizedTrade.Symbol && 
             !normalizedTrade.Symbol.includes('SPXW')) {
    // Simplify equity actions
    if (normalizedTrade.Action) {
      if (normalizedTrade.Action.includes('SELL')) {
        normalizedTrade.Action = 'SELL';
      } else if (normalizedTrade.Action.includes('BUY')) {
        normalizedTrade.Action = 'BUY';
      }
    }
  }
  
  // Handle futures and future options
  if (normalizedTrade['Instrument Type'] === 'Future' && normalizedTrade.Symbol) {
    if (normalizedTrade.Symbol.length > 6) {
      normalizedTrade['Underlying Symbol'] = normalizedTrade.Symbol.slice(0, -3);
    } else {
      normalizedTrade['Underlying Symbol'] = normalizedTrade.Symbol.slice(0, -2);
    }
  }
  
  if (normalizedTrade['Instrument Type'] === 'Future Option' && normalizedTrade['Underlying Symbol']) {
    normalizedTrade['Underlying Symbol'] = normalizedTrade['Underlying Symbol'].slice(0, -2);
  }
  
  // Set default Underlying Symbol if not present
  if (!normalizedTrade['Underlying Symbol']) {
    normalizedTrade['Underlying Symbol'] = normalizedTrade.Symbol || '';
  }
  
  // Handle special values
  if (normalizedTrade.Commissions === '--' || normalizedTrade.Commissions === undefined || normalizedTrade.Commissions === '') {
    normalizedTrade.Commissions = '0';
  }
  if (normalizedTrade.Fees === '--' || normalizedTrade.Fees === undefined || normalizedTrade.Fees === '') {
    normalizedTrade.Fees = '0';
  }
  
  return normalizedTrade;
}

interface Trade {
  Date: string;
  Symbol: string;
  'Underlying Symbol'?: string;
  Action?: string;
  Quantity: string | number;
  'Average Price': string | number;
  'Instrument Type'?: string;
  'Strike Price'?: string | number;
  'Expiration Date'?: string;
  'Call or Put'?: string;
  Type?: string;
  Account?: string;
  Value?: string | number;
  Commissions?: string | number;
  Fees?: string | number;
  Description?: string;
}

function generateGroupKey(trade: Trade): string {
  const parts = [
    trade.Date,
    trade.Symbol?.replace(/\s+/g, ''),
    trade.Action,
    trade['Instrument Type'],
    trade['Strike Price'],
    trade['Expiration Date'],
    trade['Call or Put']
  ];
  return parts.filter(Boolean).join('|');
}

function areDuplicateTrades(trade1: Trade, trade2: Trade): boolean {
  return (
    trade1.Quantity === trade2.Quantity &&
    trade1['Average Price'] === trade2['Average Price'] &&
    trade1.Account === trade2.Account &&
    Math.abs(new Date(trade1.Date).getTime() - new Date(trade2.Date).getTime()) <= 1000
  );
}

export async function matchTrades(trades: any[], debugLogs?: string[], previousOpenTrades: any[] = []) {
  // Preprocess trades with enhanced rules
  const preprocessedTrades = trades.map(trade => {
    const processed = preprocessTrade(trade);
    // Special handling for cash settlements and removals
    if (processed.Type === 'Receive Deliver') {
      if (processed.Description && processed.Description.includes("Cash settlement")) {
        processed.isCashSettlement = true;
        processed.ActionNorm = 'CLOSE';
        processed.Action = 'CLOSE';
        processed.closePrice = parseNumber(processed['Average Price']);
        // Important: keep the original Average Price for proper matching
        processed['Average Price'] = parseNumber(processed['Average Price']);
      } else if (processed.Description && processed.Description.includes("Removal of option")) {
        processed.isRemoval = true;
        processed.ActionNorm = 'CLOSE';
        processed.Action = 'CLOSE';
      }
      processed.Quantity = Math.abs(parseNumber(processed.Quantity));
    }
    return processed;
  });

  // Sort by date (oldest first) right after preprocessing
  preprocessedTrades.sort((a, b) => {
    const d1 = new Date(a.Date).getTime();
    const d2 = new Date(b.Date).getTime();
    return d1 - d2;
  });

  // Group trades by symbol and date to consolidate cash settlements with removals
  const tradesBySymbolAndDate = new Map<string, any[]>();
  
  for (const trade of preprocessedTrades) {
    if (!trade.Symbol) continue;
    // Use exact timestamp for better matching
    const key = `${trade.Symbol}-${trade.Date}`;
    
    if (!tradesBySymbolAndDate.has(key)) {
      tradesBySymbolAndDate.set(key, []);
    }
    tradesBySymbolAndDate.get(key)!.push(trade);
  }
  
  // Consolidate related trades
  const consolidatedTrades: any[] = [];
  for (const trades of tradesBySymbolAndDate.values()) {
    const cashSettlement = trades.find(t => t.isCashSettlement);
    const removal = trades.find(t => t.isRemoval);
    
    if (cashSettlement) {
      // Always use cash settlement if it exists
      consolidatedTrades.push({
        ...cashSettlement,
        ActionNorm: 'CLOSE',
        Action: 'CLOSE',
        Quantity: Math.abs(parseNumber(cashSettlement.Quantity)),
        // Keep both the closing price and average price
        closePrice: parseNumber(cashSettlement['Average Price']),
        'Average Price': parseNumber(cashSettlement['Average Price'])
      });
    } else if (removal) {
      // Use removal only if there's no cash settlement
      consolidatedTrades.push({
        ...removal,
        ActionNorm: 'CLOSE',
        Action: 'CLOSE',
        Quantity: Math.abs(parseNumber(removal.Quantity))
      });
    } else {
      // Add all other trades from this group
      trades.forEach(t => consolidatedTrades.push(t));
    }
  }

  // Group trades by date, action, symbol and underlying symbol for regular trade matching
  const groupedTrades = new Map<string, any[]>();
  
  for (const trade of consolidatedTrades) {
    const normalizedSymbol = trade.Symbol ? trade.Symbol.replace(/\s+/g, '') : '';
    const normalizedUnderlying = trade['Underlying Symbol'] ? trade['Underlying Symbol'].replace(/\s+/g, '') : '';
    const groupKey = `${trade.Date}-${normalizedSymbol}-${normalizedUnderlying}-${trade.Action}`;
    
    if (!groupedTrades.has(groupKey)) {
      groupedTrades.set(groupKey, []);
    }
    // Important: preserve all trade properties
    groupedTrades.get(groupKey)!.push({
      ...trade,
      Quantity: parseNumber(trade.Quantity),
      'Average Price': parseNumber(trade['Average Price']),
      'Commissions': parseNumber(trade.Commissions),
      'Fees': parseNumber(trade.Fees),
      closePrice: trade.closePrice // Preserve closing price if it exists
    });
  }

  // Combine trades within each group
  const combinedTrades: any[] = [];
  for (const [_, trades] of groupedTrades) {
    if (trades.length === 1) {
      combinedTrades.push(trades[0]);
      continue;
    }

    // Combine multiple trades with the same characteristics
    const combined = { ...trades[0] };
    let totalQuantity = 0;
    let weightedPrice = 0;
    let totalCommissions = 0;
    let totalFees = 0;

    for (const trade of trades) {
      totalQuantity += trade.Quantity;
      weightedPrice += trade.Quantity * trade['Average Price'];
      totalCommissions += trade.Commissions;
      totalFees += trade.Fees;
    }

    combined.Quantity = totalQuantity;
    combined['Average Price'] = weightedPrice / totalQuantity;
    combined.Commissions = totalCommissions;
    combined.Fees = totalFees;
    combinedTrades.push(combined);
  }

  // Sort by date (oldest first)
  combinedTrades.sort((a, b) => {
    const d1 = new Date(a.Date).getTime();
    const d2 = new Date(b.Date).getTime();
    return d1 - d2;
  });

  // Normalize and generate contractKey for each trade
  const filtered = combinedTrades.filter(t => 
    t.Type === 'Trade' || 
    t.Type === 'Receive Deliver' || 
    t.isCashSettlement
  ).map(t => {
    const norm: any = {};
    for (const k in t) {
      norm[k.trim()] = typeof t[k] === 'string' ? t[k].trim() : t[k];
    }
    
    // Ensure we keep the cash settlement status and price
    if (t.isCashSettlement) {
      norm.isCashSettlement = true;
      norm.closePrice = t.closePrice;
    }

    // Normalize Action to 'OPEN' or 'CLOSE'
    if (norm.Action === 'BUY_TO_OPEN' || norm.Action === 'SELL_TO_OPEN' || norm.Action === 'BUY') {
      norm.ActionNorm = 'OPEN';
    } else if (
      norm.Action === 'BUY_TO_CLOSE' || 
      norm.Action === 'SELL_TO_CLOSE' || 
      norm.Action === 'SELL' ||
      norm.Type === 'Receive Deliver' ||
      norm.isCashSettlement ||
      !norm.Action
    ) {
      norm.ActionNorm = 'CLOSE';
    } else {
      norm.ActionNorm = norm.Action;
    }
    
    // Generate contractKey for each row
    norm.contractKey = [
      norm.Symbol || '', 
      norm['Underlying Symbol'] || '', 
      norm['Call or Put'] || ''
    ].join('|');
    norm.Account = t.Account;
    return norm;
  });

  // Prepare a map of all open trades by contractKey (FIFO queue)
  const openMap = new Map<string, any[]>();
  const matchedTrades = new Map<string, any>();

  // First add previously open trades to the open map
  if (previousOpenTrades && previousOpenTrades.length > 0) {
    for (const trade of previousOpenTrades) {
      if (trade && trade.Symbol && typeof trade.remainingQty === 'number' && trade.remainingQty > 0) {
        if (!trade.contractKey) {
          trade.contractKey = [
            trade.Symbol, 
            trade['Underlying Symbol'] || '', 
            trade['Call or Put'] || ''
          ].join('|');
        }
        trade.isPreviouslyOpen = true;
        if (!openMap.has(trade.contractKey)) {
          openMap.set(trade.contractKey, []);
        }
        openMap.get(trade.contractKey)!.push(trade);
      }
    }
  }

  // Then add new open trades
  for (const trade of filtered) {
    if (trade.ActionNorm === 'OPEN') {
      if (!openMap.has(trade.contractKey)) openMap.set(trade.contractKey, []);
      openMap.get(trade.contractKey)!.push({ ...trade, remainingQty: trade.Quantity });
    }
  }

  // Now match all close trades to opens
  for (const trade of filtered) {
    try {
      if (trade.ActionNorm !== 'CLOSE') continue;
      const key = trade.contractKey;
      let closeQty = Math.abs(trade.Quantity);
      
      debugLogs?.push(`Matching close trade: ${JSON.stringify(trade)} | contractKey: ${key}`);

      while (closeQty > 0) {
        if (openMap.has(key) && openMap.get(key)!.length > 0) {
          const openTrade = openMap.get(key)![0];
          const openQty = Math.abs(openTrade.remainingQty);
          const matchQty = Math.min(openQty, closeQty);
          const openPrice = openTrade['Average Price'];
          // For cash settlements, use the settlement price directly (with its sign)
          const closePrice = trade.isCashSettlement ? trade.closePrice : trade['Average Price'];

          // Keep existing profit/loss calculation which already handles signs correctly
          let profitLoss;
          if (openTrade.Symbol && openTrade['Underlying Symbol'] && openTrade.Symbol === openTrade['Underlying Symbol']) {
            const isBuyToOpen = openTrade.Action && (openTrade.Action.includes('BUY') || openTrade.Action === 'BUY_TO_OPEN');
            const isSellToClose = trade.Action && (trade.Action.includes('SELL') || trade.Action === 'SELL_TO_CLOSE');
            
            if (isBuyToOpen && isSellToClose) {
              profitLoss = (closePrice + openPrice) * matchQty;
            } else if (!isBuyToOpen && !isSellToClose) {
              profitLoss = (openPrice + closePrice) * matchQty;
            } else {
              profitLoss = (closePrice + openPrice) * matchQty;
            }
          } else {
            profitLoss = (closePrice + openPrice) * matchQty;
          }

          const matchKey = `${key}-${openTrade.Date}-${trade.Date}-${matchQty}-${openPrice}-${closePrice}`;
          
          const matchedTrade = {
            open_date: openTrade.Date,
            close_date: trade.Date,
            symbol: openTrade.Symbol,
            underlying_symbol: openTrade['Underlying Symbol'],
            quantity: matchQty,
            open_price: openPrice,
            close_price: closePrice,
            profit_loss: profitLoss,
            commissions: openTrade.Commissions + trade.Commissions,
            fees: openTrade.Fees + trade.Fees,
            account: openTrade.Account
          };

          matchedTrades.set(matchKey, matchedTrade);
          
          openTrade.remainingQty -= matchQty;
          closeQty -= matchQty;
          
          if (Math.abs(openTrade.remainingQty) < 0.000001) {
            openMap.get(key)!.shift();
          }
        } else {
          debugLogs?.push(`No matching open trade found for: ${JSON.stringify({
            symbol: trade.Symbol,
            date: trade.Date,
            qty: closeQty,
            contractKey: key
          })}`);
          closeQty = 0;
        }
      }
    } catch (error) {
      console.error(`Error matching trade: ${JSON.stringify(trade)}`, error);
      debugLogs?.push(`Error matching trade: ${JSON.stringify(trade)} - ${error}`);
    }
  }

  // Sort matched trades by close date
  const sortedTrades = Array.from(matchedTrades.values()).sort((a, b) => {
    return new Date(b.close_date).getTime() - new Date(a.close_date).getTime();
  });

  // Collect remaining open trades
  const remainingOpenTrades: any[] = [];
  for (const opens of openMap.values()) {
    for (const open of opens) {
      if (open && typeof open.remainingQty === 'number' && open.remainingQty > 0) {
        open.Value = (open['Average Price'] * open.remainingQty).toFixed(2);
        remainingOpenTrades.push(open);
      }
    }
  }

  debugLogs?.push('==== DEBUG: Matched trades summary ====');
  sortedTrades.forEach(t => {
    debugLogs?.push(JSON.stringify(t, null, 2));
  });
  debugLogs?.push('==== END DEBUG ====');

  return { matched: sortedTrades, remainingOpenTrades };
}