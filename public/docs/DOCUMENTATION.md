# PodCount Application Documentation

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **NextAuth.js** - Authentication solution
- **React Hook Form** - Form handling
- **SWR** - Data fetching and caching
- **date-fns** - Date manipulation
- **xlsx** - Excel file generation

### Backend
- **Next.js API Routes** - Backend API endpoints
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Primary database
- **NextAuth.js** - Authentication and session management
- **bcrypt** - Password hashing
- **JSON Web Tokens** - Session management

### Infrastructure
- **Vercel** - Hosting and deployment
- **PostgreSQL (Vercel)** - Database hosting
- **GitHub** - Version control
- **ESLint** - Code linting
- **Prettier** - Code formatting

## User Roles and Permissions

### 1. Administrator (ADMIN)
- Full system access
- User management
- Form management
- Data access across all factories
- System configuration

### 2. Supervisor
- Limited to assigned factories
- Form data management
- Report generation
- User supervision

### 3. Field Officer
- Data entry
- Basic form access
- Limited data viewing

## Core Features

### 1. Authentication System
- Secure login/logout
- Role-based access control
- Session management
- Password reset functionality
- Remember me option

### 2. User Management (Admin Only)
- Create new users
- Assign roles (Admin/Supervisor/Field Officer)
- Manage user permissions
- Deactivate/reactivate users
- Reset user passwords
- View user activity logs

### 3. Form Management
#### Admin Capabilities
- Create new forms
- Edit existing forms
- Delete forms and associated data
- Assign forms to factories
- Manage form access permissions
- View all forms across factories
- Export form data
- Archive forms

#### Form Creation Features
- Dynamic field types
  - Text
  - Number
  - Date
  - Dropdown
  - Multiple choice
  - Location
  - File upload
- Required field marking
- Field validation rules
- Form templates
- Form versioning

### 4. Factory Management (Admin Only)
- Add new factories
- Edit factory details
- Assign supervisors to factories
- View factory performance metrics
- Manage factory-specific settings
- Archive/deactivate factories

### 5. Data Entry System
- Form submission
- Data validation
- File attachments
- GPS location capture
- Offline data collection
- Batch upload support
- Entry review process

### 6. Data Management
#### Admin Features
- View all data across factories
- Export data (CSV, Excel)
- Delete entries
- Audit trail
- Data backup
- Bulk operations

#### Supervisor Features
- View factory-specific data
- Export assigned form data
- Review submissions
- Generate reports

### 7. Access Control System (Admin Only)
- Manage user permissions
- Form access control
- Factory access restrictions
- Data visibility rules
- API access management
- Session management

### 8. Reporting System
#### Admin Reports
- System-wide analytics
- User activity reports
- Form submission statistics
- Factory performance metrics
- Data quality reports
- Custom report generation

#### Supervisor Reports
- Factory-specific reports
- Team performance metrics
- Data collection statistics
- Quality control reports

### 9. System Configuration (Admin Only)
- General settings
- Email notifications
- System backup settings
- API configuration
- Security settings
- Logging preferences

### 10. API Integration
- RESTful API endpoints
- Authentication tokens
- Rate limiting
- Webhook support
- Integration documentation
- API usage monitoring

## Database Schema

### Core Tables
1. **Users**
   - id
   - name
   - email
   - password
   - role
   - factoryId
   - createdAt
   - updatedAt

2. **Forms**
   - id
   - name
   - type
   - fields
   - factoryId
   - createdBy
   - createdAt
   - updatedAt

3. **FormAccess**
   - id
   - formId
   - userId
   - canView
   - canEdit
   - canDelete
   - createdAt
   - updatedAt

4. **FormResponses**
   - id
   - formId
   - userId
   - data
   - createdAt
   - updatedAt

5. **Factories**
   - id
   - name
   - location
   - type
   - createdAt
   - updatedAt

## Security Features

1. **Authentication**
   - JWT-based authentication
   - Session management
   - Password hashing
   - Rate limiting
   - CSRF protection

2. **Authorization**
   - Role-based access control
   - Permission-based access
   - Factory-level isolation
   - Data access restrictions

3. **Data Protection**
   - Data encryption
   - Secure file storage
   - Audit logging
   - Backup systems

## API Endpoints

### Authentication
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/reset-password

### Users
- GET /api/users
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id

### Forms
- GET /api/forms
- POST /api/forms
- PUT /api/forms/:id
- DELETE /api/forms/:id

### Form Responses
- GET /api/responses
- POST /api/responses
- GET /api/responses/:id
- PUT /api/responses/:id
- DELETE /api/responses/:id
- POST /api/responses/import

### Factories
- GET /api/factories
- POST /api/factories
- PUT /api/factories/:id
- DELETE /api/factories/:id 