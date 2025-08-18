# REST API Testing with Postman

This repository contains examples of REST API testing using **Postman** and **Newman**.  
It demonstrates manual execution, data-driven testing, and automated runs via the CLI.

---

## 📂 Contents

- `Headers and Authorization.postman_collection.json` — Exported Postman collection with predefined requests and tests.
- `For local server.postman_environment.json` — Exported Postman environment.
- `json-server` — local server. 
- `README.md` — Documentation for setup and usage.

---

## 🚀 Getting Started

### Prerequisites

- [Postman](https://www.postman.com/downloads/) installed on your computer.
- (Optional) [Node.js](https://nodejs.org/) if you want to run tests with Newman.

---

### Running Tests in Postman (Manual)

1. Open Postman.
2. Click **Import** → Select `collection.json`.
3. The requests use a variable `{{id}}` in the path.
4. Execute requests manually:
   - **GET**
   - **POST**
   - **PUT**
   - **DELETE**

---

### Running with Collection Runner (Data-Driven)

1. Open **Collection Runner** in Postman.
2. Choose the imported collection.
3. Select `data.csv` as the **Data File**.
4. Run the collection — `{{id}}` will be replaced with values from the CSV.

✅ Expected Results:
- IDs **1, 2, 3** → **200 OK**
- All others → **404 Not Found**