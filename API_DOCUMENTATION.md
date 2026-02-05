# Claimed Bounties API Documentation

This document describes the API endpoints for fetching claimed bounties data from the PlayMarket system.

## Overview

The API provides endpoints to retrieve claimed bounties for specific users, including detailed information about each claim and comprehensive statistics. All endpoints require authentication and include proper authorization controls.

## Base URL

```
http://127.0.0.1:8000/bounties/api/
```

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Authorization

- **Users**: Can only access their own claimed bounties data
- **Admin Users**: Can access claimed bounties data for any user

## Endpoints

### 1. Get User's Claimed Bounties

**URL**: `GET /user/{user_id}/claimed-bounties/`

**Description**: Returns a paginated list of claimed bounties for a specific user, along with statistics.

**Parameters**:
- `user_id` (string, required): The ID of the user, or "me" for the current authenticated user
- `page` (integer, optional): Page number (default: 1)
- `page_size` (integer, optional): Number of items per page (default: 10, max: 100)

**Example Requests**:
```bash
# Get current user's claimed bounties
curl -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
     "http://127.0.0.1:8000/bounties/api/user/me/claimed-bounties/"

# Get specific user's claimed bounties (admin only)
curl -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
     "http://127.0.0.1:8000/bounties/api/user/4/claimed-bounties/"

# Get specific page with custom page size
curl -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
     "http://127.0.0.1:8000/bounties/api/user/me/claimed-bounties/?page=2&page_size=5"
```

**Response Format**:
```json
{
  "user": {
    "id": 4,
    "username": "testuser",
    "email": "test@example.com"
  },
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total_pages": 2,
    "total_count": 15,
    "has_next": true,
    "has_previous": false
  },
  "claimed_bounties": [
    {
      "id": 1,
      "bounty": 13,
      "bounty_title": "david speed",
      "user": 4,
      "user_username": "testuser",
      "status": "approved",
      "submission": "lets get the money",
      "submitted_at": "2026-01-29T07:35:53",
      "approved_at": "2026-01-29T07:37:00",
      "created_at": "2026-01-29T07:35:32"
    }
  ],
  "statistics": {
    "total_claims": 8,
    "approved": 4,
    "submitted": 3,
    "pending": 1,
    "rejected": 0,
    "total_approved_rewards": 190,
    "total_pending_rewards": 400
  }
}
```

### 2. Get User's Claimed Bounties Statistics

**URL**: `GET /user/{user_id}/claimed-bounties/stats/`

**Description**: Returns only the statistics for a user's claimed bounties without the detailed list.

**Parameters**:
- `user_id` (string, required): The ID of the user, or "me" for the current authenticated user

**Example Request**:
```bash
curl -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
     "http://127.0.0.1:8000/bounties/api/user/me/claimed-bounties/stats/"
```

**Response Format**:
```json
{
  "user": {
    "id": 4,
    "username": "testuser",
    "email": "test@example.com"
  },
  "statistics": {
    "total_claims": 8,
    "approved": 4,
    "submitted": 3,
    "pending": 1,
    "rejected": 0,
    "total_approved_rewards": 190,
    "total_pending_rewards": 400
  }
}
```

## Response Fields

### User Object
- `id` (integer): User's unique identifier
- `username` (string): User's username
- `email` (string): User's email address

### Pagination Object
- `page` (integer): Current page number
- `page_size` (integer): Number of items per page
- `total_pages` (integer): Total number of pages
- `total_count` (integer): Total number of claimed bounties
- `has_next` (boolean): Whether there is a next page
- `has_previous` (boolean): Whether there is a previous page

### Claimed Bounties Array
Each claimed bounty object contains:
- `id` (integer): Claim's unique identifier
- `bounty` (integer): Associated bounty ID
- `bounty_title` (string): Title of the associated bounty
- `user` (integer): User ID who made the claim
- `user_username` (string): Username of the user who made the claim
- `status` (string): Claim status ("approved", "submitted", "pending", "rejected")
- `submission` (string): User's submission text
- `submitted_at` (datetime): When the claim was submitted
- `approved_at` (datetime): When the claim was approved (null if not approved)
- `created_at` (datetime): When the claim was created

### Statistics Object
- `total_claims` (integer): Total number of claims
- `approved` (integer): Number of approved claims
- `submitted` (integer): Number of submitted claims
- `pending` (integer): Number of pending claims
- `rejected` (integer): Number of rejected claims
- `total_approved_rewards` (integer): Total rewards from approved claims
- `total_pending_rewards` (integer): Total rewards from submitted claims

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "error": "Permission denied"
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

## Usage Examples

### Frontend Integration (JavaScript/React)
```javascript
// Function to fetch user's claimed bounties
async function fetchUserClaimedBounties(userId, page = 1, pageSize = 10) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(
    `http://127.0.0.1:8000/bounties/api/user/${userId}/claimed-bounties/?page=${page}&page_size=${pageSize}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

// Function to fetch user's statistics
async function fetchUserClaimedBountiesStats(userId) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(
    `http://127.0.0.1:8000/bounties/api/user/${userId}/claimed-bounties/stats/`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}
```

### Mobile App Integration (iOS/Android)
```kotlin
// Kotlin example for Android
suspend fun getUserClaimedBounties(userId: String, page: Int = 1, pageSize: Int = 10): ClaimedBountiesResponse {
    val token = getAuthToken()
    return apiService.getUserClaimedBounties(
        userId = userId,
        page = page,
        pageSize = pageSize,
        authorization = "Bearer $token"
    )
}
```

## Security Considerations

1. **Authentication Required**: All endpoints require valid JWT authentication
2. **Authorization Controls**: Users can only access their own data unless they're admin
3. **Rate Limiting**: Consider implementing rate limiting in production
4. **HTTPS**: Use HTTPS in production environments
5. **Token Expiry**: Handle token expiration and refresh appropriately

## Implementation Notes

- The API uses Django REST Framework for serialization and pagination
- Custom permission classes ensure proper authorization
- Database queries are optimized with `select_related()` to minimize queries
- Pagination is handled automatically by DRF's pagination classes
- All datetime fields are in ISO 8601 format