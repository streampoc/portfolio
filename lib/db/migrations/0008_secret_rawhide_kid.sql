ALTER TABLE "trades" ADD COLUMN "creation_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "updated_date" timestamp DEFAULT now();