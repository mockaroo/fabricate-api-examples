// To run this script: node ./list-databases.js

import got from "got";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.FABRICATE_API_URL || "https://fabricate.mockaroo.com/api/v1";

async function main() {
  const response = await got(`${API_URL}/databases`, {
    responseType: "json",
    headers: { Authorization: `Bearer ${process.env.FABRICATE_API_KEY}` },
  });

  console.log(response.body);
}

main();
