import "dotenv/config";
import { Client } from "pg";

/**
 * Crée la base de données cible si elle n'existe pas encore.
 *
 * PostgreSQL ne supporte pas `CREATE DATABASE IF NOT EXISTS`, et une migration
 * Drizzle s'exécute toujours DANS une base déjà connectée — elle ne peut donc
 * pas créer la base elle-même. Ce script se connecte à la base de maintenance
 * `postgres`, vérifie `pg_database`, puis crée la base si nécessaire.
 *
 * À lancer avant `drizzle-kit migrate` (voir le script `db:sync`).
 */
async function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not defined");
    process.exit(1);
  }

  const url = new URL(databaseUrl);
  // Nom de la base cible (ex: "db-open-mdm"), sans le "/" initial.
  const targetDb = decodeURIComponent(url.pathname.replace(/^\//, ""));

  if (!targetDb) {
    console.error("❌ No database name found in DATABASE_URL");
    process.exit(1);
  }

  // On se connecte à la base de maintenance "postgres" pour pouvoir
  // exécuter le CREATE DATABASE.
  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = "/postgres";

  const client = new Client({ connectionString: adminUrl.toString() });

  try {
    await client.connect();

    const { rowCount } = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDb]
    );

    if (rowCount && rowCount > 0) {
      console.log(`✅ Database "${targetDb}" already exists, skipping creation`);
      return;
    }

    // L'identifiant ne peut pas être paramétré : on l'échappe en doublant
    // les guillemets pour neutraliser toute injection via le nom de base.
    const safeName = `"${targetDb.replace(/"/g, '""')}"`;
    await client.query(`CREATE DATABASE ${safeName}`);

    console.log(`✅ Database "${targetDb}" created successfully`);
  } catch (error) {
    console.error("❌ Failed to create database:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
