import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { getUser } from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const filesEntries = formData.getAll('files');
    
    if (!filesEntries.length) {
      return NextResponse.json({ error: 'No files uploaded.' }, { status: 400 });
    }

    // Get user from session
    const user = await getUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: 'User not authenticated.' }, { status: 401 });
    }
    
    // Process all files
    const results = [];
    
    for (const fileEntry of filesEntries) {
      if (typeof fileEntry === 'string') {
        continue; // Skip if it's not a file
      }
      
      const file = fileEntry as File;
      const arrayBuffer = await file.arrayBuffer();
      const csvText = Buffer.from(arrayBuffer).toString('utf-8');
      
      const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      
      // Insert trades into DB with user_id for each file
      // You can add your database insertion logic here
      
      results.push({
        filename: file.name,
        recordCount: records.length
      });
    }

    return NextResponse.json({ 
      success: true, 
      processed: results 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process files.' }, { status: 500 });
  }
}
