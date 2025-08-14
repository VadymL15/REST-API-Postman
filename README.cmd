API Tests with Postman

This repository contains Postman API tests for the JSONPlaceholder demo API, using both manual execution and automated runs with the Collection Runner.

Contents

collection.json — The exported Postman collection with prepared requests and tests.

data.csv — A set of IDs used for GET requests via the Collection Runner.

README.md — Instructions for running the tests.

Running in Postman

Import the collection

Open Postman → Import → Select collection.json.

Prepare variables

The requests use the variable {{id}} for path parameters.

Run with Data File

Open Collection Runner.

Select data.csv as the Data File.

Run the collection — {{id}} will be replaced with values from the file.

Test logic

For IDs 1, 2, 3: Expect HTTP status 200.

For all other IDs: Expect HTTP status 404.
