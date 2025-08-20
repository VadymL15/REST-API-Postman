# CRUD on Local Server

This folder contains Postman examples for performing **CRUD** (Create, Read, Update, Delete) operations on a local server without authorization.

---

##  Contents

- `CRUD on local server.postman_collection.json` — Postman collection defining CRUD requests.
- `For local server.postman_environment.json` — Environment variables like `baseUrl`.
- `json-server` — local server.
- `README.md` — This documentation file.

---

##  Overview

Demonstrates standard RESTful operations:

- **GET** — Retrieve resource(s)
- **POST** — Create a new resource
- **PUT** / **PATCH** — Update an existing resource
- **DELETE** — Remove a resource

---

##  Prerequisites

- [Postman](https://www.postman.com/downloads/) installed.
- Local server running (e.g. Node.js/Express, JSON Server, etc.) listening on the `baseUrl` defined in Postman.

---

##  Usage Steps

1. Open Postman and import `collection.json`.
2. If there’s an `environment.json` file, import it; otherwise, manually set:
   - `{{baseUrl}}` (e.g., `http://localhost:3000`)
3. Run the requests manually:
   - **GET** `{{baseUrl}}/resources` or `{{baseUrl}}/resources/:id`
   - **POST** `{{baseUrl}}/resources`
   - **PUT** / **PATCH** `{{baseUrl}}/resources/:id`
   - **DELETE** `{{baseUrl}}/resources/:id`
4. Review the responses to confirm that each operation behaves as expected.
