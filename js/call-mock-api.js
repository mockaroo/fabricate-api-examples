import got from "got";

const API_URL = process.env.FABRICATE_API_URL;
const API_KEY = process.env.FABRICATE_API_KEY;
const DATABASE = process.env.DATABASE;

async function main() {
  try {
    const response = await got.get(`${API_URL}/databases/${DATABASE}/api/customers/1`, {
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
