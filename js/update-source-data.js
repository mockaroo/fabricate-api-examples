// To run this script: WORKSPACE=<workspace_name> DATABASE=<database_name> ENTITY=<entity_name> FILE=<file_path> node ./update-source-data.js

import got from "got";
import fs from "fs";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.FABRICATE_API_URL || "https://fabricate.mockaroo.com/api/v1";
const API_KEY = process.env.FABRICATE_API_KEY;
const DATABASE = process.env.DATABASE;
const WORKSPACE = process.env.WORKSPACE;
const ENTITY = process.env.ENTITY;
const FILE = process.env.FILE;

async function main() {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(FILE));

    await got(`${API_URL}/workspaces/${WORKSPACE}/databases/${DATABASE}/entities/${ENTITY}/source`, {
      method: "POST",
      responseType: "json",
      headers: { Authorization: `Bearer ${API_KEY}` },
      body: form,
    });

    console.log(`Successfully updated source data for table "${ENTITY}" in database "${DATABASE}"`);
  } catch (error) {
    if (error.response?.body) {
      console.error(`Error: ${JSON.stringify(error.response?.body, null, 2)}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

main();
