// To run this script: DATABASE=<database_name> ENTITY=<optional_entity_name> FORMAT=<format> node ./generate-data.js

import dotenv from "dotenv";
import { createReadStream, createWriteStream, existsSync, mkdirSync, rmSync } from "fs";
import got from "got";
import unzipper from "unzipper";

dotenv.config();

const API_URL = process.env.FABRICATE_API_URL || "https://fabricate.mockaroo.com/api/v1";
const DATABASE = process.env.DATABASE;
const FORMAT = process.env.FORMAT || "csv";
const ENTITY = process.env.ENTITY;

console.log(`Generating data for ${ENTITY ? `table ${ENTITY} of ` : ""}database ${DATABASE} in ${FORMAT} format using ${API_URL}...`);

/**
 * Generates data for a given database and downloads the data as CSV.
 * @returns {Promise<void>}
 */
async function main() {
  try {
    const res = await got.post(`${API_URL}/generate_tasks`, {
      responseType: "json",
      headers: { Authorization: `Bearer ${process.env.FABRICATE_API_KEY}` },
      json: {
        format: FORMAT,
        database: DATABASE,
        entity: ENTITY,
        overrides: {
          entities: {
            users: {
              record_count: 5,
              fields: {
                id: {
                  min: 1000,
                },
              },
            },
          },
        },
      },
    });

    const task = res.body;

    if (task.error) {
      throw new Error(task.error);
    }

    console.log(`Started generating data for database ${DATABASE}... task id: ${task.id}`);
    const { data_url, error } = await poll(task.id);

    if (error) {
      console.error("Fabricate API returned an error: " + error);
      process.exit(1);
    }

    console.log(`Downloading data from ${data_url}...`);
    let dest = ENTITY ? `./data/${ENTITY}.${FORMAT}` : "data.zip"; // When no entity is specified, the data is delivered as a zip file.
    await download(data_url, dest);

    if (ENTITY == null) {
      console.log("Unzipping data...");
      await unzip("./data.zip", "./data");
      rmSync("./data.zip");
      dest = "./data";
    }

    console.log(`Data has been downloaded and extracted to ${dest}.`);
  } catch (error) {
    console.error("Error:", error.response?.body || error.message);
    process.exit(1);
  }
}

/**
 * Polls the generate task API until the task is completed.
 * @param {string} id - The ID of the task to poll.
 * @returns {Promise<object>} - The task object.
 */
async function poll(id) {
  while (true) {
    const res = await got(`${API_URL}/generate_tasks/${id}`, {
      responseType: "json",
      headers: {
        Authorization: `Bearer ${process.env.FABRICATE_API_KEY}`,
      },
    });

    const task = res.body;

    if (task.completed) {
      return task;
    } else if (task.error) {
      throw new Error(task.error);
    } else {
      console.log(`Waiting for ${id} to complete... ${task.progress}%`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Unzips a file to a target directory.
 * @param {string} path - The path to the zip file.
 * @param {string} target - The target directory.
 * @returns {Promise<void>}
 */
function unzip(path, target) {
  return new Promise((resolve, reject) => {
    createReadStream(path)
      .pipe(unzipper.Extract({ path: target }))
      .on("close", resolve)
      .on("error", reject);
  });
}

/**
 * Downloads a file from a URL and saves it to a path.
 * @param {string} url - The URL to download from.
 * @param {string} path - The path to save the file to.
 * @returns {Promise<void>}
 */
function download(url, path) {
  // ensure the directory exists
  const dir = path.split("/").slice(0, -1).join("/");

  if (dir.length > 0) {
    // delete the directory if it exists
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true });
    }

    mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const out = createWriteStream(path);
    got.stream(url).pipe(out);
    out.on("finish", resolve);
    out.on("error", reject);
  });
}

main();
