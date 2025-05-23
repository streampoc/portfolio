import {
    pgTable,
    serial,
    varchar,
    text,
    timestamp,
    integer,
    decimal,
    boolean,
    unique,
  } from 'drizzle-orm/pg-core';
  import { relations,sql } from 'drizzle-orm';

  
  export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: varchar('role', { length: 20 }).notNull().default('member'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  });

  export const brokers = pgTable('brokers', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    broker_name: varchar('broker_name', { length: 100 }).notNull(),
    account_number: varchar('account_number', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  }, (table) => ({
    uniqueConstraint: unique('broker_unique_constraint').on(
      table.email, 
      table.broker_name, 
      table.account_number
    )
  }));

  export const trades = pgTable('trades', {
    id: serial('id').primaryKey(),
    user_id: integer('user_id').notNull(),
    account: text('account'),
    transaction_type: text('transaction_type'),
    open_date: timestamp('open_date'),
    close_date: timestamp('close_date'),
    symbol: text('symbol'),
    underlying_symbol: text('underlying_symbol'),
    quantity: decimal('quantity'),
    open_price: decimal('open_price'),
    close_price: decimal('close_price'),
    buy_value: decimal('buy_value'),
    sell_value: decimal('sell_value'),
    profit_loss: decimal('profit_loss'),
    is_closed: boolean('is_closed'),
    commissions: decimal('commissions'),
    fees: decimal('fees'),
    open_year: integer('open_year'),
    close_year: integer('close_year'),
    open_month: integer('open_month'),
    close_month: integer('close_month'),
    open_week: text('open_week'),
    close_week: text('close_week'),
    creation_date : timestamp('creation_date').default(sql`now()`),
    updated_date : timestamp('updated_date').default(sql`now()`),
  });

  export type User = typeof users.$inferSelect;
  export type NewUser = typeof users.$inferInsert;
  export type Broker = typeof brokers.$inferSelect;

  export enum ActivityType {
    SIGN_UP = 'SIGN_UP',
    SIGN_IN = 'SIGN_IN',
    SIGN_OUT = 'SIGN_OUT',
    UPDATE_PASSWORD = 'UPDATE_PASSWORD',
    DELETE_ACCOUNT = 'DELETE_ACCOUNT',
    UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  }
