# Changelog

All notable changes to AIRBAND Customers Log Management (CLM) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-12-20

### 🔐 Security - Authentication System
- Added complete user authentication system with login page
- Implemented session-based authentication with secure token management
- Added SHA-256 password hashing for user credentials
- 24-hour session expiration for security
- Protected all API endpoints with authentication middleware
- Support for authentication tokens in both headers and query params (for file downloads)

### 👥 User Management
- Added comprehensive user management interface (Settings page)
- Role-based access control (Admin and User roles)
- Admin users can create, update, and delete other users
- User listing with last login timestamps
- Prevent deletion of the last admin user for safety
- Default admin account created on first startup (admin/admin123)

### 🎨 UI/UX Improvements
- **Fixed**: Compression complete dialog now shows actual saved MB and compressed tables count instead of "undefined"
- Replaced alert() dialogs with modern toast notifications (using Sonner)
- Added user session display in header (username and logout button)
- Settings link in navigation (admin only)
- Login page with AIRBAND branding

### 📄 Pagination
- Added pagination to Log Tables on Monitoring page (25 items per page)
- Page navigation controls with numbered buttons
- Display of total items and current range

### 🔒 Access Control
- Database compression restricted to admin users only
- Log deletion restricted to admin users only
- Settings page accessible only to admin users
- All routes protected with authentication check

### 📝 Documentation
- Updated README with authentication setup instructions
- Added API endpoint documentation for auth and user management
- Security best practices and default credentials warning
- Updated version history and features list

### 🛠️ Technical Changes
- Created `auth.ts` backend module for authentication logic
- Added `Login.tsx` and `Settings.tsx` pages
- Implemented `ProtectedRoute` component for route guarding
- Updated `App.tsx` with authentication routing
- Modified `Header.tsx` to show user info and logout
- Updated all API calls to include authentication tokens
- Modified backend server.ts with auth middleware

### Breaking Changes
- All API endpoints now require authentication
- Existing integrations will need to authenticate before accessing any endpoint

## [2.0.1] - 2025-12-19

### Fixed
- Monitoring page improvements
- Database optimization and compression features

## [2.0.0] - 2025-12-18

### Added
- Statistics dashboard with interactive charts
- Database monitoring page with real-time metrics
- Excel export (XLSX format) functionality
- Database backup (full and date range)
- One-click table compression
- Batch deletion with double confirmation
- Schema optimization for better performance
- InnoDB compression support for space savings
- Automated alerts for database size

### Changed
- Optimized database column types
- Improved indexing strategy
- Backward-compatible database migrations

## [1.0.1] - 2025-12-17

### Added
- CSV export functionality
- System status indicators (Mikrotik connection)
- PPPoE username extraction from logs

### Fixed
- Build process improvements
- UI optimization and polish

## [1.0.0] - 2025-12-16

### Added
- Initial release
- Real-time log reception via UDP syslog (port 4950)
- Dynamic daily table creation
- Advanced search and filtering
- Modern dark theme UI with glassmorphism
- Mikrotik log parsing
- Basic statistics and monitoring

---

## Release Notes

### Version 3.0.0 - Security & User Management

This is a major release focusing on security and user management capabilities. 

**⚠️ IMPORTANT**: After upgrading to v3.0.0, all users must authenticate to access the system. The default admin credentials are:
- Username: `admin`
- Password: `admin123`

**Please change these credentials immediately after first login!**

**Migration Notes**:
- The system will automatically create the `users` table on first startup
- All existing API integrations will need to be updated to include authentication
- No data loss - all existing log data remains intact

**Admin Features**:
- Full access to all system features
- User management capabilities
- Database operations (compression, deletion)

**User Features**:
- Read-only access to logs and statistics
- Cannot modify system settings or users
- Cannot perform destructive operations
