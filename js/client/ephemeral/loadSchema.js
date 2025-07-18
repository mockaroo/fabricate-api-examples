import mysql from 'mysql2/promise';
import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Runs the DDL script against an Ephemeral database to create the schema.
 * @param {Object} database - The database to load the schema into.
 * @param {string} databaseName - The name of the database.
 * @param {string} databaseType - The type of database.
 * @param {Object} spinner - The spinner to use.
 * @returns {Promise<void>}
 */
export async function loadSchema(database, databaseName, spinner) {
  spinner.start(`Connecting to Ephemeral database ${database.name}...`)

  const databaseType = database.databaseType.toLowerCase()
  const connection = await connect(database, databaseName, databaseType);

  try {
    // Create database if it doesn't exist
    if (databaseType === 'mysql') {
      spinner.text = `Creating database ${databaseName}...`;
      await connection.query(`CREATE DATABASE IF NOT EXISTS ${databaseName}`);
      await connection.query(`USE ${databaseName}`);
    } else if (databaseType === 'postgres') {
      // In postgres the database will already exists
    }

    spinner.succeed(`Connected to Ephemeral database "${databaseName}"`);

    // Read and execute the SQL DDL file
    const sqlFileName = `${databaseType}.sql`
    const sqlFilePath = join(__dirname, 'ddl', sqlFileName);
    spinner.start(`Loading schema from ${sqlFileName}...`);
    const sql = readFileSync(sqlFilePath, 'utf8');

    await connection.query(sql);

    // Get all tables in the database
    const tables = await listTables(connection, databaseName, databaseType)

    if (tables.length === 0) {
      spinner.fail(`Failed to create tables in database "${databaseName}".`)
      process.exit(1)
    }

    spinner.succeed(`Schema loaded from ${sqlFileName} - tables: ${tables.join(', ')}`)
  } finally {
    await connection.end();
  }
}

/**
 * Lists all tables in a database.
 * @param {Object} connection - The connection to the database.
 * @param {string} databaseName - The name of the database.
 * @param {string} databaseType - The type of database.
 * @returns {Promise<Array>} The list of tables.
 */
export async function listTables(connection, databaseName, databaseType) {
  let result;

  if (databaseType === 'mysql') {
    result = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${databaseName}'
    `);
    return result[0].map(table => table.TABLE_NAME);
  } else if (databaseType === 'postgres') {
    result = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_catalog = '${databaseName}'
    `);
    return result.rows.map(table => table.table_name);
  } else {
    throw new Error(`Unsupported database type: ${databaseType}`);
  }
}

/**
 * Dumps the stats for a database.
 * @param {Object} database - The database to dump the stats for.
 * @param {string} databaseName - The name of the database.
 * @param {string} databaseType - The type of database.
 * @returns {Promise<void>}
 */
export async function dumpStats(database, databaseName, databaseType) {
  console.log('')
  console.log('Table sizes')
  console.log('===========')

  const connection = await connect(database, databaseName, databaseType)

  try {
    const tables = await listTables(connection, databaseName, databaseType)

    for (const table of tables) {
      if (databaseType === 'mysql') {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`${table}: ${rows[0].count} records`);
      } else if (databaseType === 'postgres') {
        const result = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`${table}: ${result.rows[0].count} records`);
      }
    }
  } finally {
    connection.end()
  }
}

async function connect(database, databaseName, databaseType) {
  let attempt = 0;

  while (true) {
    try {
      if (databaseType === 'mysql') {
        return mysql.createConnection({
          host: database.hostname,
          user: database.databaseUserName,
          password: database.databasePassword,
          port: database.port,
          database: databaseName,
          connectTimeout: 10000, // 10 seconds
          multipleStatements: true
        });
      } else if (databaseType === 'postgres') {
        const client = new pg.Client({
          host: database.hostname,
          user: database.databaseUserName,
          password: database.databasePassword,
          port: database.port,
          database: database.databaseName,
          connectionTimeoutMillis: 10000, // 10 seconds
        });
        await client.connect();
        return client;
      } else {
        throw new Error(`Unsupported database type: ${databaseType}`);
      }
    } catch (error) {
      attempt++;

      // Check if it's a timeout error
      if (error.code === 'ETIMEDOUT' || error.code === 'TIMEOUT' || error.message.includes('timeout')) {
        console.log(`Connection timeout (attempt ${attempt}). Retrying in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        // If it's not a timeout error, throw the error
        throw error;
      }
    }
  }
}