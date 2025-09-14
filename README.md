# EventSphere - College Event Management System

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8+-green.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3+-blue.svg)](https://tailwindcss.com/)

A comprehensive, modern event management platform built for colleges and universities. EventSphere streamlines the entire event lifecycle from creation to completion, featuring role-based access control, dynamic capacity management, automated notifications, and a stunning glass morphism UI.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Screenshots](#screenshots)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Project Overview

EventSphere is a full-stack web application designed to revolutionize college event management. It provides a seamless platform for students, organizers, and administrators to discover, create, manage, and participate in campus events. The system incorporates modern web technologies with a focus on user experience, featuring real-time updates, automated workflows, and comprehensive analytics.

### Key Objectives

- **Streamline Event Management**: Centralized platform for all event-related activities
- **Enhance User Experience**: Intuitive interface with modern design patterns
- **Automate Workflows**: Reduce manual processes through automation
- **Ensure Security**: Role-based access control and data protection
- **Provide Analytics**: Track participation and event performance

## ✨ Features

### Core Functionality
- **Event Discovery & Registration**: Browse and register for events with real-time availability
- **Dynamic Seat Management**: Automatic capacity tracking with waitlist support
- **Role-Based Access Control**: Comprehensive permission system for different user types
- **Event Approval Workflow**: Admin oversight for event creation and modifications
- **Attendance Tracking**: QR code-based check-in system with manual override
- **Certificate Generation**: Automated certificate issuance for event participants
- **Ticket Generation**: ICS calendar integration for event reminders
- **Email Notifications**: Automated email system for all major events
- **Media Gallery**: Photo and video management for event documentation
- **Feedback System**: Post-event feedback collection and analysis

### Advanced Features
- **Real-time Updates**: Live event status and registration updates
- **Mobile Responsive**: Optimized for all device types
- **Glass Morphism UI**: Modern, translucent design with backdrop blur effects
- **Dark Theme**: Eye-friendly dark mode interface
- **Search & Filtering**: Advanced event discovery with multiple filters
- **Dashboard Analytics**: Comprehensive reporting for organizers and admins
- **Bulk Operations**: Mass user management and event operations
- **Export Functionality**: Data export in multiple formats

### Event Categories
- Technical Events (Coding, Robotics, AI, etc.)
- Cultural Events (Music, Dance, Drama, etc.)
- Sports Events (Competitions, Tournaments, etc.)
- Workshops (Skill development sessions)
- Seminars (Educational talks and lectures)
- Competitions (Various academic and non-academic contests)

## 🛠 Tech Stack

### Frontend
- **React 18+** - Modern JavaScript library for building user interfaces
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library for React
- **React Router** - Declarative routing for React
- **Axios** - HTTP client for API requests
- **React Query** - Data fetching and state management
- **Lucide React** - Beautiful icon library

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token for authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email sending service
- **Express Rate Limit** - API rate limiting
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🚀 Installation

### Prerequisites
- Node.js 18 or higher
- MongoDB 8 or higher
- npm or yarn package manager

### Backend Setup
```bash
# Clone the repository
git clone <repository-url>
cd TechWiz2025

# Install backend dependencies
cd backend
npm install

# Create environment file
cp .env.example .env
# Configure your environment variables
```

### Frontend Setup
```bash
# Install frontend dependencies
cd ../frontend
npm install

# Create environment file
cp .env.example .env
# Configure your environment variables
```

## ⚙️ Environment Setup

### Backend Environment Variables (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/eventsphere
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRE=30d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Server
PORT=5000
```

### Frontend Environment Variables (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_FRONTEND_URL=http://localhost:5173
```

## 📖 Usage Guide

### For Participants
1. **Registration**: Create an account with your college email
2. **Browse Events**: Explore events by category, date, or popularity
3. **Register**: Click "Register" on events of interest
4. **Track Participation**: View registered events in your dashboard
5. **Receive Notifications**: Get email updates about event changes
6. **Download Tickets**: Access ICS files for calendar integration
7. **Mark Attendance**: Use QR codes or manual check-in
8. **Get Certificates**: Download certificates post-event

### For Organizers
1. **Create Events**: Submit event proposals with detailed information
2. **Manage Registrations**: Approve/reject participant registrations
3. **Track Attendance**: Monitor participant check-ins
4. **Send Updates**: Communicate with registered participants
5. **Generate Reports**: View event analytics and feedback
6. **Issue Certificates**: Bulk certificate generation

### For Administrators
1. **User Management**: Create/manage organizer accounts
2. **Event Oversight**: Approve/reject event proposals
3. **System Monitoring**: View platform-wide analytics
4. **Content Management**: Manage event categories and settings
5. **Bulk Operations**: Mass user and event management

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/v1/auth/register          - User registration
POST   /api/v1/auth/login             - User login
GET    /api/v1/auth/me                - Get current user profile
PATCH  /api/v1/auth/me                - Update user profile
POST   /api/v1/auth/logout            - User logout
GET    /api/v1/auth/verify-email/:token - Email verification
POST   /api/v1/auth/resend-verification - Resend verification
POST   /api/v1/auth/request-password-reset - Password reset request
POST   /api/v1/auth/reset-password    - Reset password
POST   /api/v1/auth/refresh-token     - Refresh access token
```

### Event Endpoints
```
GET    /api/v1/events                 - List all events
GET    /api/v1/events/:id             - Get event details
GET    /api/v1/events/:id/seats       - Get available seats
POST   /api/v1/events                 - Create new event (organizer/admin)
PATCH  /api/v1/events/:id             - Update event (organizer/admin)
PATCH  /api/v1/events/:id/approve     - Approve event (admin)
PATCH  /api/v1/events/:id/reject      - Reject event (admin)
POST   /api/v1/events/:id/cancel      - Cancel event (organizer/admin)
DELETE /api/v1/events/:id             - Delete event (organizer/admin)
```

### Registration Endpoints
```
POST   /api/v1/registrations           - Register for event
GET    /api/v1/registrations/me       - Get user's registrations
GET    /api/v1/registrations/event/:eventId - Get event registrations (organizer/admin)
PATCH  /api/v1/registrations/:id/approve - Approve registration (organizer/admin)
PATCH  /api/v1/registrations/:id/reject - Reject registration (organizer/admin)
GET    /api/v1/registrations/:id/ticket - Download ticket
POST   /api/v1/registrations/:id/cancel - Cancel registration
```

### Attendance Endpoints
```
POST   /api/v1/attendance              - Mark attendance (organizer/admin)
GET    /api/v1/attendance/event/:eventId - Get event attendance (organizer/admin)
```

### Admin Endpoints
```
GET    /api/v1/admin/users             - List all users
PATCH  /api/v1/admin/users/:id/role    - Update user role
DELETE /api/v1/admin/users/:id         - Delete user
POST   /api/v1/admin/organizers        - Create organizer
GET    /api/v1/admin/organizers        - List organizers
PATCH  /api/v1/admin/organizers/:id    - Update organizer
DELETE /api/v1/admin/organizers/:id    - Delete organizer
```

### Certificate Endpoints
```
POST   /api/v1/certificates             - Issue certificate (organizer/admin)
GET    /api/v1/certificates/me         - Get user's certificates
```

## 👥 User Roles and Permissions

### Participant
- Browse and search events
- Register for events
- View personal dashboard
- Download tickets and certificates
- Provide event feedback
- Access media gallery

### Organizer
- All participant permissions
- Create and manage events
- Approve/reject registrations
- Mark attendance
- Send notifications to participants
- Generate certificates
- View event analytics

### Administrator
- All organizer permissions
- Approve/reject event proposals
- Manage user accounts and roles
- Create organizer accounts
- System-wide analytics and reporting
- Platform configuration
- Bulk operations

## 📸 Screenshots

### Landing Page
![Landing Page](screenshots/landing-page.png)
*Modern glass morphism design with gradient backgrounds and smooth animations*

### Event Dashboard
![Event Dashboard](screenshots/event-dashboard.png)
*Comprehensive event management interface with real-time updates*

### Registration System
![Registration](screenshots/registration.png)
*Seamless registration process with dynamic seat tracking*

### Admin Panel
![Admin Panel](screenshots/admin-panel.png)
*Powerful admin interface for system management*

## 🚀 Deployment

### Production Environment Setup
1. **Database**: Set up MongoDB Atlas or self-hosted MongoDB
2. **Backend**: Deploy to services like Heroku, Railway, or AWS
3. **Frontend**: Deploy to Vercel, Netlify, or AWS S3/CloudFront
4. **Email Service**: Configure SMTP service (Gmail, SendGrid, etc.)
5. **Environment Variables**: Set production environment variables

### Docker Deployment
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Build Commands
```bash
# Backend
npm run build
npm start

# Frontend
npm run build
npm run preview
```

## 🤝 Contributing

We welcome contributions to EventSphere! Please follow these guidelines:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Install dependencies: `npm install` in both backend and frontend
4. Make your changes
5. Run tests: `npm test`
6. Commit changes: `git commit -m 'Add your feature'`
7. Push to branch: `git push origin feature/your-feature`
8. Create a Pull Request

### Code Standards
- Follow ESLint configuration
- Use meaningful commit messages
- Write comprehensive documentation
- Add tests for new features
- Ensure mobile responsiveness

### Reporting Issues
- Use GitHub Issues for bug reports
- Include detailed steps to reproduce
- Provide environment information
- Attach screenshots if applicable

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Icons**: Lucide React for beautiful icons
- **Fonts**: Inter and Poppins from Google Fonts
- **Animations**: Framer Motion for smooth transitions
- **UI Components**: Tailwind CSS for utility-first styling

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**EventSphere** - Making college events management effortless and engaging! 🎉