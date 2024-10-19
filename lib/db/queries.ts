import { sql } from 'drizzle-orm';
import { db } from './drizzle';
import { trades, users } from './schema';
import { and, eq, isNull } from 'drizzle-orm/expressions';
import { cookies } from 'next/headers';


export async function getUser() {
    
    const sessionData = {"user":{"username":"admin@vercel.com"}}
  
    const user = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, sessionData.user.username), // Assuming 'admin' is actually the email
          isNull(users.deletedAt)
        )
      )
      .limit(1);
  
    if (user.length === 0) {
      return null;
    }
  
    return user[0];
  }
