// To run this script: DATABASE=<database_name> node ./fetch-database.js

import got from "got";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.FABRICATE_API_URL || "https://fabricate.mockaroo.com/api/v1";

async function main() {
  const response = await got(`${API_URL}/databases`, {
    method: "POST",
    responseType: "json",
    headers: { Authorization: `Bearer ${process.env.FABRICATE_API_KEY}` },
    json: {
      name: "CREATED_FROM_API",
      platform: "postgres",
      entities: [
        {
          name: "users",
          record_count_expression: "100",
          records: "exact",
          fields: [
            { name: "id", data_type: "integer", generator: "Number", distribution: "autoincrement" },
            { name: "email", data_type: "varchar", generator: "Email Address" },
            { name: "first_name", data_type: "varchar", generator: "First Name" },
            { name: "last_name", data_type: "varchar", generator: "Last Name" },
            { name: "created_at", data_type: "datetime", generator: "Datetime", start_date: "2024-01-01", end_date: "2025-01-01" },
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
      ],
    },
  });

  console.log(JSON.stringify(response.body, null, 2));
}

main();
