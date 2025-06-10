import { generate } from '@fabricate-tools/client'
import dotenv from 'dotenv'
import path from 'path'
import axios from 'axios'
import ora from 'ora'
import { createReadStream, readdirSync } from 'fs'
import FormData from 'form-data'

dotenv.config()

console.log('starting...')

const dest = './tmp/ecommerce'
const databricksInstance = process.env.DATABRICKS_INSTANCE;
const token = process.env.DATABRICKS_TOKEN;
const catalog = process.env.DATABRICKS_CATALOG;
const schema = process.env.DATABRICKS_SCHEMA;

// await generate({
//   database: process.env.FABRICATE_DATABASE,
//   workspace: process.env.FABRICATE_WORKSPACE,
//   format: 'csv',
//   dest,
//   overwrite: true,
//   apiUrl: process.env.FABRICATE_API_URL,
//   onProgress: ({ percentComplete, status, phase }) => {
//     console.log(`${phase ? `[${phase}] ` : ''}${percentComplete}% complete${status ? `, ${status}` : ''}...`)
//   },
//   // Uncomment to generate a single table
//   // entity: 'Customers',
// })

async function uploadFileToDatabricks(file) {
  const fileName = file.split('/').pop()
  const filePath = `/FileStore/${fileName}.csv`
  const spinner = ora(`Uploading ${fileName} to Databricks`).start()

  const form = new FormData();
  form.append('path', filePath);
  form.append('overwrite', 'true');
  form.append('contents', createReadStream(file));

  try {
    const response = await axios.post(`${databricksInstance}/api/2.0/dbfs/put`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });

    spinner.succeed(`Successfully uploaded ${fileName} to Databricks`)
  } catch (error) {
    spinner.fail(`Failed to upload ${fileName}: ${error.message}`)
    throw error
  }
}

async function createDatabricksTable(file) {
  const tableName = file.split('/').pop().split('.').shift()
  const spinner = ora(`Creating table ${tableName}`).start()

  try {
    await uploadFileToDatabricks(file)

    const sqlStatement = `
      CREATE TABLE ${catalog}.${schema}.${tableName}
      USING CSV
      OPTIONS (
        path "/FileStore/${tableName}.csv",
        header "true",
        inferSchema "true"
      )
    `;

    const response = await axios.post(`${databricksInstance}/api/2.0/sql/statements`, {
      statement: sqlStatement,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    spinner.succeed(`Successfully created table ${tableName}`)
  } catch (error) {
    console.log(error.response.data)
    spinner.fail(`Failed to create table ${tableName}: ${error.message}`)
    throw error
  }
}

// Process all generated files
const files = readdirSync(dest)
const mainSpinner = ora('Processing files').start()

try {
  for (const file of files) {
    if (file.endsWith('.csv')) {
      const filePath = path.join(dest, file)
      await createDatabricksTable(filePath)
    }
  }
  mainSpinner.succeed('All files processed successfully')
} catch (error) {
  mainSpinner.fail('Failed to process all files')
  process.exit(1)
}

console.log('done.')
