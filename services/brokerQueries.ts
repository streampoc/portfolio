import { sql } from "@vercel/postgres";

export async function getUserBrokerAccounts(user: { email: string }) {
  const query = `
    SELECT id, broker_name, account_number 
    FROM brokers
    WHERE email = $1 AND deleted_at IS NULL
    ORDER BY broker_name, account_number
  `;
  
  try {
    const result = await sql.query(query, [user.email]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching user broker accounts:', error);
    throw error;
  }
}
