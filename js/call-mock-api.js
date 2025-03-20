// To run this script: node WORKSPACE=<workspace name> DATABASE=<database name> URL_PATH=<path to mock API route> ./call-mock-api.js
import got from "got";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.FABRICATE_API_URL;
const API_KEY = process.env.FABRICATE_API_KEY;
const WORKSPACE = process.env.WORKSPACE;
const DATABASE = process.env.DATABASE;
const URL_PATH = process.env.URL_PATH;

async function main() {
  try {
    const response = await got.get(`${API_URL}/workspaces/${WORKSPACE}/databases/${DATABASE}/api${URL_PATH}`, {
      responseType: "json",
      headers: { Authorization: `Bearer ${API_KEY}` },
      retry: { limit: 0 },
    });

    console.log(response.body);
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
