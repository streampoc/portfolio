import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session'; // Adjust path if necessary
import { db } from '@/lib/db/drizzle'; // **NEW** Import db instance
import { trades } from '@/lib/db/schema'; // **NEW** Import trades table schema

// Define a type for the enriched data row after initial parsing and type conversion
interface EnrichedDataRow {
  [key: string]: any; // Allow other string keys from CSV
  Date: Date;
  Quantity: number;
  'Average Price': number;
  Commissions: number;
  Fees: number;
  Action: string; // 'BUY_TO_OPEN', 'SELL_TO_OPEN', 'SELL_TO_CLOSE', 'BUY_TO_CLOSE'
  Symbol: string;
  'Instrument Type': string;
  'Underlying Symbol': string;
  Multiplier: number;
}

// Helper function for ISO week calculation
function getWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7; // ISO day of week; 0 is Monday, 6 is Sunday
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000); // 604800000 = 7 * 24 * 3600 * 1000
}

export async function POST(request: NextRequest) {
  const session = await getUserSession();

  if (!session?.userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('csvfile') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No CSV file found in the request' }, { status: 400 });
    }

    const fileContent = await file.text();
    if (!fileContent.trim()) {
      return NextResponse.json({ message: 'CSV file is empty' }, { status: 400 });
    }

    const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) {
      return NextResponse.json({ message: 'CSV file must contain a header and at least one data row' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const rawDataRows = lines.slice(1);
    const parsedObjects: Record<string, string>[] = [];

    for (const rowStr of rawDataRows) {
      const values = rowStr.split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        parsedObjects.push(obj);
      } else {
        console.warn(`Skipping malformed CSV row (column count mismatch): ${rowStr}. Expected ${headers.length}, got ${values.length}.`);
      }
    }

    const initialRowCount = parsedObjects.length;
    const typeFilteredData = parsedObjects.filter(row => row['Type'] !== 'Money Movement');
    
    const preparedData: EnrichedDataRow[] = [];
    for (const row of typeFilteredData) {
      try {
        const quantity = parseFloat(row['Quantity']);
        const averagePrice = parseFloat(row['Average Price']);
        const commissions = parseFloat(row['Commissions'] || '0');
        const fees = parseFloat(row['Fees'] || '0');
        const date = new Date(row['Date']);
        const multiplier = parseFloat(row['Multiplier'] || '100');

        if (isNaN(quantity) || isNaN(averagePrice) || isNaN(commissions) || isNaN(fees) || isNaN(date.getTime()) || isNaN(multiplier)) {
          console.error('Skipping row due to parsing error (NaN) or invalid date:', row);
          continue;
        }
        if (!row['Action'] || !row['Symbol'] || !row['Instrument Type']) {
            console.error('Skipping row due to missing critical fields (Action, Symbol, Instrument Type):', row);
            continue;
        }
        preparedData.push({
          ...row,
          Date: date, Quantity: quantity, 'Average Price': averagePrice, Commissions: commissions, Fees: fees, Multiplier: multiplier,
          Action: row['Action'], Symbol: row['Symbol'], 'Instrument Type': row['Instrument Type'], 'Underlying Symbol': row['Underlying Symbol']
        } as EnrichedDataRow);
      } catch (e) {
        console.error('Error processing row during data preparation:', row, e);
      }
    }
    const preparedRowCount = preparedData.length;

    const openingLegs: EnrichedDataRow[] = [];
    const closingLegs: EnrichedDataRow[] = [];
    for (const row of preparedData) {
      if (row.Action === 'BUY_TO_OPEN' || row.Action === 'SELL_TO_OPEN') openingLegs.push(row);
      else if (row.Action === 'SELL_TO_CLOSE' || row.Action === 'BUY_TO_CLOSE') closingLegs.push(row);
    }
    openingLegs.sort((a, b) => a.Date.getTime() - b.Date.getTime());
    closingLegs.sort((a, b) => a.Date.getTime() - b.Date.getTime());

    const matchedTrades: any[] = [];
    let unmatchedOpeningLegs = openingLegs.map(leg => ({ ...leg, originalQuantity: leg.Quantity, remainingQuantity: leg.Quantity }));

    for (let closeLeg of closingLegs) {
      let closeLegRemainingQuantity = closeLeg.Quantity;
      for (let i = 0; i < unmatchedOpeningLegs.length && closeLegRemainingQuantity > 0; i++) {
        let openLeg = unmatchedOpeningLegs[i];
        if (openLeg.Symbol === closeLeg.Symbol && openLeg.remainingQuantity > 0) {
          const matchQuantity = Math.min(openLeg.remainingQuantity, closeLegRemainingQuantity);
          if (matchQuantity > 0) {
            const openCommissions = (openLeg.Commissions / openLeg.originalQuantity) * matchQuantity;
            const openFees = (openLeg.Fees / openLeg.originalQuantity) * matchQuantity;
            const closeCommissions = (closeLeg.Commissions / closeLeg.Quantity) * matchQuantity;
            const closeFees = (closeLeg.Fees / closeLeg.Quantity) * matchQuantity;
            matchedTrades.push({
              openDetails: { date: openLeg.Date, price: openLeg['Average Price'], quantity: matchQuantity, commissions: openCommissions, fees: openFees, action: openLeg.Action },
              closeDetails: { date: closeLeg.Date, price: closeLeg['Average Price'], quantity: matchQuantity, commissions: closeCommissions, fees: closeFees, action: closeLeg.Action },
              symbol: openLeg.Symbol, instrumentType: openLeg['Instrument Type'], underlyingSymbol: openLeg['Underlying Symbol'], multiplier: openLeg.Multiplier
            });
            openLeg.remainingQuantity -= matchQuantity;
            closeLegRemainingQuantity -= matchQuantity;
          }
        }
      }
      unmatchedOpeningLegs = unmatchedOpeningLegs.filter(leg => leg.remainingQuantity > 0);
    }
    const remainingOpenLegs = unmatchedOpeningLegs.filter(leg => leg.remainingQuantity > 0).map(leg => ({ ...leg, Quantity: leg.remainingQuantity }));

    const dbInsertableTrades: any[] = [];
    if (!session.userId) { 
        throw new Error("User ID missing in session during data transformation.");
    }
    const userId = session.userId;

    for (const matchedPair of matchedTrades) {
      const open_date = matchedPair.openDetails.date as Date;
      const close_date = matchedPair.closeDetails.date as Date;
      const quantity = matchedPair.openDetails.quantity as number;
      const open_price = matchedPair.openDetails.price as number;
      const close_price = matchedPair.closeDetails.price as number;
      const multiplier = matchedPair.multiplier as number;
      
      const total_commissions = (matchedPair.openDetails.commissions as number) + (matchedPair.closeDetails.commissions as number);
      const total_fees = (matchedPair.openDetails.fees as number) + (matchedPair.closeDetails.fees as number);
      let profit_loss: number;

      if (matchedPair.openDetails.action === 'BUY_TO_OPEN') { 
        profit_loss = (close_price - open_price) * quantity * multiplier - (total_commissions + total_fees);
      } else if (matchedPair.openDetails.action === 'SELL_TO_OPEN') { 
        profit_loss = (open_price - close_price) * quantity * multiplier - (total_commissions + total_fees);
      } else {
        console.warn(`Unknown open action type: ${matchedPair.openDetails.action} for symbol ${matchedPair.symbol}. P&L calculation might be incorrect.`);
        profit_loss = 0; 
      }

      const dbInsertableTrade = {
        user_id: userId, open_date: open_date, close_date: close_date, symbol: matchedPair.symbol as string,
        underlying_symbol: matchedPair.underlyingSymbol as string, quantity: quantity, open_price: open_price,
        close_price: close_price, commissions: total_commissions, fees: total_fees, profit_loss: profit_loss,
        is_closed: true, transaction_type: matchedPair.instrumentType as string,
        open_year: open_date.getFullYear(), close_year: close_date.getFullYear(),
        open_month: open_date.getMonth() + 1, close_month: close_date.getMonth() + 1,
        open_week: getWeek(open_date).toString(), close_week: getWeek(close_date).toString(),
        account: 'CSV_IMPORT', 
      };
      dbInsertableTrades.push(dbInsertableTrade);
    }

    // **NEW** Database Insertion Logic
    let successfulInsertions = 0;
    let failedInsertions = 0;
    const insertionErrors: { recordSummary: any, error: string }[] = [];

    for (const tradeRecord of dbInsertableTrades) {
      try {
        // Drizzle ORM expects numeric types that correspond to 'decimal' in pgTable to be strings
        // to avoid precision loss. All other numbers (integer, float) are fine as JS numbers.
        // Let's ensure fields defined as decimal in schema.ts are strings.
        const recordToInsert = {
            ...tradeRecord,
            quantity: String(tradeRecord.quantity),
            open_price: String(tradeRecord.open_price),
            close_price: String(tradeRecord.close_price),
            profit_loss: String(tradeRecord.profit_loss),
            commissions: String(tradeRecord.commissions),
            fees: String(tradeRecord.fees),
            // user_id, open_year, close_year, open_month, close_month are integers, so JS numbers are fine.
            // is_closed is boolean, fine.
            // dates are JS Date objects, Drizzle handles them.
            // text fields are strings, fine.
        };
        await db.insert(trades).values(recordToInsert); // Using 'trades' schema object
        successfulInsertions++;
      } catch (error: any) {
        failedInsertions++;
        console.error("Failed to insert trade record:", tradeRecord, "Error:", error);
        insertionErrors.push({ 
          recordSummary: { symbol: tradeRecord.symbol, openDate: tradeRecord.open_date.toISOString(), closeDate: tradeRecord.close_date.toISOString() },
          error: error.message 
        });
      }
    }

    return NextResponse.json({
      message: "CSV import process complete.", // **MODIFIED**
      userId: session.userId,
      fileName: file.name,
      fileSize: file.size,
      // originalDataRowCount: rawDataRows.length, // Optional: remove if too verbose
      // parsedObjectCount: initialRowCount,       // Optional
      // typeFilteredRowCount: typeFilteredData.length, // Optional
      // preparedRowCount: preparedRowCount,         // Optional
      matchedTradeCount: matchedTrades.length,
      // remainingOpenLegCount: remainingOpenLegs.length, // Optional
      dbInsertableTradesCount: dbInsertableTrades.length,
      successfulInsertions: successfulInsertions, // **NEW**
      failedInsertions: failedInsertions,         // **NEW**
      // dbInsertableTradesPreview: dbInsertableTrades.slice(0, failedInsertions > 0 ? 0 : 3), // Show preview only if all successful
      insertionErrorsPreview: insertionErrors.slice(0, 5) // **NEW**
    });

  } catch (error) {
    console.error('Error processing file upload:', error);
    if (error instanceof Error && (error.message.includes('missing boundary') || error.message.includes('multipart'))) {
      return NextResponse.json({ message: 'Invalid multipart/form-data request. Ensure the request is correctly formatted.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error processing request' }, { status: 500 });
  }
}
