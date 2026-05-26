# Rental Data Agent - API Specification

This documentation defines the interface between the Frontend client and the Rental Data Agent Backend. It covers the core query processing, data insertion, and property listing API endpoints.

---

## 1. Natural Language Query Endpoint (SSE Streaming)

> [!NOTE]
> This endpoint uses **Server-Sent Events (SSE)** to stream real-time progress updates of the agent's reasoning steps, followed by the final query results.

- **URL**: `/api/query`
- **Method**: `POST`
- **Request Headers**:
  - `Content-Type: application/json`
- **Response Headers**:
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`

### Request Body Schema
```json
{
  "query": "string"
}
```

### Request Body Example
```json
{
  "query": "帮我找一下价格在500-600的房子"
}
```

### Response Stream Events

Each stream event is prefixed with `data: ` and ends with `\n\n`. The contents are JSON strings.

#### Event Type 1: Progress Updates (`progress`)
Indicates the execution step of the internal agent state machine.
- **`type`**: `"progress"`
- **`step`**: The current node name (e.g., `"提取关键词"`, `"检索字段"`, `"检索指标"`, `"检索值"`, `"过滤指标"`, `"过滤表格"`, `"生成SQL"`, `"验证SQL"`, `"校正SQL"`, `"执行SQL"`)
- **`status`**: `"running"` | `"success"` | `"error"`
- **`info`**: Descriptive details about the step's execution result.

*Example:*
```json
data: {"type": "progress", "step": "生成SQL", "status": "success", "info": "生成的SQL: SELECT ..."}
```

#### Event Type 2: Successful Result (`result`)
Contains the final matched property listings.
- **`type`**: `"result"`
- **`data`**: Array of property records conforming to the 8 Core Fields.

*Example:*
```json
data: {"type": "result", "data": [{"product_id": "P012", "product_name": "15 Toorak Rd, South Yarra", "property_type": "Apartment", "bedrooms": 1, "bathrooms": 1, "price": 550.0, "is_pet_friendly": 0, "region_name": "South Yarra"}]}
```

#### Event Type 3: Execution Error (`error`)
Emitted if any unrecoverable error occurs in the pipeline.
- **`type`**: `"error"`
- **`message`**: Details of the error.

*Example:*
```json
data: {"type": "error", "message": "Failed to connect to MySQL database"}
```

---

## 2. Retrieve All Products Endpoint

- **URL**: `/api/products`
- **Method**: `GET`
- **Response Headers**:
  - `Content-Type: application/json`

### Response Schema

> [!IMPORTANT]
> The product list is strictly ordered by `product_id` in **ascending** order (e.g. `P001` to `P999`).

```json
{
  "status": "success",
  "data": [
    {
      "product_id": "string",
      "product_name": "string",
      "property_type": "string",
      "bedrooms": "integer",
      "bathrooms": "integer",
      "price": "float",
      "is_pet_friendly": "integer (0 or 1)",
      "region_name": "string"
    }
  ]
}
```

### Response Example
```json
{
  "status": "success",
  "data": [
    {
      "product_id": "P001",
      "product_name": "101/50 George St, Sydney CBD",
      "property_type": "Apartment",
      "bedrooms": 2,
      "bathrooms": 1,
      "price": 850.0,
      "is_pet_friendly": 1,
      "region_name": "Sydney CBD"
    },
    {
      "product_id": "P002",
      "product_name": "302/8 Albert Ave, Chatswood",
      "property_type": "Apartment",
      "bedrooms": 1,
      "bathrooms": 1,
      "price": 650.0,
      "is_pet_friendly": 0,
      "region_name": "Chatswood"
    }
  ]
}
```

---

## 3. Insert Random Product Endpoint

> [!TIP]
> This endpoint randomly generates a valid rental property matching realistic schemas, inserts it into the MySQL DW, synchronizes index records to Elasticsearch/Qdrant, and returns the newly created property details instantly.

- **URL**: `/api/product/random`
- **Method**: `POST`
- **Response Headers**:
  - `Content-Type: application/json`

### Response Schema
```json
{
  "status": "success",
  "data": {
    "product_id": "string",
    "product_name": "string",
    "property_type": "string",
    "bedrooms": "integer",
    "bathrooms": "integer",
    "price": "float",
    "is_pet_friendly": "integer (0 or 1)",
    "region_id": "string",
    "region_name": "string"
  }
}
```

### Response Example
```json
{
  "status": "success",
  "data": {
    "product_id": "P017",
    "product_name": "123 George St, Sydney CBD",
    "property_type": "Apartment",
    "bedrooms": 2,
    "bathrooms": 1,
    "price": 850.0,
    "is_pet_friendly": 1,
    "region_id": "R001",
    "region_name": "Sydney CBD"
  }
}
```

---

## 4. Token Consumption Audit Endpoint

> [!NOTE]
> This endpoint retrieves the history of LLM token consumption and estimated costs associated with agent reasoning processes, filtered by the client's IP address.

- **URL**: `/api/token-consumption`
- **Method**: `GET`
- **Query Parameters**:
  - `ip` (string, required): The client IP address used to track and filter the token usage history.

### Response Schema

An array of JSON objects representing token consumption for each reasoning node.

```json
[
  {
    "id": "integer",
    "user_id": "string (client IP)",
    "request_id": "string (UUID)",
    "node_name": "string",
    "model_name": "string",
    "prompt_tokens": "integer",
    "completion_tokens": "integer",
    "total_tokens": "integer",
    "cost_rmb": "number (float)",
    "created_at": "string (YYYY-MM-DD HH:MM:SS)"
  }
]
```

### Response Example
```json
[
  {
    "id": 18,
    "user_id": "127.0.0.1",
    "request_id": "87e15faf-d9a0-4953-a163-db17dfe7d2df",
    "node_name": "生成SQL",
    "model_name": "deepseek-v3-2-251201",
    "prompt_tokens": 1340,
    "completion_tokens": 77,
    "total_tokens": 1417,
    "cost_rmb": 0,
    "created_at": "2026-05-25 04:28:02"
  }
]
```

---

## Data Dictionary: The 8 Core Fields

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `product_id` | `VARCHAR(30)` | Unique Identifier for the property listing. (e.g. `P001`) |
| `product_name`| `VARCHAR(255)`| The physical address / name of the listing. |
| `property_type`| `VARCHAR(50)` | Housing type: `Apartment`, `House`, `Townhouse`, `Studio`. |
| `bedrooms` | `INT` | Number of bedrooms (starts at `0` for studios). |
| `bathrooms` | `INT` | Number of bathrooms. |
| `price` | `DECIMAL` | Weekly rental price in AUD. |
| `is_pet_friendly`| `TINYINT` | Pet policy constraint: `1` (Friendly) / `0` (Not allowed). |
| `region_name` | `VARCHAR(100)`| Name of the geographical area (e.g., `Sydney CBD`, `South Yarra`). |
