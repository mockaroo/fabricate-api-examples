// To run this script: DATABASE=<database_name> node ./fetch-database.js

import got from "got";
import dotenv from "dotenv";

dotenv.config();

const DATABASE = process.env.DATABASE;
const WORKSPACE = process.env.WORKSPACE;
const API_URL = process.env.FABRICATE_API_URL || "https://fabricate.mockaroo.com/api/v1";

async function main() {
  try {
    await got(`${API_URL}/workspaces/${WORKSPACE}/databases/${DATABASE}`, {
      method: "DELETE",
      responseType: "json",
      headers: { Authorization: `Bearer ${process.env.FABRICATE_API_KEY}` },
    });

    console.log("Database deleted.");
  } catch (error) {
    if (error.response?.statusCode === 404) {
      console.log(`Database "${DATABASE}" not found.`);
    } else {
      console.error("Error deleting database:", error.message);
    }
    process.exit(1);
  }
}

main();
