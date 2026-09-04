# API.md — MediQueue LK

All routes follow the base URL: `http://localhost:3001` (dev) or your deployed URL.

**Response shape:**
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "message": "...", "field": "..." } }
```

---

## Health Check

### `GET /api/health`
Returns server status.
**Response:** `{ "success": true, "data": { "status": "ok" } }`

---

## Medicine Catalog (`/api/medicines`)
<!-- Member 1 fills in this section -->

### `GET /api/medicines`
<!-- List all medicines, with search/filter params -->

### `GET /api/medicines/:id`
<!-- Get single medicine -->

### `POST /api/medicines`
<!-- Create a medicine -->

### `PUT /api/medicines/:id`
<!-- Update a medicine -->

### `DELETE /api/medicines/:id`
<!-- Delete a medicine -->

---

## Pharmacy Stock (`/api/stock`)
<!-- Member 2 fills in this section -->

### `GET /api/stock`
<!-- List stock entries -->

### `GET /api/stock/:id`
<!-- Get single stock entry -->

### `POST /api/stock`
<!-- Create a stock entry -->

### `PUT /api/stock/:id`
<!-- Update a stock entry -->

### `DELETE /api/stock/:id`
<!-- Delete a stock entry -->

---

## Pharmacy Directory (`/api/pharmacies`)
<!-- Member 3 fills in this section -->

### `GET /api/pharmacies`
<!-- List all pharmacies -->

### `GET /api/pharmacies/:id`
<!-- Get single pharmacy -->

### `POST /api/pharmacies`
<!-- Create a pharmacy -->

### `PUT /api/pharmacies/:id`
<!-- Update a pharmacy -->

### `DELETE /api/pharmacies/:id`
<!-- Delete a pharmacy -->

---

## Patient Requests (`/api/requests`)
<!-- Member 4 fills in this section -->

### `GET /api/requests`
<!-- List all requests -->

### `GET /api/requests/:id`
<!-- Get single request -->

### `POST /api/requests`
<!-- Create a new patient request -->

### `PUT /api/requests/:id`
<!-- Update a request (e.g. change status) -->

### `DELETE /api/requests/:id`
<!-- Delete a request -->
