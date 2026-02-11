# Point Transfer Integration Specification

## Overview

This document outlines the technical requirements for integrating a point transfer system between PlayEngine and our platform. Users will be able to transfer a specific amount of points from their PlayEngine account to our platform using just their email address.

## System Architecture

### Flow Diagram
```
User → Our Frontend → Our Backend → PlayEngine API → Point Transfer
```

### Key Components
- **Our Frontend**: React application with transfer form
- **Our Backend**: Django REST API with transfer endpoint
- **PlayEngine API**: User balance and transfer endpoints
- **Database**: Track transfers and maintain audit trail

## API Endpoints Required from PlayEngine

### 1. Balance Check Endpoint

**Endpoint:** `GET /api/user-balance?email={email}`

**Purpose:** Retrieve current point balance for a user

**Response Format:**
```json
{
    "user_id": "playengine-user-123",
    "email": "user@example.com",
    "points_balance": 500,
    "username": "playengine_user",
    "last_updated": "2024-02-04T10:30:00Z"
}
```

**Error Responses:**
```json
// User not found
{
    "error": "User not found",
    "status": 404
}

// Invalid email
{
    "error": "Invalid email format",
    "status": 400
}
```

### 2. Point Transfer Endpoint

**Endpoint:** `POST /api/transfer-points`

**Purpose:** Execute atomic point transfer from PlayEngine to our platform

**Request Body:**
```json
{
    "email": "user@example.com",
    "amount": 200,
    "transfer_id": "unique-transfer-id-12345"
}
```

**Success Response:**
```json
{
    "success": true,
    "user_id": "playengine-user-123",
    "email": "user@example.com",
    "transferred_amount": 200,
    "remaining_balance": 300,
    "transfer_id": "unique-transfer-id-12345",
    "timestamp": "2024-02-04T10:30:00Z"
}
```

**Error Responses:**

*Insufficient Balance:*
```json
{
    "success": false,
    "error": "Insufficient balance",
    "user_balance": 500,
    "requested_amount": 200,
    "status": 400
}
```

*User Not Found:*
```json
{
    "success": false,
    "error": "User not found",
    "status": 404
}
```

*Race Condition:*
```json
{
    "success": false,
    "error": "Balance changed during transfer",
    "current_balance": 150,
    "requested_amount": 200,
    "status": 409
}
```

*Concurrent Transfer:*
```json
{
    "success": false,
    "error": "Transfer in progress",
    "status": 409
}
```

### 3. Transfer History Endpoint (Optional)

**Endpoint:** `GET /api/user-transfers?email={email}&limit=10`

**Purpose:** Retrieve recent transfer history for user reference

**Response Format:**
```json
{
    "transfers": [
        {
            "transfer_id": "transfer-123",
            "amount": 200,
            "timestamp": "2024-02-04T10:30:00Z",
            "status": "completed"
        }
    ],
    "total_count": 1
}
```

## Authentication Requirements

### API Key Authentication
- **Header:** `X-API-Key: your-api-key-here`
- **Key Management:** Support for key rotation and revocation
- **Security:** Keys must be stored securely and transmitted over HTTPS only

### Rate Limiting
- **Limit:** Maximum 100 requests per hour per API key
- **Headers:** Include rate limit information in response headers
- **Graceful Degradation:** Return appropriate error when limits exceeded

## Business Logic Requirements

### Atomic Transaction
The transfer must be atomic - either both operations succeed or both fail:
1. Deduct points from user's PlayEngine balance
2. Return success only if deduction succeeds
3. Prevent partial transfers or data corruption

### Balance Validation
- Check if user has sufficient balance BEFORE processing
- Return exact balance if insufficient
- Prevent negative balances at all costs
- Validate amount is positive and numeric

### Idempotency
- Use `transfer_id` to prevent duplicate transfers
- If same transfer_id is used twice, return original result
- Log duplicate attempts for security monitoring

### Concurrency Protection
- Handle concurrent transfer requests for same user
- Use database locks to prevent race conditions
- Return appropriate error for conflicting operations

## Database Operations

### Required Tables
```sql
-- User table (existing)
CREATE TABLE users (
    user_id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    points_balance INTEGER NOT NULL DEFAULT 0,
    username VARCHAR(100),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transfer log table (new)
CREATE TABLE point_transfers (
    transfer_id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES users(user_id),
    email VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL,
    remaining_balance INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'completed'
);
```

### Transaction Flow
```sql
BEGIN TRANSACTION;

-- Check balance with row lock
SELECT points_balance FROM users WHERE email = ? FOR UPDATE;

-- If sufficient balance, deduct points
UPDATE users SET points_balance = points_balance - ? 
WHERE email = ? AND points_balance >= ?;

-- Log the transfer
INSERT INTO point_transfers (transfer_id, user_id, email, amount, remaining_balance, timestamp) 
VALUES (?, ?, ?, ?, ?, NOW());

COMMIT;
```

## Security Requirements

### HTTPS Only
- All API endpoints must use HTTPS
- No HTTP fallbacks allowed
- Proper SSL/TLS configuration

