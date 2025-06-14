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
      
      const hasSpecialDesc = normalizedTrade.Description && (
        (!normalizedTrade.Description.includes("Removal of option") || 
          normalizedTrade.Description.includes("Cash settlement"))
      );
      
      const hasStandardDesc = normalizedTrade.Description && (
        normalizedTrade.Description.includes("assignment") || 
        normalizedTrade.Description.includes("expiration") || 
        normalizedTrade.Description.includes("exercise")
      );
      
      // Apply rule based on symbol and description
      if ((hasSpecialSymbol && hasSpecialDesc) || 
          (!hasSpecialSymbol && hasStandardDesc)) {
        normalizedTrade.Action = 'SELL_TO_CLOSE';
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

export async function matchTrades(trades: any[], debugLogs?: string[], previousOpenTrades: any[] = []) {
  // Preprocess trades with enhanced rules
  const preprocessedTrades = trades.map(trade => preprocessTrade(trade));
  
  // Debug log for commissions and fees
  const sampleTrade = preprocessedTrades[0];
  if (sampleTrade) {
    console.log('Sample trade commissions and fees:', {
      raw_commissions: sampleTrade.Commissions,
      raw_fees: sampleTrade.Fees,
      parsed_commissions: parseNumber(sampleTrade.Commissions),
      parsed_fees: parseNumber(sampleTrade.Fees)
    });
  }

  // Remove duplicates based on trade metadata
  const uniqueTrades = preprocessedTrades.reduce((acc: any[], t: any) => {
    // Normalize whitespace in symbol (safely handle undefined symbols)
    const normalizedSymbol = t.Symbol ? t.Symbol.replace(/\s+/g, '') : '';
    
    // Generate a key that includes position identifier for closing trades
    let tradeKey = `${t.Date}-${normalizedSymbol}-${t.Action}-${t.Quantity}-${t['Average Price']}-${t.Account}`;
    
    // For CLOSE trades, add a counter to allow multiple identical closes to match with a single open
    if (t.Action && (t.Action.includes('TO_CLOSE') || (t.Type === 'Trade' && (t.Action === 'SELL' || t.Action === 'BUY')))) {
      const existingCloses = acc.filter(x => 
        x.Date === t.Date && 
        (x.Symbol ? x.Symbol.replace(/\s+/g, '') : '') === normalizedSymbol && 
        x.Action === t.Action && 
        x.Quantity === t.Quantity && 
        x['Average Price'] === t['Average Price'] && 
        x.Account === t.Account
      ).length;
      tradeKey += `-${existingCloses}`;
    }

    // Only add if not a true duplicate
    if (!acc.find(x => {
      const xSymbol = x.Symbol ? x.Symbol.replace(/\s+/g, '') : '';
      const xKey = `${x.Date}-${xSymbol}-${x.Action}-${x.Quantity}-${x['Average Price']}-${x.Account}`;
      return xKey === tradeKey;
    })) {
      acc.push(t);
    } else {
      debugLogs?.push(`Skipping duplicate trade: ${JSON.stringify(t)}`);
    }
    return acc;
  }, []);

  // Normalize and generate contractKey for each trade 
  const filtered = uniqueTrades.filter(t => t.Type === 'Trade' || t.Type === 'Receive Deliver').map(t => {
    const norm: any = {};
    for (const k in t) {
      norm[k.trim()] = typeof t[k] === 'string' ? t[k].trim() : t[k];
    }
    norm.Quantity = parseNumber(norm.Quantity);
    norm['Average Price'] = parseNumber(norm['Average Price']);
    norm['Commissions'] = parseNumber(norm['Commissions']);
    norm['Fees'] = parseNumber(norm['Fees']);
    // Normalize Action to 'OPEN' or 'CLOSE'
    if (norm.Action === 'BUY_TO_OPEN' || norm.Action === 'SELL_TO_OPEN' || norm.Action === 'BUY') {
      norm.ActionNorm = 'OPEN';
    } else if (
      norm.Action === 'BUY_TO_CLOSE' || 
      norm.Action === 'SELL_TO_CLOSE' || 
      norm.Action === 'SELL' ||
      norm.Type === 'Receive Deliver' ||
      !norm.Action // treat empty Action as CLOSE
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
    norm.Account = t.Account; // Preserve account info
    return norm;
  });

  // Sort by contractKey, then by date (oldest first)
  filtered.sort((a, b) => {
    if (a.contractKey !== b.contractKey) return a.contractKey.localeCompare(b.contractKey);
    const d1 = new Date(a.Date).getTime();
    const d2 = new Date(b.Date).getTime();
    return d1 - d2;
  });

  // Prepare a map of all open trades by contractKey (FIFO queue)
  const openMap = new Map<string, any[]>();
  const matchedTrades = new Map<string, any>();

  // First add previously open trades to the open map
  if (previousOpenTrades && previousOpenTrades.length > 0) {
    console.log(`Processing ${previousOpenTrades.length} previously open trades`);
    for (const trade of previousOpenTrades) {
      // Ensure the trade has the required properties
      if (trade && trade.Symbol && typeof trade.remainingQty === 'number' && trade.remainingQty > 0) {
        // Generate the contractKey if it doesn't exist
        if (!trade.contractKey) {
          trade.contractKey = [
            trade.Symbol, 
            trade['Underlying Symbol'] || '', 
            trade['Call or Put'] || ''
          ].join('|');
        }
        
        // Mark this trade as previously open for tracking purposes
        trade.isPreviouslyOpen = true;
        
        if (!openMap.has(trade.contractKey)) {
          openMap.set(trade.contractKey, []);
        }
        
        // Add to the open map with the remaining quantity
        openMap.get(trade.contractKey)!.push(trade);
        
        // Debug log for previously open trades
        console.log(`Added previously open trade: ${JSON.stringify({
          symbol: trade.Symbol,
          underlying: trade['Underlying Symbol'] || '',
          contractKey: trade.contractKey,
          remainingQty: trade.remainingQty
        })}`);
      }
    }
  }

  // Then add new open trades from the current file
  for (const trade of filtered) {
    if (trade.ActionNorm === 'OPEN') {
      if (!openMap.has(trade.contractKey)) openMap.set(trade.contractKey, []);
      openMap.get(trade.contractKey)!.push({ ...trade, remainingQty: trade.Quantity });
    }
  }

  // Now loop again and match all close trades to opens
  for (const trade of filtered) {
    try {
      if (trade.ActionNorm !== 'CLOSE') continue;
      const key = trade.contractKey;
      let closeQty = Math.abs(trade.Quantity || 0); // Ensure positive quantity for comparison and handle undefined
      
      // Enhanced debug logging
      console.log(`Matching close trade: Symbol=${trade.Symbol || 'undefined'}, Date=${trade.Date || 'undefined'}, Qty=${closeQty}, contractKey=${key}`);
      debugLogs?.push(`Matching close trade: ${JSON.stringify(trade)} | contractKey: ${key}`);

      while (closeQty > 0) {
        if (openMap.has(key) && openMap.get(key)!.length > 0) {
          const openTrade = openMap.get(key)![0];
          const openQty = Math.abs(openTrade.remainingQty || 0); // Ensure positive quantity for comparison and handle undefined
          const matchQty = Math.min(openQty, closeQty);
          const openPrice = parseNumber(openTrade['Average Price']);
          let closePrice = parseNumber(trade['Average Price']);
          
          // Check if this is a previously open trade that's being matched
          const isPreviouslyOpen = openTrade.isPreviouslyOpen;
          
          if (isPreviouslyOpen) {
            console.log(`Matched a previously open trade: ${JSON.stringify({
              symbol: openTrade.Symbol || 'undefined',
              openDate: openTrade.Date || 'undefined',
              closeDate: trade.Date || 'undefined',
              openQty,
              closeQty: matchQty
            })}`);
          }

          // Calculate profit/loss properly using quantity, open_price, and close_price
          let profitLoss;
          
          // Special case for equities (symbol === underlying)
          if (openTrade.Symbol && openTrade['Underlying Symbol'] && openTrade.Symbol === openTrade['Underlying Symbol']) {
            // For equities, we need to account for the direction of the trade
            const isBuyToOpen = openTrade.Action && (openTrade.Action.includes('BUY') || openTrade.Action === 'BUY_TO_OPEN');
            const isSellToClose = trade.Action && (trade.Action.includes('SELL') || trade.Action === 'SELL_TO_CLOSE');
            
            if (isBuyToOpen && isSellToClose) {
              // Standard case: bought then sold
              // For options, the prices already have the correct sign (negative for buys, positive for sells)
              profitLoss = (closePrice + openPrice) * matchQty;
            } else if (!isBuyToOpen && !isSellToClose) {
              // Short case: sold short then bought to cover
              // Similarly, for options, we're adding the already correctly signed values
              profitLoss = (openPrice + closePrice) * matchQty;
            } else {
              // Fallback to using values if the direction is unclear
              profitLoss = (openPrice + closePrice) * matchQty; //parseNumber(trade.Value) + parseNumber(openTrade.Value);
            }
          } else {
            // For options and other instruments, simply add the values
            // The prices already have the correct sign (negative for buys, positive for sells)
            profitLoss = (openPrice + closePrice) * matchQty;//parseNumber(trade.Value) + parseNumber(openTrade.Value);
          }

          // Create a unique key for this matched pair that includes the quantities
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
            commissions: parseNumber(openTrade['Commissions']) + parseNumber(trade['Commissions']),
            fees: parseNumber(openTrade['Fees']) + parseNumber(trade['Fees']),
            account: openTrade.Account
          };

          matchedTrades.set(matchKey, matchedTrade);
          
          // Update remaining quantities
          openTrade.remainingQty -= matchQty;
          closeQty -= matchQty;
          
          // Remove the open trade if it's fully matched
          if (Math.abs(openTrade.remainingQty) < 0.000001) { // Use small epsilon for floating point comparison
            openMap.get(key)!.shift();
          }
        } else {
          console.log(`No matching open trade found for: ${JSON.stringify({
            symbol: trade.Symbol,
            date: trade.Date,
            qty: closeQty,
            contractKey: key
          })}`);
          closeQty = 0; // No matching open trade found, skip this close
        }
      }
    } catch (error) {
      console.error(`Error matching trade: ${JSON.stringify(trade)}`, error);
      debugLogs?.push(`Error matching trade: ${JSON.stringify(trade)} - ${error}`);
      // Continue processing other trades
    }
  }

  // Sort matched trades by close date
  const sortedTrades = Array.from(matchedTrades.values()).sort((a, b) => {
    return new Date(b.close_date).getTime() - new Date(a.close_date).getTime();
  });

  // Debug log for matched trades commissions and fees
  if (sortedTrades.length > 0) {
    console.log('First matched trade commissions and fees:', {
      commissions: sortedTrades[0].commissions,
      fees: sortedTrades[0].fees,
      commissions_type: typeof sortedTrades[0].commissions,
      fees_type: typeof sortedTrades[0].fees
    });
  }

  // Collect remaining open trades
  const remainingOpenTrades: any[] = [];
  for (const opens of openMap.values()) {
    for (const open of opens) {
      // Check if remainingQty exists and is greater than 0
      if (open && typeof open.remainingQty === 'number' && open.remainingQty > 0) {
        open.Value = (parseNumber(open['Average Price']) * open.remainingQty).toFixed(2);
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