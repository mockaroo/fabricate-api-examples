// To run this script: DATABASE=<database_name> ENTITY=<entity_name> FILE=<file_path> node ./update-source-data.js

import got from "got";
import fs from "fs";
import FormData from "form-data";

const API_URL = process.env.FABRICATE_API_URL;
const API_KEY = process.env.FABRICATE_API_KEY;
const DATABASE = process.env.DATABASE;
const ENTITY = process.env.ENTITY;
const FILE = process.env.FILE;

async function main() {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(FILE));

    await got(`${API_URL}/databases/${DATABASE}/entities/${ENTITY}/source`, {
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
