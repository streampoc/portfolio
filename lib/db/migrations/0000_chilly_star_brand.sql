CREATE TABLE IF NOT EXISTS "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_type" text,
	"open_date" timestamp,
	"close_date" timestamp,
	"symbol" text,
	"underlying_symbol" text,
	"quantity" numeric,
	"open_price" numeric,
	"close_price" numeric,
	"buy_value" numeric,
	"sell_value" numeric,
	"profit_loss" numeric,
	"is_closed" boolean,
	"commissions" numeric,
	"fees" numeric,
	"open_year" integer,
	"close_year" integer,
	"open_month" integer,
	"close_month" integer,
	"open_week" text,
	"close_week" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
