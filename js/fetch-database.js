import got from "got";
import dotenv from "dotenv";

dotenv.config();

const DATABASE = process.env.DATABASE;

async function main() {
  const response = await got(`https://fabricate.mockaroo.com/api/v1/databases/${DATABASE}`, {
    responseType: "json",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.FABRICATE_API_KEY}`,
    },
  });

  console.log(response.body);
}

main();
