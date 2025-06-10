import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadSchema(database, databaseName) {
  const spinner = ora('Connecting to database...').start()
  const { databaseUserName, databasePassword, hostname, port } = database

  let connection;

  try {
    // Create MySQL connection without database selected
    connection = await mysql.createConnection({
      host: hostname,
      user: databaseUserName,
      password: databasePassword,
      port: port,
      connectTimeout: 10000, // 10 seconds
      multipleStatements: true, // Allow multiple SQL statements
    });

    spinner.succeed('Connected to database');

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
    const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${databaseName}'
    `);

    spinner.succeed(`Schema loaded - tables: ${tables.map(table => table.TABLE_NAME).join(', ')}`)

    // // Get record counts for each table
    // for (const table of tables) {
    //   const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table.TABLE_NAME}`);
    //   console.log(`${table.TABLE_NAME}: ${rows[0].count} records`);
    // }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}