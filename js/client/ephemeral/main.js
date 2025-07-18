import 'dotenv/config';
import { getDatabaseByName, reactivateDatabase, createDatabase } from './ephemeral.js';
import ora from 'ora';
import { dumpStats, loadSchema } from './loadSchema.js';
import { generate } from '@fabricate-tools/client';

const databaseName = process.env.FABRICATE_DATABASE
const workspaceName = process.env.FABRICATE_WORKSPACE
const databaseType = process.env.DATABASE_TYPE

/**
 * In this example we:
 * 1.) Create a new Ephemeral database
 * 2.) Load the schema from the DDL file
 * 3.) Push the data from Fabricate to the Ephemeral database
 */
async function main() {
  const spinner = ora()
  const ephemeralDatabaseName = databaseName

  // First we check if database exists in Ephemeral and if it is deactivated, we reactivate it
  spinner.start(`Checking if database "${ephemeralDatabaseName}" exists in Ephemeral...`)
  let database = await getDatabaseByName(ephemeralDatabaseName)

  // If the Ephemeral database doesn't exist, we create it.
  if (!database) {
    database = await createDatabase(ephemeralDatabaseName, databaseType, spinner)
  }

  if (database?.status !== 'Running') {
    await reactivateDatabase(database, spinner)
  }

  // Then we create all of the tables
  await loadSchema(database, ephemeralDatabaseName, spinner)

  // Then we generate the data from our Fabricate database and push it to the Ephemeral database
  spinner.start('Pushing data from Fabricate to Ephemeral...')

  await generate({
    database: databaseName,
    workspace: workspaceName,
    connection: {
      host: database.hostname,
      port: database.port,
      database_name: ephemeralDatabaseName,
      username: database.databaseUserName,
      password: database.databasePassword,
      tls: false,
    },
    onProgress: ({ percentComplete, status, phase }) => {
      spinner.text = `Pushing data from Fabricate to Ephemeral: ${phase ? `[${phase}] ` : ''}${percentComplete}% complete${status ? `, ${status}` : ''}...`
    },
  })

  spinner.succeed('Data successfully pushed to Ephemeral.');

  await dumpStats(database, ephemeralDatabaseName, databaseType)
}

main();
