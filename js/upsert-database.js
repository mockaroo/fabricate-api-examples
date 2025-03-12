// To run this script: node ./upsert-database.js

import got from "got";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.FABRICATE_API_URL || "https://fabricate.mockaroo.com/api/v1";

async function main() {
  const database = {
    name: "CREATED_FROM_API",
    platform: "postgres",
    entities: [
      {
        name: "users",
        record_count: "100",
        records: "exact",
        fields: [
          { name: "id", data_type: "integer", generator: "Number", distribution: "autoincrement" },
          { name: "email", data_type: "varchar", generator: "Email Address" },
          { name: "first_name", data_type: "varchar", generator: "First Name" },
          { name: "last_name", data_type: "varchar", generator: "Last Name" },
          { name: "created_at", data_type: "datetime", generator: "Datetime", start_date: "2024-01-01", end_date: "2025-01-01", distribution: "uniform" },
          {
            name: "updated_at",
            data_type: "datetime",
            generator: "Datetime",
            date_type: "relative",
            date_relative_to_field: "created_at",
            date_unit: "days",
            date_operator: "+",
            distribution: "uniform",
            min: 1,
            max: 10,
          },
        ],
      },
      {
        name: "posts",
        record_count: "100",
        records: "exact",
        fields: [
          { name: "id", data_type: "integer", generator: "Number", distribution: "autoincrement" },
          { name: "user_id", data_type: "integer", generator: "Foreign Key", primary_key_entity: "users", primary_key_field: "id", distribution: "uniform", min: 1, max: 3 },
          { name: "title", data_type: "varchar", generator: "Lorem Ipsum", lorem_ipsum_unit: "words", min: 5, max: 10, distribution: "uniform" },
          { name: "body", data_type: "text", generator: "Lorem Ipsum", lorem_ipsum_unit: "paragraphs", min: 1, max: 3, distribution: "uniform" },
          { name: "created_at", data_type: "datetime", generator: "Datetime", start_date: "2024-01-01", end_date: "2025-01-01", distribution: "uniform" },
        ],
      },
    ],
  };

  try {
    const response = await got(`${API_URL}/databases`, {
      method: "POST",
      responseType: "json",
      headers: { Authorization: `Bearer ${process.env.FABRICATE_API_KEY}` },
      json: database,
    });

    console.log(JSON.stringify(response.body, null, 2));
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
