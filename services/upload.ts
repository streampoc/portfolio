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
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    return Number(val.replace(/[$,]/g, ''));
  }
  return 0;
}

export async function matchTrades(trades: any[], debugLogs?: string[]) {
  // Remove duplicates based on trade metadata
  const uniqueTrades = trades.reduce((acc: any[], t: any) => {
    const tradeKey = `${t.Date}-${t.Symbol}-${t.Action}-${t.Quantity}-${t['Average Price']}-${t.Account}`;
    if (!acc.find(x => `${x.Date}-${x.Symbol}-${x.Action}-${x.Quantity}-${x['Average Price']}-${x.Account}` === tradeKey)) {
      acc.push(t);
    } else {
      debugLogs?.push(`Skipping duplicate trade: ${JSON.stringify(t)}`);
    }
    return acc;
  }, []);

  // Normalize and generate contractKey for each trade 
  const filtered = uniqueTrades.filter(t => t.Type === 'Trade').map(t => {
    const norm: any = {};
    for (const k in t) {
      norm[k.trim()] = typeof t[k] === 'string' ? t[k].trim() : t[k];
    }
    norm.Quantity = parseNumber(norm.Quantity);
    norm['Average Price'] = parseNumber(norm['Average Price']);
    // Normalize Action to 'OPEN' or 'CLOSE'
    if (norm.Action === 'BUY_TO_OPEN' || norm.Action === 'SELL_TO_OPEN') {
      norm.ActionNorm = 'OPEN';
    } else if (norm.Action === 'BUY_TO_CLOSE' || norm.Action === 'SELL_TO_CLOSE') {
      norm.ActionNorm = 'CLOSE';
    } else {
      norm.ActionNorm = norm.Action;
    }
    // Generate contractKey for each row
    norm.contractKey = [norm.Symbol, norm['Underlying Symbol'], norm['Call or Put']].join('|');
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

  for (const trade of filtered) {
    if (trade.ActionNorm === 'OPEN') {
      if (!openMap.has(trade.contractKey)) openMap.set(trade.contractKey, []);
      openMap.get(trade.contractKey)!.push({ ...trade, remainingQty: trade.Quantity });
    }
  }

  // Now loop again and match all close trades to opens
  for (const trade of filtered) {
    if (trade.ActionNorm !== 'CLOSE') continue;
    const key = trade.contractKey;
    let closeQty = trade.Quantity;
    debugLogs?.push(`Matching close trade: ${JSON.stringify(trade)} | contractKey: ${key}`);

    while (closeQty > 0) {
      if (openMap.has(key) && openMap.get(key)!.length > 0) {
        const openTrade = openMap.get(key)![0];
        const openQty = openTrade.remainingQty;
        const matchQty = Math.min(openQty, closeQty);
        const openPrice = openTrade['Average Price'];
        const closePrice = trade['Average Price'];

        // Calculate profitLoss as the sum of trade values (sign already included)
        let profitLoss = parseNumber(trade.Value) + parseNumber(openTrade.Value);

        // Create a single row for this matched pair
        const matchKey = `${key}-${openTrade.Date}-${trade.Date}-${matchQty}`;
        const matchedTrade = {
          open_date: openTrade.Date,
          close_date: trade.Date,
          symbol: openTrade.Symbol,
          underlying_symbol: openTrade['Underlying Symbol'],
          quantity: matchQty,
          open_price: openPrice,
          close_price: closePrice,
          profit_loss: profitLoss,
          commissions: (openTrade['Commissions'] || 0) + (trade['Commissions'] || 0),
          fees: (openTrade['Fees'] || 0) + (trade['Fees'] || 0),
          account: openTrade.Account // Add account to matched trade
        };

        matchedTrades.set(matchKey, matchedTrade);
        
        openTrade.remainingQty -= matchQty;
        closeQty -= matchQty;
        if (openTrade.remainingQty === 0) {
          openMap.get(key)!.shift();
        }
      } else {
        closeQty = 0; // No matching open trade found, skip this close
      }
    }
  }

  // Sort matched trades by close date
  const sortedTrades = Array.from(matchedTrades.values()).sort((a, b) => {
    return new Date(b.close_date).getTime() - new Date(a.close_date).getTime();
  });

  debugLogs?.push('==== DEBUG: Matched trades summary ====');
  sortedTrades.forEach(t => {
    debugLogs?.push(JSON.stringify(t, null, 2));
  });
  debugLogs?.push('==== END DEBUG ====');

  return sortedTrades;
}