[README.md](https://github.com/user-attachments/files/33587653/README.md)
# 🕒 Time Tracker Application - Production Ready

A comprehensive time tracking web application built with React frontend and Spring Boot backend, featuring role-based access control for managers and employees.

## 🚀 Features

### Manager Features
- **Employee Management**: Add, view, and manage employee accounts
- **Project Management**: Create, edit, and manage projects
- **Assignment Management**: Assign employees to specific projects
- **Reports & Analytics**: Generate detailed time reports for projects and employees
- **Dashboard Overview**: View system-wide statistics and activity

### Employee Features
- **Secure Login**: Individual employee authentication
- **Time Clock**: Clock in/out functionality with project selection
- **Project Restrictions**: Can only clock in to assigned projects (Security Feature)
- **Personal Dashboard**: View assigned projects and work history
- **Timesheet**: Personal time tracking history and hours worked
- **Password Management**: Change password functionality

### Security Features
- **Server-Side Validation**: Backend validates all project assignments before clock-in
- **Role-Based Access**: Manager and Employee role separation
- **Password Encryption**: BCrypt password hashing
- **CORS Protection**: Configured for secure cross-origin requests
- **Input Validation**: Comprehensive data validation

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 19.1.1 with Vite build tool
- **Styling**: Tailwind CSS 4.0.0
- **State Management**: React Hooks
- **API Client**: Centralized API management with error handling
- **Authentication**: Session-based authentication with Firebase Auth integration

### Backend (Spring Boot + Java)
- **Framework**: Spring Boot 3.2.5 with Java 17
- **Database**: Firebase Firestore (NoSQL)
- **Security**: BCrypt password hashing, server-side validation
- **API**: RESTful API with comprehensive endpoints
- **Build Tool**: Maven 3.x

### Database (Firebase Firestore)
- **Collections**: employees, projects, timeEntries, projectAssignments
- **Real-time**: Firestore real-time updates
- **Scalable**: Cloud-native NoSQL database
- **Security**: Firebase security rules

## 📋 Prerequisites

- **Java**: JDK 17 or higher
- **Node.js**: Version 18+ with npm
- **Maven**: 3.6+ (or use included Maven wrapper)
- **Firebase**: Valid Firebase project with Firestore enabled

## 🚀 Quick Start

### 1. Clone Repository
\`\`\`bash
git clone <repository-url>
cd time-tracker-application
\`\`\`

### 2. Backend Setup
\`\`\`bash
cd firebase/firebase

# Configure Firebase (place your serviceAccountKey.json in src/main/resources/)
# Update application.properties with your Firebase configuration

# Start backend server
./mvnw spring-boot:run
# Server will start on http://localhost:8080
\`\`\`

### 3. Frontend Setup
\`\`\`bash
cd "time tracker web develpomet(a)"

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend will start on http://localhost:5173 (or next available port)
\`\`\`

## 🔧 Configuration

### Backend Configuration (\`application.properties\`)
\`\`\`properties
spring.application.name=firebase

# Firebase Collections
firebase.collection.employees=employees
firebase.collection.projects=projects
firebase.collection.timeEntries=timeEntries
firebase.collection.assignments=projectAssignments

# Firebase Service Account Path
firebase.serviceAccount.path=path/to/serviceAccountKey.json

# Email Configuration (Optional)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password

# Application Settings
app.mail.from=no-reply@timetracker.local
app.frontend.loginUrl=http://localhost:5173
\`\`\`

### Frontend Configuration (\`.env\`)
\`\`\`properties
VITE_API_BASE=http://localhost:8080/api/v1
\`\`\`

## 🔑 Default Login Credentials

### Manager Account
- **Username**: `manager`
- **Password**: `Adminmanager123@`

### Employee Accounts
Employee accounts are created through the manager dashboard or registration process.

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/v1/employees/login` - Employee/Manager login
- `POST /api/v1/employees/register` - Employee registration
- `POST /api/v1/employees/change-password` - Change password
- `POST /api/v1/employees/forgot-password` - Password reset

### Employee Management (Manager Only)
- `GET /api/v1/employees` - Get all employees
- `GET /api/v1/employees/{id}` - Get employee by ID
- `POST /api/v1/employees` - Create new employee
- `PUT /api/v1/employees/{id}` - Update employee
- `DELETE /api/v1/employees/{id}` - Delete employee

### Project Management (Manager Only)
- `GET /api/v1/projects` - Get all projects
- `GET /api/v1/projects/{id}` - Get project by ID
- `POST /api/v1/projects` - Create new project
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project
- `GET /api/v1/projects/assigned` - Get assigned projects for employee

### Assignment Management
- `POST /api/v1/assignments` - Assign employee to project
- `DELETE /api/v1/assignments/{projectId}/{employeeId}` - Remove assignment
- `GET /api/v1/assignments/project/{projectId}` - Get project assignments
- `GET /api/v1/assignments/employee/{employeeId}` - Get employee assignments

### Time Tracking
- `POST /api/v1/clock/in` - Clock in to project
- `POST /api/v1/clock/out` - Clock out from project
- `GET /api/v1/clock/active/{employeeId}` - Get active time entry
- `GET /api/v1/clock/hours-worked` - Get hours worked
- `GET /api/v1/clock/recent` - Get recent time entries

### Reports
- `GET /api/v1/reports/timesheet/{employeeId}` - Employee timesheet
- `GET /api/v1/reports/projects/{projectId}` - Project report
- `GET /api/v1/reports/employees/{employeeId}` - Employee report

## 🧪 Testing

### Manual Testing Workflow

1. **Manager Flow**:
   - Login as manager (`manager` / `Adminmanager123@`)
   - Create employees and projects
   - Assign employees to projects
   - Generate reports

2. **Employee Flow**:
   - Login with employee credentials
   - View assigned projects only
   - Clock in/out to assigned projects
   - View personal timesheet

### API Testing
Use the built-in test suite:
\`\`\`javascript
import TimeTrackerTestSuite from './src/utils/testSuite.js';

const testSuite = new TimeTrackerTestSuite();
testSuite.runAllTests();
\`\`\`

## 🔒 Security Features

1. **Server-Side Validation**: All project assignments validated on backend
2. **Password Hashing**: BCrypt encryption for all passwords
3. **Role-Based Access**: Separate manager/employee permissions
4. **CORS Protection**: Configured for production use
5. **Input Sanitization**: Comprehensive data validation
6. **Audit Logging**: Time clock actions logged with employee verification

## 📊 Database Schema

### Collections Structure

#### employees
\`\`\`json
{
  "id": "string",
  "employeeId": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "username": "string",
  "password": "string (hashed)",
  "status": "active|inactive|invited",
  "yearOfJoining": "number",
  "requiresPasswordChange": "boolean",
  "createdAt": "timestamp"
}
\`\`\`

#### projects
\`\`\`json
{
  "id": "string",
  "projectTitle": "string",
  "description": "string",
  "anticipatedHours": "number",
  "assignedEmployees": ["employeeId1", "employeeId2"],
  "createdAt": "timestamp"
}
\`\`\`

#### timeEntries
\`\`\`json
{
  "id": "string",
  "employeeId": "string",
  "projectId": "string",
  "clockInTime": "timestamp",
  "clockOutTime": "timestamp",
  "status": "clocked-in|clocked-out",
  "hoursWorked": "number"
}
\`\`\`

#### projectAssignments
\`\`\`json
{
  "id": "string",
  "projectId": "string",
  "employeeId": "string",
  "assignedAt": "timestamp",
  "assignedBy": "string"
}
\`\`\`

## 🚀 Deployment

### Production Checklist
- [ ] Update Firebase configuration
- [ ] Configure production database
- [ ] Set environment variables
- [ ] Update CORS origins
- [ ] Configure SSL/HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Security audit complete

### Environment Variables
\`\`\`bash
# Backend
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
SPRING_PROFILES_ACTIVE=production

# Frontend
VITE_API_BASE=https://your-production-api.com/api/v1
\`\`\`

## 📞 Support

For issues or questions:
1. Check the logs in both frontend and backend
2. Verify Firebase configuration
3. Test API endpoints individually
4. Review CORS settings for cross-origin issues

## 🔄 Version Information

- **Application Version**: 1.0.0
- **React**: 19.1.1
- **Spring Boot**: 3.2.5
- **Java**: 17
- **Node.js**: 18+

---

**🎉 Production Ready Features:**
✅ Comprehensive API coverage
✅ Security validation on all endpoints
✅ Role-based access control
✅ Real-time database integration
✅ Responsive UI design
✅ Error handling and logging
✅ Test suite included
✅ Production deployment ready
