import { generate } from '@fabricate-tools/client';
import 'dotenv/config';
import ora from 'ora';

/**
 * This example shows how to generate XML data using Fabricate.
 * First, copy the .env.example file to .env and fill in the values.
 * You can run this example by running `yarn start` in your terminal.
 */
async function main() {
  const spinner = ora('Generating data...').start()
  const dest = './data'

  await generate({
    workspace: process.env.FABRICATE_WORKSPACE,
    database: process.env.FABRICATE_DATABASE,
    apiUrl: process.env.FABRICATE_API_URL, // you only need to provide this if you are self-hosting
    apiKey: process.env.FABRICATE_API_KEY,
    format: 'xml',
    dest,
    overwrite: true,

    // Here is an example of how we can override the settings on fields at the time of generation
    overrides: {
      entities: {
        user: {
          fields: {
            id: {
              min: 10, // start the user id primary key at 10
            }
          }
        }
      }
    },

    onProgress: ({ percentComplete, status, phase }) => {
      spinner.text = `Fabricate: ${phase ? `[${phase}] ` : ''}${percentComplete}% complete${status ? `, ${status}` : ''}...`
    },
  });

  spinner.succeed(`Data downloaded to ${dest}`)
}

main();