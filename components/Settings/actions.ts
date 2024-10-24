'use server';

import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
    brokers,
} from '@/lib/db/schema';

import {
  validatedActionWithUser,
} from '@/lib/auth/middleware';

const addBrokerAccountSchema = z.object({
  broker_name: z.string().min(1, 'Broker Name is required').max(100),
  account_number: z.string().min(1, 'Account Number is required').max(50),
});

export const addBrokerAccount = validatedActionWithUser(
  addBrokerAccountSchema,
  async (data, _, user) => {
    const { broker_name, account_number } = data;
    const email = user.email;

    const existingBroker = await db
    .select()
    .from(brokers)
    .where(and(eq(brokers.email, email),eq(brokers.broker_name, broker_name),eq(brokers.account_number, account_number)))
    .limit(1);
  
    if (existingBroker.length > 0) {
      return { error: 'This Broker and account already configured.' };
    }

    await Promise.all([
      db.insert(brokers).values({email,broker_name, account_number }),
    ]);

    return { success: 'Broker Account added successfully.' };
  }
);
