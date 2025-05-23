import dotenv from 'dotenv';
import path from 'path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { client, db } from './drizzle';

dotenv.config();

async function main() {
  // Explicitly attempt to drop the drizzle.__drizzle_migrations table first
  try {
    console.log('Attempting to drop drizzle."__drizzle_migrations" table...');
    // Note: The table is in the 'drizzle' schema, not 'public'.
    await db.execute(`DROP TABLE IF EXISTS drizzle."__drizzle_migrations" CASCADE;`);
    console.log('Successfully dropped or confirmed drizzle."__drizzle_migrations" does not exist.');
  } catch (e) {
    console.error('Error dropping drizzle."__drizzle_migrations":', e);
    // We can choose to continue if it fails, as migrations might create it
  }

  // Fetch all tables in the public schema (user tables)
  const result = await db.execute(
    "SELECT table_name, table_schema, table_type FROM information_schema.tables WHERE table_schema = 'public';"
  );
  
  console.log('Raw result from information_schema.tables for public schema table dropping:', JSON.stringify(result, null, 2));
  const publicTables = Array.isArray(result) ? result as { table_name: string; table_schema: string; table_type: string }[] : [];
  
  const tablesToDrop = publicTables.filter(
    (table) => table.table_type === 'BASE TABLE'
  );

  if (tablesToDrop.length > 0) {
    console.log(`Found public tables to drop: ${tablesToDrop.map(t => t.table_name).join(', ')}`);
    for (const table of tablesToDrop) {
      const tableName = table.table_name;
      try {
        console.log(`Dropping table: public."${tableName}"`);
        await db.execute(`DROP TABLE IF EXISTS public."${tableName}" CASCADE;`);
        console.log(`Dropped table: public."${tableName}"`);
      } catch (e) {
        console.error(`Error dropping table public."${tableName}":`, e);
        throw e; 
      }
    }
    console.log('Finished dropping public tables.');
  } else {
    console.log('No BASE TABLEs found to drop in public schema.');
  }

  // Now, run migrations
  console.log('Starting migrations...');
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), '/lib/db/migrations'),
    // Optionally, explicitly set the migrations table name if different from default
    // migrationsTable: 'drizzle.__drizzle_migrations', // Default is correct
  });
  console.log('Migrations complete.');
  
  await client.end();
  console.log('Database client connection ended.');
}

main().catch(async (e) => {
  console.error("Migration script failed:", e);
  await client.end(); // Ensure client is closed on error too
  process.exit(1);
});
