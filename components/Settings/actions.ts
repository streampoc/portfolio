'use server';

import { z } from 'zod';
import { and, eq, sql,isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
    brokers,Broker
} from '@/lib/db/schema';

import {
  validatedActionWithUser,
} from '@/lib/auth/middleware';

import { getUser } from '@/lib/db/queries';

const addBrokerAccountSchema = z.object({
  broker_name: z.string().min(1, 'Broker Name is required').max(100),
  account_number: z.string().min(1, 'Account Number is required').max(50),
});

export const addBrokerAccount = validatedActionWithUser(
  addBrokerAccountSchema,
  async (data, _, user) => {
    const { broker_name, account_number } = data;
    const email = user.email;

    const [existingBroker] = await db
    .select()
    .from(brokers)
    .where(and(eq(brokers.email, email), eq(brokers.broker_name, broker_name), eq(brokers.account_number, account_number)))
    .limit(1);
  
    if (existingBroker) {
      //here we may choose to update end date instead of re-creating.
      //return { error: 'This Broker and account already configured.' };
      const result = await db
      .update(brokers)
      .set({
        deletedAt: null,
      })
      .where(eq(brokers.id, existingBroker.id)
      );
      return { success: 'Broker re-activated  successfully.' };
    }

    await Promise.all([
      db.insert(brokers).values({email,broker_name, account_number }),
    ]);

    return { success: 'Broker Account added successfully.' };
  }
);

const deleteBrokerAccountSchema = z.object({
  broker_name: z.string().min(1).max(100),
  account_number: z.string().min(1).max(50),
});

export const deleteBrokerAccount = async (data: any) => {
  try {
    const { broker_name, account_number } = data;
    
    const user = await getUser();
    if (!user) {
      throw new Error('User is not authenticated');
    }

    // First check if the broker exists and isn't already deleted
    const [existingBroker] = await db
      .select()
      .from(brokers)
      .where(
        and(
          eq(brokers.email, user.email),
          eq(brokers.broker_name, broker_name),
          eq(brokers.account_number, account_number),
          isNull(brokers.deletedAt)
        )
      )
      .limit(1);

    if (!existingBroker) {
      return { error: 'This Broker not found or already deleted.' };
    }

    // Perform the update
    const result = await db
      .update(brokers)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(brokers.id, existingBroker.id)
      );

    console.log('Broker deleted successfully.');
    return { success: 'Broker account deleted successfully.' };

  } catch (error) {
    console.error('Error deleting broker account:', error);
    return { error: 'An error occurred while deleting the broker account.' };
  }
};

