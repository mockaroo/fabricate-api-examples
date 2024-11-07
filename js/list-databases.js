import got from "got";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const response = await got("https://fabricate.mockaroo.com/api/v1/databases", {
    responseType: "json",
    headers: { Authorization: `Bearer ${process.env.FABRICATE_API_KEY}` },
  });

  console.log(response.body);
}

main();
