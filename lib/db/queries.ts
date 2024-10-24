import { sql } from 'drizzle-orm';
import { db } from './drizzle';
import { trades, users,brokers } from './schema';
import { and, eq, isNull } from 'drizzle-orm/expressions';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

export async function getUser() {
    
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie || !sessionCookie.value) {
        return null;
    }

    const sessionData = await verifyToken(sessionCookie.value);
    if (
        !sessionData ||
        !sessionData.user ||
        typeof sessionData.user.id !== 'number'
    ) {
        return null;
    }

    if (new Date(sessionData.expires) < new Date()) {
        return null;
    }

    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
      .limit(1);
  
    if (user.length === 0) {
      return null;
    }
  
    return user[0];
  }

  export async function getUserAccounts(email:string) {

    const userAccounts = await db
      .select()
      .from(brokers)
      .where(eq(brokers.email,email));
  
    if (userAccounts.length === 0) {
      return null;
    }
  
    return userAccounts;
  }