# Source Asia — Backend Assignment

> A production-aware backend built with **Node.js** and **Express**, split into two independent services to ensure clean separation of concerns.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Folder Structure](#folder-structure)
3. [Part 1 — Rate-Limited API](#part-1--rate-limited-api)
   - [Setup & Run](#setup--run)
   - [Architecture](#architecture)
   - [API Demo](#api-demo)
   - [Testing](#testing)
3. [Part 2 — Product Catalog](#part-2--product-catalog)
   - [Setup & Run](#setup--run-1)
   - [Data Model & Performance](#data-model--performance)
   - [API Demo](#api-demo-1)
   - [Testing](#testing-1)

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | v14 or higher |
| npm | Included with Node.js |
| Terminal | PowerShell (Windows) or Bash (Mac/Linux) |

---

## Folder Structure

```
SourceAsia/
├── Part 1/
│   ├── server.js
│   └── package.json
├── Part 2/
│   ├── server.js
│   └── package.json
├── assets/
│   ├── 200 OK.png
│   ├── 429 Too Many Requests.png
│   ├── GET products.png
│   ├── GET products 1.png
│   ├── POST products.png
│   ├── POST products 1 media.png
│   └── stats.png
└── README.md
```

---

## Part 1 — Rate-Limited API

Restricts each user to a maximum of **5 requests per 60-second window** using an in-memory fixed window strategy.

### Setup & Run

```bash
cd "Part 1"
npm install
node server.js
# Server starts on http://localhost:3000
```

---

### Architecture

**Fixed Window Strategy**
A 60-second window is tracked per user. Once the window expires, the counter resets to zero automatically.

**Status Codes**

| Code | Meaning |
|---|---|
| `200 OK` | Request accepted within the rate limit |
| `429 Too Many Requests` | Limit exceeded — includes a JSON error body |

**Concurrency Safety**
Node.js runs on a single-threaded event loop. All reads and writes to the in-memory `Map` are synchronous, making race conditions impossible in this environment.

**Production Considerations**

| Limitation | Recommended Fix |
|---|---|
| State lost on server restart | Replace `Map` with **Redis** for persistence |
| Single-instance only | Redis also solves cross-instance state sharing behind a load balancer |

---

### API Demo

**Successful request — `200 OK`**

![200 OK](assets/200%20OK.png)

**Rate limit exceeded — `429 Too Many Requests`**

![429 Too Many Requests](assets/429%20Too%20Many%20Requests.png)

**User statistics — `/stats`**

![Stats](assets/stats.png)

---

### Testing

Run these in a **separate PowerShell terminal** while the server is running.

**POST `/request`** — Send a request (run 6 times to trigger the `429`):

```powershell
Invoke-RestMethod -Uri http://localhost:3000/request `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"user_id": "user123", "payload": {"data": "test"}}'
```

**GET `/stats`** — Check usage for a user:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/stats?user_id=user123" -Method GET
```

---

## Part 2 — Product Catalog

An in-memory catalog API for managing products and associated media URLs, with strict list-vs-detail performance optimizations.

### Setup & Run

```bash
cd "Part 2"
npm install
node server.js
# Server starts on http://localhost:3001
```

---

### Data Model & Performance

**Storage**
Products are stored in an in-memory `Map` keyed by a unique auto-incremented ID.

**List Endpoint — `GET /products`**
Returns only core fields and media counts (`image_count`, `video_count`). Full URL arrays are intentionally omitted to guarantee **O(1) serialization cost per product**, regardless of how many media items exist.

**Detail Endpoint — `GET /products/{id}`**
Returns the complete product object, including full `image_urls` and `video_urls` arrays.

**Production Considerations**

| Concern | Recommended Solution |
|---|---|
| Storage | **PostgreSQL** — `products` table + `product_media` table with foreign key |
| List performance | Optimized `COUNT()` grouping query on the media table |
| Media hosting | **AWS S3** + CDN (Cloudflare or CloudFront) for global low-latency delivery |

---

### API Demo

**Create a product — `POST /products`**

![POST products](assets/POST%20products.png)

**Append media — `POST /products/1/media`**

![POST products 1 media](assets/POST%20products%201%20media.png)

**List all products — `GET /products`** *(counts only, no URL arrays)*

![GET products](assets/GET%20products.png)

**Full product detail — `GET /products/1`**

![GET products 1](assets/GET%20products%201.png)

---

### Testing

Run these commands **sequentially** in a PowerShell terminal.

**1. Create a new product:**

```powershell
Invoke-RestMethod -Uri http://localhost:3001/products `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"name": "Widget A", "sku": "SKU-001", "image_urls": ["https://cdn.example.com/img1.jpg"]}'
```

**2. Append a video to the product (ID: 1):**

```powershell
Invoke-RestMethod -Uri http://localhost:3001/products/1/media `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"video_urls": ["https://cdn.example.com/demo.mp4"]}'
```

**3. List all products** *(observe: arrays omitted, counts shown)*:

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/products" -Method GET
```

**4. Get full product detail:**

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/products/1" -Method GET
```

---

<p align="center">Built with Node.js · Express · In-Memory Storage</p>