CREATE TABLE IF NOT EXISTS "brokers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"broker_name" varchar(100) NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "brokers_email_unique" UNIQUE("email")
);