### CORS Configuration
- Allow requests from our frontend domain
- Proper CORS headers for cross-origin requests
- Secure cookie handling if applicable

### Input Validation
- Validate email format using RFC standards
- Sanitize all input parameters
- Prevent SQL injection and XSS attacks

### Audit Trail
- Log all transfer attempts with full details
- Include user_id, email, amount, timestamp, transfer_id
- Provide audit trail for dispute resolution
- Retain logs for minimum 1 year

## Integration Flow

### Step 1: Check Balance
```
GET /api/user-balance?email=user@example.com
```

### Step 2: User Input
- Display current balance to user
- User enters amount to transfer (must be <= balance)
- Validate input on frontend

### Step 3: Execute Transfer
```
POST /api/transfer-points
{
    "email": "user@example.com",
    "amount": 200,
    "transfer_id": "uuid-v4-generated-by-our-system"
}
```

### Step 4: Process Response
- If success: Credit user in our system
- If failed: Show error message with details
- Update user interface accordingly

## Testing Requirements

### Test Cases
1. **Valid transfer with sufficient balance**
2. **Transfer exceeding balance**
3. **Transfer with zero balance**
4. **Duplicate transfer_id**
5. **Concurrent transfers for same user**
6. **Invalid email format**
7. **Network timeout during transfer**
8. **Database connection failure**
9. **API key authentication failure**
10. **Rate limit exceeded**

### Test Data
```json
// Test user setup
{
    "email": "test@example.com",
    "initial_balance": 500
}

// Transfer scenarios:
// 1. Transfer 200 → Remaining: 300
// 2. Transfer 600 → Error: Insufficient balance
// 3. Transfer 500 → Remaining: 0
// 4. Transfer 0 → Error: Invalid amount
```

## Error Handling

### HTTP Status Codes
- **200**: Success
- **400**: Bad Request (invalid input)
- **401**: Unauthorized (invalid API key)
- **404**: Not Found (user not found)
- **409**: Conflict (race condition/concurrent transfer)
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error

### Error Response Format
```json
{
    "success": false,
    "error": "Descriptive error message",
    "status": 400,
    "details": {
        "field": "additional context if needed"
    }
}
```

## Performance Requirements

### Response Time
- **Balance check**: < 500ms
- **Transfer execution**: < 1000ms
- **Transfer history**: < 1000ms

### Availability
- **Uptime**: 99.5% monthly uptime
- **Maintenance windows**: Notify 48 hours in advance
- **Degraded service**: Graceful handling during high load

### Scalability
- Support up to 1000 concurrent transfer requests
- Handle peak usage during promotional periods
- Monitor and alert on performance degradation

## Documentation Requirements

### API Documentation
- Complete endpoint documentation with examples
- Request/response format specifications
- Error code reference
- Rate limiting details
- Authentication guide

### Integration Guide
- Step-by-step integration instructions
- Code examples in multiple languages
- Testing procedures
- Troubleshooting guide
- Contact information for support

## Timeline and Coordination

### Phase 1: API Development (1-2 weeks)
- [ ] Design and implement API endpoints
- [ ] Create database schema changes
- [ ] Implement business logic and validation
- [ ] Add security measures and authentication

### Phase 2: Testing Environment (1 week)
- [ ] Deploy to staging environment
- [ ] Provide test credentials and documentation
- [ ] Support our integration testing
- [ ] Address any issues discovered during testing

### Phase 3: Production Deployment (1 week)
- [ ] Deploy to production environment
- [ ] Monitor for performance and errors
- [ ] Provide ongoing support
- [ ] Handle user feedback and issues

## Contact Information

### Technical Contacts
- **API Development**: [Contact person and email]
- **Testing Support**: [Contact person and email]
- **Production Support**: [Contact person and email]

### Communication Channels
- **Slack/Teams**: [Channel name]
- **Email**: [Support email]
- **Phone**: [Emergency contact number]

## Questions for PlayEngine Team

1. **Timeline**: When can you have the API ready for testing?
2. **Testing Environment**: Do you have a staging environment for testing?
3. **API Keys**: How will you manage and provide API keys?
4. **Monitoring**: How will you monitor API usage and performance?
5. **Support**: Who should we contact for technical issues during integration?
6. **Documentation**: When will complete API documentation be available?
7. **Testing Data**: Can you provide test users with various point balances?
8. **Security Review**: Do you have a security review process for new APIs?

## Implementation Notes

### For PlayEngine Developers
- Use UUID v4 for transfer_id generation
- Implement proper database transaction handling
- Add comprehensive logging for debugging
- Follow REST API best practices
- Ensure backward compatibility for future changes

### For Our Development Team
- Implement frontend transfer form in Profile page
- Create backend transfer endpoint with PlayEngine integration
- Add transfer tracking and audit logging
- Implement error handling and user feedback
- Add monitoring and alerting for transfer operations

This specification provides all the technical details needed to implement a secure, reliable point transfer system between PlayEngine and our platform.