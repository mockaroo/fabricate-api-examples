// To run this script: WORKSPACE=<workspace_name> node ./upsert-database.js

import got from "got";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.FABRICATE_API_URL || "https://fabricate.mockaroo.com/api/v1";
const WORKSPACE = process.env.WORKSPACE;

async function main() {
  const database = {
    name: "CREATED_FROM_API",
    platform: "postgres",
    entities: [
      {
        name: "imported",
        source: {
          data: "id,first_name,last_name,email,gender,ip_address\n20,Babara,Hardaway,bhardawayj@oakley.com,Female,47.153.69.170\n21,Alard,Crumb,acrumbk@360.cn,Male,219.36.193.101\n22,Joeann,Masdon,jmasdonl@google.de,Female,144.79.10.69\n23,Boote,Togwell,btogwellm@ebay.com,Agender,82.51.80.14\n24,Shani,Wale,swalen@myspace.com,Genderqueer,15.10.165.131\n25,Bennett,Pomphrett,bpomphretto@eventbrite.com,Male,60.170.162.118\n26,Farleigh,Cockland,fcocklandp@sciencedirect.com,Male,74.76.89.105\n27,Jaimie,Breach,jbreachq@squidoo.com,Male,167.230.194.96\n28,Nappie,Bollon,nbollonr@aboutads.info,Male,160.195.33.41\n29,Felice,Kornalik,fkornaliks@wordpress.org,Male,255.47.181.11\n30,Giordano,Happer,ghappert@dailymotion.com,Male,15.72.50.224\n",
          filename: "users.csv"
        },
        fields: [
          { name: "id", generator: "Source File", source_column: "id" },
          { name: "first_name", generator: "Source File", source_column: "first_name" },
          { name: "last_name", generator: "Source File", source_column: "last_name" },
          { name: "email", generator: "Source File", source_column: "email" },
          { name: "gender", generator: "Source File", source_column: "gender" },
          { name: "ip_address", generator: "Source File", source_column: "ip_address" },
        ]
      },
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
    const response = await got(`${API_URL}/workspaces/${WORKSPACE}/databases`, {
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
