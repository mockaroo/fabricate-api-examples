import dotenv from "dotenv";
import { createReadStream, createWriteStream, unlinkSync } from "fs";
import got from "got";
import unzipper from "unzipper";

dotenv.config();

const API_URL = "https://fabricate.mockaroo.com/api/v1";
const DATABASE = process.env.DATABASE;
const FORMAT = process.env.FORMAT || "csv";

/**
 * Generates data for a given database and downloads the data as CSV.
 * @returns {Promise<void>}
 */
async function main() {
  const res = await got.post(`${API_URL}/generate_tasks`, {
    responseType: "json",
    json: { format: FORMAT, database: DATABASE },
    headers: { Authorization: `Bearer ${process.env.FABRICATE_API_KEY}` },
  });

  const task = res.body;

  if (task.error) {
    throw new Error(task.error);
  }

  console.log(`Started generating data for database ${DATABASE}... task id: ${task.id}`);
  const { data_url } = await poll(task.id);

  console.log(`Downloading data from ${data_url}...`);
  await download(data_url, "./data.zip");

  console.log("Unzipping data...");
  await unzip("./data.zip", "./data");

  console.log("Data has been downloaded and extracted to data.csv.");
  unlinkSync("./data.zip");
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
  return new Promise((resolve, reject) => {
    const out = createWriteStream(path);
    got.stream(url).pipe(out);
    out.on("finish", resolve);
    out.on("error", reject);
  });
}

main();
