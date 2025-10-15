# API Documentation

## Overview
The application provides a RESTful API built with FastAPI, offering endpoints for document processing, endorsement management, and letter generation.

## Base URL
```
Production: https://api.yourapp.com
Development: http://localhost:8000
```

## Authentication
All API endpoints require authentication via JWT tokens.

```http
Authorization: Bearer <jwt_token>
```

## Content Types
- **Request**: `application/json`
- **Response**: `application/json`
- **File Upload**: `multipart/form-data`

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Endpoints

### Endorsement Management

#### Create Endorsement
**POST** `/api/endorsements`

Creates a new bill endorsement.

**Request Body:**
```json
{
  "billData": {
    "amount": 1000.00,
    "currency": "USD",
    "dueDate": "2024-02-01",
    "payee": "John Doe",
    "description": "Service payment"
  },
  "endorserInfo": {
    "name": "Jane Smith",
    "address": "123 Main St, City, State 12345",
    "signature": "base64_encoded_signature"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "endorsementId": "end_abc123",
    "status": "completed",
    "endorsementText": "Generated endorsement text...",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Status Codes:**
- `201` - Created successfully
- `400` - Invalid request data
- `401` - Unauthorized
- `422` - Validation error

---

#### Get Endorsement
**GET** `/api/endorsements/{endorsement_id}`

Retrieves a specific endorsement by ID.

**Parameters:**
- `endorsement_id` (string): Unique endorsement identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "endorsementId": "end_abc123",
    "billData": {
      "amount": 1000.00,
      "currency": "USD",
      "dueDate": "2024-02-01",
      "payee": "John Doe",
      "description": "Service payment"
    },
    "endorsementText": "Generated endorsement text...",
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### List Endorsements
**GET** `/api/endorsements`

Retrieves a paginated list of endorsements.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 10, max: 100)
- `status` (string): Filter by status (`pending`, `completed`, `failed`)
- `sort` (string): Sort field (`created_at`, `amount`, `due_date`)
- `order` (string): Sort order (`asc`, `desc`)

**Response:**
```json
{
  "success": true,
  "data": {
    "endorsements": [
      {
        "endorsementId": "end_abc123",
        "amount": 1000.00,
        "payee": "John Doe",
        "status": "completed",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### Document Management

#### Upload Document
**POST** `/api/documents/upload`

Uploads a document for processing.

**Request:** `multipart/form-data`
- `file` (file): Document file (PDF, DOC, DOCX)
- `type` (string): Document type (`bill`, `contract`, `letter`)
- `metadata` (JSON string): Additional document metadata

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "doc_xyz789",
    "filename": "bill.pdf",
    "type": "bill",
    "size": 1024567,
    "uploadedAt": "2024-01-15T10:30:00Z",
    "processingStatus": "pending"
  }
}
```

**File Requirements:**
- Maximum size: 10MB
- Supported formats: PDF, DOC, DOCX, TXT
- Virus scanning performed on all uploads

---

#### Process Document
**POST** `/api/documents/{document_id}/process`

Initiates processing of an uploaded document.

**Parameters:**
- `document_id` (string): Document identifier

**Request Body:**
```json
{
  "processingOptions": {
    "extractText": true,
    "generateSummary": true,
    "detectSignatures": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processingId": "proc_123",
    "status": "processing",
    "estimatedCompletion": "2024-01-15T10:35:00Z"
  }
}
```

---

### Letter Generation

#### Generate Letter
**POST** `/api/letters/generate`

Generates a formal letter based on provided template and data.

**Request Body:**
```json
{
  "templateId": "template_formal_notice",
  "recipientInfo": {
    "name": "John Doe",
    "address": "456 Oak Ave, City, State 67890",
    "title": "Mr."
  },
  "senderInfo": {
    "name": "Jane Smith",
    "address": "123 Main St, City, State 12345",
    "title": "Ms."
  },
  "letterData": {
    "subject": "Formal Notice",
    "content": "Letter content...",
    "attachments": ["doc_xyz789"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "letterId": "let_456",
    "generatedText": "Full letter text...",
    "format": "formal",
    "createdAt": "2024-01-15T10:30:00Z",
    "downloadUrl": "/api/letters/let_456/download"
  }
}
```

---

## Error Codes

### Client Errors (4xx)
- `400` **Bad Request**: Invalid request format or parameters
- `401` **Unauthorized**: Missing or invalid authentication
- `403` **Forbidden**: Insufficient permissions
- `404` **Not Found**: Resource does not exist
- `409` **Conflict**: Resource conflict (duplicate creation)
- `422` **Validation Error**: Request data validation failed
- `429` **Rate Limited**: Too many requests

### Server Errors (5xx)
- `500` **Internal Error**: Unexpected server error
- `502` **Bad Gateway**: Upstream service error
- `503` **Service Unavailable**: Service temporarily unavailable
- `504` **Gateway Timeout**: Request timeout

## Rate Limiting
- **Default**: 100 requests per minute per IP
- **Authenticated**: 1000 requests per minute per user
- **File Upload**: 10 uploads per minute per user

Rate limit headers included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

## Webhooks
Subscribe to events via webhooks for real-time notifications.

### Supported Events
- `endorsement.created`
- `endorsement.completed`
- `document.processed`
- `letter.generated`

### Webhook Payload
```json
{
  "event": "endorsement.completed",
  "data": {
    "endorsementId": "end_abc123",
    "status": "completed"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## SDK Examples

### Python
```python
import requests

# Authentication
headers = {"Authorization": "Bearer your_jwt_token"}

# Create endorsement
response = requests.post(
    "https://api.yourapp.com/api/endorsements",
    json={
        "billData": {
            "amount": 1000.00,
            "currency": "USD",
            "payee": "John Doe"
        }
    },
    headers=headers
)

endorsement = response.json()
```

### JavaScript
```javascript
// Using fetch API
const response = await fetch('/api/endorsements', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_jwt_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    billData: {
      amount: 1000.00,
      currency: 'USD',
      payee: 'John Doe'
    }
  })
});

const endorsement = await response.json();
```

### cURL
```bash
# Create endorsement
curl -X POST https://api.yourapp.com/api/endorsements \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "billData": {
      "amount": 1000.00,
      "currency": "USD",
      "payee": "John Doe"
    }
  }'
```

## OpenAPI Specification
Interactive API documentation available at:
- **Swagger UI**: `/docs`
- **ReDoc**: `/redoc`
- **OpenAPI JSON**: `/openapi.json`