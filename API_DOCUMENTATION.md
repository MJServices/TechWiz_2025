# EventSphere API Documentation

## Overview
This document provides comprehensive documentation for the newly implemented backend APIs for the EventSphere application.

## Authentication
All API endpoints require authentication using JWT tokens in the Authorization header:
```
Authorization: Bearer <token>
```

## New API Endpoints

### Announcements API
Manage system-wide and targeted announcements.

#### Create Announcement
- **Endpoint**: `POST /api/announcements`
- **Auth**: Admin only
- **Body**:
```json
{
  "title": "System Maintenance",
  "content": "The system will be down for maintenance from 2-4 AM",
  "type": "system",
  "targetUsers": ["user_id_1", "user_id_2"],
  "targetRoles": ["organizer", "admin"],
  "expiresAt": "2024-12-31T23:59:59Z",
  "priority": 3
}
```

#### Get Announcements
- **Endpoint**: `GET /api/announcements`
- **Query Params**: `page`, `limit`, `type`, `status`
- **Response**:
```json
{
  "announcements": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Update Announcement
- **Endpoint**: `PATCH /api/announcements/:id`
- **Auth**: Admin only

#### Delete Announcement
- **Endpoint**: `DELETE /api/announcements/:id`
- **Auth**: Admin only

#### Toggle Announcement Status
- **Endpoint**: `PATCH /api/announcements/:id/toggle-status`
- **Auth**: Admin only

### Data Export API
Export user and event data in PDF or Excel format.

#### Export Users to PDF
- **Endpoint**: `GET /api/export/users/pdf`
- **Query Params**: `role`, `department`, `enrollmentNo`
- **Response**: PDF file download

#### Export Users to Excel
- **Endpoint**: `GET /api/export/users/excel`
- **Query Params**: `role`, `department`, `enrollmentNo`
- **Response**: Excel file download

#### Export Events to PDF
- **Endpoint**: `GET /api/export/events/pdf`
- **Query Params**: `category`, `status`, `from`, `to`
- **Response**: PDF file download

#### Export Events to Excel
- **Endpoint**: `GET /api/export/events/excel`
- **Query Params**: `category`, `status`, `from`, `to`
- **Response**: Excel file download

### Two-Factor Authentication API
Manage 2FA for admin users.

#### Enable 2FA
- **Endpoint**: `POST /api/2fa/enable`
- **Auth**: Admin only
- **Response**:
```json
{
  "message": "2FA enabled successfully",
  "backupCodes": ["ABC123", "DEF456", ...],
  "warning": "Save these backup codes securely..."
}
```

#### Send 2FA Code
- **Endpoint**: `POST /api/2fa/send-code`
- **Auth**: Admin only
- **Body**:
```json
{
  "userId": "admin_user_id"
}
```

#### Verify 2FA Code
- **Endpoint**: `POST /api/2fa/verify-code`
- **Auth**: Admin only
- **Body**:
```json
{
  "userId": "admin_user_id",
  "code": "123456"
}
```

#### Verify Backup Code
- **Endpoint**: `POST /api/2fa/verify-backup`
- **Auth**: Admin only
- **Body**:
```json
{
  "backupCode": "ABC123"
}
```

#### Get 2FA Status
- **Endpoint**: `GET /api/2fa/status`
- **Auth**: Admin only

#### Disable 2FA
- **Endpoint**: `POST /api/2fa/disable`
- **Auth**: Admin only

#### Regenerate Backup Codes
- **Endpoint**: `POST /api/2fa/regenerate-backup`
- **Auth**: Admin only

### Bookmarks API
Manage user bookmarks for events and media items.

#### Add Event Bookmark
- **Endpoint**: `POST /api/bookmarks/events/:eventId`
- **Response**:
```json
{
  "message": "Event bookmarked successfully",
  "bookmarks": ["event_id_1", "event_id_2"]
}
```

#### Remove Event Bookmark
- **Endpoint**: `DELETE /api/bookmarks/events/:eventId`

#### Check Event Bookmark
- **Endpoint**: `GET /api/bookmarks/events/:eventId/check`
- **Response**:
```json
{
  "isBookmarked": true
}
```

#### Get Bookmarked Events
- **Endpoint**: `GET /api/bookmarks/events`
- **Query Params**: `page`, `limit`

#### Add Media Bookmark
- **Endpoint**: `POST /api/bookmarks/media/:mediaId`

#### Remove Media Bookmark
- **Endpoint**: `DELETE /api/bookmarks/media/:mediaId`

#### Check Media Bookmark
- **Endpoint**: `GET /api/bookmarks/media/:mediaId/check`

#### Get Bookmarked Media
- **Endpoint**: `GET /api/bookmarks/media`
- **Query Params**: `page`, `limit`

#### Get Bookmark Statistics
- **Endpoint**: `GET /api/bookmarks/stats`
- **Response**:
```json
{
  "totalEvents": 5,
  "totalMedia": 3,
  "totalBookmarks": 8
}
```

### Notifications API
Manage real-time notifications with WebSocket support.

#### Get Notifications
- **Endpoint**: `GET /api/notifications`
- **Query Params**: `page`, `limit`, `type`, `isRead`, `priority`

#### Get Notification
- **Endpoint**: `GET /api/notifications/:id`

#### Mark as Read
- **Endpoint**: `PATCH /api/notifications/:id/read`

#### Mark All as Read
- **Endpoint**: `PATCH /api/notifications/read-all`

#### Delete Notification
- **Endpoint**: `DELETE /api/notifications/:id`

#### Delete Read Notifications
- **Endpoint**: `DELETE /api/notifications/read-all`

#### Get Notification Statistics
- **Endpoint**: `GET /api/notifications/stats`
- **Response**:
```json
{
  "total": 25,
  "unread": 5,
  "read": 20,
  "byType": {
    "event": 10,
    "system": 8,
    "announcement": 7
  }
}
```

#### Send Bulk Notifications (Admin)
- **Endpoint**: `POST /api/notifications/bulk`
- **Auth**: Admin only
- **Body**:
```json
{
  "recipientIds": ["user_id_1", "user_id_2"],
  "type": "system",
  "title": "Important Update",
  "message": "System maintenance scheduled",
  "priority": "high"
}
```

## WebSocket Integration

### Connection
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// Join user-specific room
socket.emit('join', userId);

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
});
```

