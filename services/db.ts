import { sql } from "@vercel/postgres";

// Load environment variables
const { POSTGRES_URL } = process.env;

if (!POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not defined in the environment variables');
}

// Function to execute a query
export async function query(text: string, params?: any[]) {
  try {
    const result = await sql.query(text, params);
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

// Add this new function at the end of the file
export async function testDatabaseConnection(): Promise<string> {
  try {
    console.log('Attempting to connect to the database...');
    console.log('Connection URL:', POSTGRES_URL!.replace(/:[^:@]+@/, ':****@')); // Log the URL with password masked
    const result = await sql`SELECT count(*) from trades`;
    console.log('Test query executed successfully.');
    return `Database connection successful. Current time: ${result.rows[0]}`;
  } catch (error) {
    console.error('Error testing database connection:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      return `Database connection failed: ${error.message}\nStack trace: ${error.stack}`;
    } else {
      return `Database connection failed: Unknown error`;
    }
  }
}