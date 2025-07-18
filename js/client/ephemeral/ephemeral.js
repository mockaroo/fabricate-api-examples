import fetch from 'node-fetch';

export const TONIC_API_URL = 'https://ephemeral.tonic.ai/api';

const IMAGES = {
  postgres: 'Postgres 17',
  mysql: 'MySql 8.4',
}

/**
 * Deletes a database from Ephemeral.
 * @param {Object} database - The database to delete.
 * @param {Object} spinner - The spinner to use.
 * @returns {Promise<void>}
 */
export async function deleteDatabase(database, spinner) {
  spinner.start(`Deleting database ${database.name} (${database.databaseEntityId})...`)
  await callEphemeralApi('DELETE', `/database/${database.databaseEntityId}`)
  spinner.succeed('Database deleted')
}

/**
 * Creates a database in Ephemeral.
 * @param {string} name - The name of the database.
 * @param {string} databaseType - The type of database to create.
 * @param {Object} spinner - The spinner to use.
 * @returns {Promise<Object>} The created database.
 */
export async function createDatabase(name, databaseType, spinner) {
  try {
    const baseImageName = IMAGES[databaseType]
    const baseImageId = await getBaseImageId(baseImageName, spinner)

    spinner.start(`Creating ${baseImageName} database in Ephemeral...`)

    const id = await callEphemeralApi('POST', '/database', {
      name,
      baseImageId,
      storageSizeInGigabytes: 5,
      databaseName: name,
      databaseUser: "ecommerce",
      expiry: {
        expiryType: "Inactivity",
        durationEnd: {
          minutesFromStartToExpiry: 0,
          minutesFromLastActivityToExpiry: 60
        },
      },
    });

    spinner.succeed(`Database created: ID=${id}`)
    return await waitForDatabaseToBeReady(id, spinner)
  } catch (error) {
    spinner.fail(`Error creating ephemeral database: ${error.message}`)
    process.exit(1)
  }
}

async function getBaseImageId(name, spinner) {
  spinner.text = `Getting base image ID for ${name}...`
  const imageTypes = await listImageTypes()
  const imageType = imageTypes.find(imageType => imageType.name === name)

  if (!imageType) {
    spinner.fail(`Error: Base image type "${name}" not found. Available image types: ${imageTypes.map(imageType => imageType.name).join(', ')}`)
    process.exit(1)
  }

  return imageType.baseImageId
}

/**
 * Waits for a database to be ready (status = "Running").
 * @param {string} databaseId - The ID of the database.
 * @param {Object} spinner - The spinner to use.
 * @returns {Promise<Object>} The database.
 */
async function waitForDatabaseToBeReady(databaseId, spinner) {
  spinner.start(`Waiting for Ephemeral database ID=${databaseId} to be ready...`)

  while (true) {
    const database = await callEphemeralApi('GET', `/database/${databaseId}`)

    if (database.status === 'Running') {
      spinner.succeed('Database ready to receive connections')
      return database
    }

    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

/**
 * Lists all databases in Ephemeral.
 * @returns {Promise<Array>} The list of databases.
 */
export async function listDatabases() {
  try {
    return await callEphemeralApi('GET', '/database')
  } catch (error) {
    console.error('Error listing databases:', error);
    throw error;
  }
}

/**
 * Gets a database by name from Ephemeral.
 * @param {string} name - The name of the database.
 * @returns {Promise<Object>} The database.
 */
export async function getDatabaseByName(name) {
  try {
    const { records } = await callEphemeralApi('GET', `/database?filters[name]=${encodeURIComponent(name)}`)
    return records[0];
  } catch (error) {
    console.error('Error listing databases:', error);
    throw error;
  }
}

/**
 * Reactivates a database in Ephemeral.
 * @param {Object} database - The database to reactivate.
 * @returns {Promise<void>}
 */
export async function reactivateDatabase(database, spinner) {
  await callEphemeralApi('POST', `/database/${database.databaseEntityId}/reactivate`)
  await waitForDatabaseToBeReady(database.databaseEntityId, spinner)
}

/**
 * Lists all image types in Ephemeral.
 * @returns {Promise<Array>} The list of image types.
 */
export async function listImageTypes() {
  return await callEphemeralApi('GET', '/database/images')
}

/**
 * Calls the Ephemeral API.
 * @param {string} method - The HTTP method to use.
 * @param {string} path - The path to call.
 * @param {Object} body - The body of the request.
 * @returns {Promise<Object>} The response.
 */
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
