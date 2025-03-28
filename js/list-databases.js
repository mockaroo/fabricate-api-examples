// To run this script: WORKSPACE=<workspace_name> node ./list-databases.js

import got from "got";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.FABRICATE_API_URL || "https://fabricate.mockaroo.com/api/v1";
const WORKSPACE = process.env.WORKSPACE;

async function main() {
  try {
    const response = await got(`${API_URL}/workspaces/${WORKSPACE}/databases`, {
      responseType: "json",
      headers: { Authorization: `Bearer ${process.env.FABRICATE_API_KEY}` },
    });

    console.log(JSON.stringify(response.body, null, 2));
  } catch (error) {
    console.error("An error occurred:", error.message);
    process.exit(1);
  }
}

main();
