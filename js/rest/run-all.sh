echo "\n> Upserting database...\n"
WORKSPACE=Fabricate node ./upsert-database.js && \
echo "\n> Updating source data...\n"
WORKSPACE=Fabricate DATABASE=CREATED_FROM_API ENTITY=imported FILE=./data/users.csv node ./update-source-data.js && \
echo "\n> Generating data...\n"
WORKSPACE=Fabricate DATABASE=CREATED_FROM_API FORMAT=csv node ./generate-data.js && \
echo "\n> Listing databases...\n"
WORKSPACE=Fabricate node ./list-databases.js && \
echo "\n> Getting database...\n"
WORKSPACE=Fabricate DATABASE=CREATED_FROM_API node ./get-database.js && \
echo "\n> Deleting database...\n"
WORKSPACE=Fabricate DATABASE=CREATED_FROM_API node ./delete-database.js && \
echo "\n> Calling mock API...\n"
WORKSPACE=Fabricate DATABASE=oracle URL_PATH=/users node ./call-mock-api.js