### Notification Structure
```javascript
{
  id: "notification_id",
  type: "event",
  title: "New Event Created",
  message: "A new event has been created",
  data: { eventId: "event_id" },
  priority: "medium",
  createdAt: "2024-01-01T00:00:00Z"
}
```

## Security Features

### Rate Limiting
- General API calls: 200 requests per 5 minutes
- Authentication: 20 requests per 15 minutes
- Bulk notifications: 10 requests per hour
- Notifications: 100 requests per 15 minutes

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (participant, organizer, admin)
- 2FA for admin accounts with email verification
- Account lockout after failed 2FA attempts

### Data Validation
- Input sanitization and validation
- SQL injection prevention through parameterized queries
- XSS protection through input encoding

## Scalability Features

### Database Optimization
- MongoDB indexes for efficient queries
- TTL indexes for automatic data cleanup
- Pagination for large datasets
- Connection pooling

### Caching Strategy
- Redis integration for session management
- Database query result caching
- Rate limiting with memory store

### Performance Monitoring
- Request logging with Morgan
- Error tracking and reporting
- Database query performance monitoring

## Error Handling

### Standard Error Responses
```json
{
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

### Common Error Codes
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_CREDENTIALS`: Authentication failed
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input data

## Environment Variables

### Required Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/eventsphere
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:5173
```

## Testing

### Unit Tests
Run tests with:
```bash
npm test
```

### API Testing
Use tools like Postman or curl for endpoint testing.

### WebSocket Testing
Use browser developer tools or WebSocket clients for real-time testing.

## Deployment

### Production Considerations
1. Use HTTPS for all connections
2. Configure CORS properly
3. Set up monitoring and logging
4. Implement backup strategies
5. Configure rate limiting based on load
6. Set up database replication

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "app.js"]
```

## Support

For API support or questions:
- Check this documentation first
- Review existing code comments
- Contact the development team

## Changelog

### Version 1.0.0
- Initial implementation of all new APIs
- WebSocket integration for real-time notifications
- 2FA implementation for admin accounts
- Data export functionality
- Bookmark management system
- Comprehensive security measures