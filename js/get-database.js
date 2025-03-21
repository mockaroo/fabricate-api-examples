// To run this script: DATABASE=<database_name> node ./get-database.js

import got from "got";
import dotenv from "dotenv";

dotenv.config();

const DATABASE = process.env.DATABASE;
const API_URL = process.env.FABRICATE_API_URL || "https://fabricate.mockaroo.com/api/v1";

async function main() {
  const response = await got(`${API_URL}/databases/${DATABASE}`, {
    responseType: "json",
    headers: { Authorization: `Bearer ${process.env.FABRICATE_API_KEY}` },
  });

  console.log(JSON.stringify(response.body, null, 2));
}

main();
