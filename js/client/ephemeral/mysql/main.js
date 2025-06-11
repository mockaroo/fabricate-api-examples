import 'dotenv/config';
import { getDatabaseByName, deleteDatabase, reactivateDatabase, createDatabase } from './ephemeral.js';
import ora from 'ora';
import { dumpStats, loadSchema } from './loadSchema.js';
import { generate } from '@fabricate-tools/client';

async function main() {
  const spinner = ora()
  let database = await getDatabaseByName(process.env.FABRICATE_DATABASE)

  if (database.status === 'Deactivated') {
    spinner.start('Activating database...')
    await reactivateDatabase(database)
    spinner.succeed('Database activated')
  }

  if (!database) {
    spinner.start('Creating database...')
    database = await createDatabase(process.env.FABRICATE_DATABASE)
    spinner.succeed('Database created')
  }

  await loadSchema(database, process.env.FABRICATE_DATABASE)

  spinner.start('Pushing data from Fabricate to database...')
  await generate({
    database: process.env.FABRICATE_DATABASE,
    workspace: process.env.FABRICATE_WORKSPACE,
    connection: {
      host: database.hostname,
      port: database.port,
      database_name: process.env.FABRICATE_DATABASE,
      username: database.databaseUserName,
      password: database.databasePassword,
      tls: false,
    },
    onProgress: ({ percentComplete, status, phase }) => {
      spinner.text = `Pushing data from Fabricate to database: ${phase ? `[${phase}] ` : ''}${percentComplete}% complete${status ? `, ${status}` : ''}...`
    },
  })
  spinner.succeed('Data pushed to database');

  await dumpStats(database, process.env.FABRICATE_DATABASE)
}

// Run the setup
main();
