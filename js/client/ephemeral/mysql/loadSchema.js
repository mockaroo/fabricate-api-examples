import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadSchema(database, databaseName) {
  const spinner = ora('Connecting to database...').start()
  const connection = await connect(database);
  spinner.succeed('Connected to database');

  try {
    // Create database if it doesn't exist
    spinner.start(`Creating database ${databaseName}...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${databaseName}`);
    await connection.query(`USE ${databaseName}`);
    spinner.succeed(`Database ${databaseName} created`);

    // Read and execute the SQL DDL file
    spinner.start('Loading schema...');
    const sqlFile = join(__dirname, 'ecommerce.sql');
    const sql = readFileSync(sqlFile, 'utf8');
    await connection.query(sql);

    // Get all tables in the database
    const tables = await listTables(connection, databaseName)

    spinner.succeed(`Schema loaded - tables: ${tables.join(', ')}`)
  } finally {
    await connection.end();
  }
}

export async function listTables(connection, databaseName) {
  const result = await connection.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = '${databaseName}'
  `)

  return result[0].map(table => table.TABLE_NAME)
}

export async function dumpStats(database, databaseName) {
  console.log('')
  console.log('Table sizes')
  console.log('===========')

  const connection = await connect(database, databaseName)

  try {
    const tables = await listTables(connection, databaseName)

    for (const table of tables) {
      const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}: ${rows[0].count} records`);
    }
  } finally {
    connection.end()
  }
}

function connect(database, databaseName) {
  return mysql.createConnection({
    host: database.hostname,
    user: database.databaseUserName,
    password: database.databasePassword,
    port: database.port,
    database: databaseName,
    connectTimeout: 10000, // 10 seconds
    multipleStatements: true
  })
}