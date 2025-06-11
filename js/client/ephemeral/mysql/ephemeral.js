import fetch from 'node-fetch';
import ora from 'ora'

export const TONIC_API_URL = 'https://ephemeral.tonic.ai/api';

export async function deleteDatabase(database) {
  const spinner = ora(`Deleting database ${database.name} (${database.databaseEntityId})...`).start()
  await callEphemeralApi('DELETE', `/database/${database.databaseEntityId}`)
  spinner.succeed('Database deleted')
}

export async function createDatabase(name) {
  try {
    const spinner = ora('Creating database...').start()
    const id = await callEphemeralApi('POST', '/database', {
      "name": name,
      // MySQL
      "baseImageId": "cbfcadb4-0c7f-46c3-af3d-e49f6d5beee7",
      "storageSizeInGigabytes": 5,
      "databaseName": name,
      "databaseUser": "ecommerce",
      "expiry": {
        "expiryType": "Inactivity",
        "durationEnd": {
          "minutesFromStartToExpiry": 0,
          "minutesFromLastActivityToExpiry": 180
        },
      },
    });

    spinner.succeed(`Database created: ID=${id}`)

    return await waitForPendingTasks(id)
  } catch (error) {
    console.error('Error creating ephemeral database:', error);
    throw error;
  }
}

async function waitForPendingTasks(databaseId) {
  const spinner = ora('Waiting for database tasks to complete...').start()

  while (true) {
    const database = await callEphemeralApi('GET', `/database/${databaseId}`)
    const { pendingTasks } = database

    if (pendingTasks.length === 0) {
      spinner.succeed('Database tasks completed')
      return database
    }

    await new Promise(resolve => setTimeout(resolve, 1000))
    spinner.text = `Waiting for ${pendingTasks.length} ${pendingTasks.length === 1 ? 'task' : 'tasks'} to complete...`
  }
}

export async function listDatabases() {
  try {
    return await callEphemeralApi('GET', '/database')
  } catch (error) {
    console.error('Error listing databases:', error);
    throw error;
  }
}

export async function getDatabaseByName(name) {
  try {
    const { records } = await callEphemeralApi('GET', `/database?filters[name]=${encodeURIComponent(name)}`)
    return records[0];
  } catch (error) {
    console.error('Error listing databases:', error);
    throw error;
  }
}

export async function reactivateDatabase(database) {
  await callEphemeralApi('POST', `/database/${database.databaseEntityId}/reactivate`)
  await waitForPendingTasks(database.databaseEntityId)
}

export async function listImageTypes() {
  return await callEphemeralApi('GET', '/database/images')
}

export async function callEphemeralApi(method, path, body) {
  const response = await fetch(`${TONIC_API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': body ? 'application/json' : undefined,
      'Authorization': `ApiKey ${process.env.EPHEMERAL_API_KEY}`
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new Error(`Failed to call Ephemeral API: ${response.statusText} ${await response.text()}`)
  }

  try {
    return await response.json()
  } catch (error) {
    return undefined
  }
}
