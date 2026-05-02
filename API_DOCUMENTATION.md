/**
 * API Documentation
 * Comprehensive guide for all available endpoints
 */

# Personal Finance Dashboard - API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently uses header-based user identification (mock). Replace with real OAuth2 in production:
```
X-User-Id: user-uuid-here
X-User-Email: user@example.com
```

---

## Transactions

### List Transactions
```
GET /transactions
```

**Query Parameters:**
- `startDate` (string, optional): ISO date (YYYY-MM-DD)
- `endDate` (string, optional): ISO date (YYYY-MM-DD)
- `categoryId` (string, optional): Filter by category
- `type` (string, optional): 'income' or 'expense'
- `minAmount` (number, optional): Minimum amount
- `maxAmount` (number, optional): Maximum amount
- `search` (string, optional): Search description/notes

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "user-uuid",
    "description": "Grocery Store",
    "amount": 45.99,
    "categoryId": "category-uuid",
    "categoryName": "Groceries",
    "type": "expense",
    "date": "2024-01-16",
    "createdAt": "2024-01-16T10:30:00Z",
    "updatedAt": "2024-01-16T10:30:00Z",
    "notes": "Weekly shopping",
    "source": "manual"
  }
]
```

### Get Transaction
```
GET /transactions/:id
```

### Create Transaction
```
POST /transactions
```

**Request Body:**
```json
{
  "description": "Salary Deposit",
  "amount": 2500,
  "categoryId": "category-uuid",
  "type": "income",
  "date": "2024-01-15",
  "notes": "Monthly salary",
  "source": "manual"
}
```

### Update Transaction
```
PUT /transactions/:id
```

**Request Body:** (all fields optional)
```json
{
  "description": "Updated description",
  "amount": 2600,
  "categoryId": "new-category-uuid",
  "type": "income",
  "date": "2024-01-15",
  "notes": "Updated notes"
}
```

### Delete Transaction
```
DELETE /transactions/:id
```

**Response:** 204 No Content

### Get Statistics
```
GET /transactions/stats/summary
```

**Query Parameters:**
- `startDate` (string, optional): ISO date
- `endDate` (string, optional): ISO date

**Response:**
```json
{
  "totalIncome": 5000,
  "totalExpense": 1200,
  "transactionCount": 15,
  "categoryBreakdown": [
    {
      "categoryId": "uuid",
      "categoryName": "Groceries",
      "total": 450
    }
  ]
}
```

---

## Categories

### List Categories
```
GET /categories
```

**Query Parameters:**
- `active` (boolean, optional): Filter by active status
- `type` (string, optional): Filter by type ('income', 'expense', 'transfer')

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Groceries",
    "type": "expense",
    "description": "Food and grocery shopping",
    "color": "#FF6B6B",
    "icon": "🛒",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

### Get Category
```
GET /categories/:id
```

### Create Category
```
POST /categories
```

**Request Body:**
```json
{
  "name": "New Category",
  "type": "expense",
  "description": "Optional description",
  "color": "#FF6B6B",
  "icon": "🏷️"
}
```

### Update Category
```
PUT /categories/:id
```

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "type": "expense",
  "description": "Updated description",
  "color": "#4ECDC4",
  "isActive": true
}
```

### Delete Category
```
DELETE /categories/:id
```

**Response:** 204 No Content

---

## CSV Import

### Import CSV File
```
POST /import/csv
```

**Content-Type:** multipart/form-data

**Form Data:**
- `file` (required): CSV file
- `dateFormat` (optional): 'YYYY-MM-DD' (default)
- `amountMultiplier` (optional): Numeric multiplier (default: 1)

**Response:**
```json
{
  "success": true,
  "importedCount": 50,
  "failedCount": 0,
  "errors": [],
  "transactions": [
    { /* transaction objects */ }
  ]
}
```

### Get CSV Template
```
GET /import/template
```

**Response:** CSV file download

**CSV Format:**
```csv
date,description,amount,type,category
2024-01-15,Salary,-2500,income,Salary
2024-01-16,Grocery Store,45.99,expense,Groceries
```

---

## Power BI Integration

### Get Embed Configuration
```
GET /embed/config
```

**Response:**
```json
{
  "reportId": "report-uuid",
  "embedUrl": "https://app.powerbi.com/view?r=eyJrIjoiODJmNDg4...",
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Ik...",
  "tokenExpiry": "2024-01-16T11:30:00Z"
}
```

### Trigger Dataset Refresh
```
POST /embed/refresh
```

**Request Body:**
```json
{
  "datasetId": "dataset-uuid"
}
```

**Response:**
```json
{
  "refreshId": "refresh-uuid",
  "status": "initiated"
}
```

### Get Refresh History
```
GET /embed/refresh-history/:datasetId
```

**Query Parameters:**
- `top` (number, optional): Number of records (default: 10)

**Response:**
```json
[
  {
    "id": "refresh-uuid",
    "status": "Completed",
    "startTime": "2024-01-16T10:00:00Z",
    "endTime": "2024-01-16T10:15:00Z"
  }
]
```

### Get Report Pages
```
GET /embed/pages/:reportId
```

**Response:**
```json
[
  {
    "name": "overview",
    "displayName": "Overview"
  },
  {
    "name": "spending",
    "displayName": "Spending Analysis"
  }
]
```

---

## Health Check

### Server Health
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-16T10:30:00Z",
  "uptime": 12345.67
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "error": "Missing required fields",
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-16T10:30:00Z"
}
```

### Not Found (404)
```json
{
  "error": "Transaction not found",
  "code": "NOT_FOUND",
  "timestamp": "2024-01-16T10:30:00Z"
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "timestamp": "2024-01-16T10:30:00Z"
}
```

### Internal Error (500)
```json
{
  "error": "Internal Server Error",
  "timestamp": "2024-01-16T10:30:00Z"
}
```

---

## Rate Limiting (Future Enhancement)

Currently not implemented, but recommended for production:
- 1000 requests per hour per user
- 100 requests per minute per user
- Burst limit: 20 requests per 10 seconds

---

## Pagination (Future Enhancement)

Planned for future versions:
```
GET /transactions?page=1&limit=50
```

Response will include:
```json
{
  "data": [ /* items */ ],
  "total": 250,
  "page": 1,
  "limit": 50,
  "hasMore": true
}
```
