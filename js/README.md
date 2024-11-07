# Fabricate API JavaScript Examples

## Prerequisites

- Node.js v20 or later
- A Fabricate API key

## Setup

Install dependencies

```bash
npm install
```

Set your API key:

```bash
echo "FABRICATE_API_KEY=<your_api_key>" >> .env
```

## List Databases

To list all available databases, run the following command:

```bash
node ./list-databases.js
```

## Fetch Database

To fetch a database, run the following command:

```bash
DATABASE=<database_name> node ./fetch-database.js
```

Replace `<database_name>` with the name of the database you want to fetch.

## Generate Data

To generate data, run the following command:

```bash
DATABASE=<database_name> FORMAT=<format> node ./generate-data.js
```

Replace `<database_name>` with the name of the database you want to generate data for, and `<format>` with the format you want the data to be generated in (e.g. `csv`, `sql`, etc...).
