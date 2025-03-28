// To run this script: WORKSPACE=<workspace_name> DATABASE=<database_name> node ./get-database.js

import got from "got";
import dotenv from "dotenv";

dotenv.config();

const DATABASE = process.env.DATABASE;
const WORKSPACE = process.env.WORKSPACE;
const API_URL = process.env.FABRICATE_API_URL || "https://fabricate.mockaroo.com/api/v1";

async function main() {
  try {
    const response = await got(`${API_URL}/workspaces/${WORKSPACE}/databases/${DATABASE}`, {
      responseType: "json",
      headers: { Authorization: `Bearer ${process.env.FABRICATE_API_KEY}` },
    });

    console.log(JSON.stringify(response.body, null, 2));
  } catch (error) {
    if (error.response && error.response.statusCode === 404) {
      console.error(error.response.body);
    } else {
      console.error("An error occurred:", error.message);
    }
    process.exit(1);
  }
}

main();
