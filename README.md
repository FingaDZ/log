# AIRBAND Customers Log Management (CLM)

**Version:** 3.0.0  
**Status:** Production Ready ✅

A comprehensive log management system for Mikrotik/RADIUS logs with real-time monitoring, analytics, user authentication, and database optimization.

## 🚀 Features

### Core Functionality
- **Real-time Log Reception**: UDP syslog server (port 4950)
- **Dynamic Daily Tables**: Automatic table creation per day
- **PPPoE Username Extraction**: Parse and store usernames from Mikrotik logs
- **Advanced Search & Filtering**: Filter by date, IP, user, protocol
- **Responsive UI**: Modern dark theme with glassmorphism
- **🔐 User Authentication**: Secure login system with role-based access control
- **👥 User Management**: Admin interface to create, update, and delete users

### Analytics & Monitoring
- **Statistics Dashboard**: 
  - Top 10 users by activity
  - Protocol distribution (pie chart)
  - Top 10 destination IPs
  - Date-based analytics
- **Database Monitoring**:
  - Real-time size tracking
  - Disk space monitoring
  - Automated alerts (>1GB, >5GB)
  - Table-level metrics with pagination (25 items per page)

### Data Management
- **Export Capabilities**:
  - CSV export (Excel-compatible)
  - Native XLSX export
  - Date range selection
- **Database Backup**:
  - Full database dump
  - Date range backup
  - SQL format (mysqldump)
- **Batch Operations**:
  - Delete logs by date range (Admin only)
  - Double confirmation required
  - Safety warnings

### Optimization
- **InnoDB Compression**:
  - One-click table compression (Admin only)
  - 50-70% space reduction
  - Automatic for new tables
  - Fixed progress display with toast notifications
- **Schema Optimization**:
  - Optimized column types
  - Efficient indexing
  - Backward compatible
- **Archiving System**:
  - Monthly log archiving
  - Gzip compression
  - Archive search (planned)

### Security & Access Control
- **Authentication System**:
  - Session-based authentication with JWT-style tokens
  - Password hashing with SHA-256
  - 24-hour session expiration
- **Role-Based Access**:
  - **Admin**: Full access to all features including user management, compression, and deletion
  - **User**: Read-only access to logs, statistics, and monitoring
- **Protected Endpoints**: All API routes require authentication
- **Default Credentials**: admin / admin123 (change after first login)

### System Status
- **Live Indicators**:
  - Mikrotik connection status (green/gray)
  - Auto-refresh every 5 seconds
  - Last log timestamp
- **User Session**: Display logged-in username and logout option
- **RADIUS Integration**: Placeholder for future

## 📋 Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Shadcn UI + Tailwind CSS
- TanStack Query (data fetching)
- Recharts (analytics)

**Backend:**
- Node.js + Express
- TypeScript
- MySQL2 (MariaDB connector)
- Date-fns (date handling)

**Database:**
- MariaDB 10.x
- Dynamic daily tables (`logs_YYYYMMDD`)
- InnoDB with compression

**Deployment:**
- PM2 (process management)
- Ubuntu 22.04
- Serve (static file serving)

## 🔧 Installation

### Prerequisites
```bash
# Ubuntu 22.04
sudo apt update
sudo apt install -y nodejs npm mariadb-server git

# Install PM2 globally
sudo npm install -g pm2 serve
```

### Database Setup
```bash
mysql -u root -p
```

```sql
CREATE DATABASE logser;
CREATE USER 'your_db_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON logser.* TO 'your_db_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Application Setup
```bash
# Clone repository
git clone https://github.com/FingaDZ/log.git
cd log

# Frontend
npm install
npm run build

# Backend
cd backend
cp .env.example .env
# IMPORTANT: Edit .env with YOUR database credentials
# DB_USER=your_db_user
# DB_PASSWORD=your_secure_password
# DB_NAME=logser
npm install
npm run build
cd ..

# Start services
pm2 start serve --name clm-frontend -- dist -l 8080
pm2 start backend/dist/server.js --name clm-backend
pm2 save
pm2 startup  # Follow instructions
```

### Firewall Configuration
```bash
sudo ufw allow 8080/tcp  # Frontend
sudo ufw allow 3000/tcp  # Backend API
sudo ufw allow 4950/udp  # Syslog
```

## 📊 Usage

### Access
- **Frontend**: http://SERVER_IP:8080
- **Backend API**: http://SERVER_IP:3000/api

### Mikrotik Configuration
```
/system logging action
add name=remote-syslog remote=SERVER_IP remote-port=4950 target=remote

/system logging
add action=remote-syslog topics=firewall
```

### Navigation
- **Logs**: Main log viewer with filters
- **Statistics**: Analytics and charts
- **Monitoring**: Database health and management

## 🗜️ Database Optimization

### Compression
1. Navigate to Monitoring page
2. Click "Compress All Tables"
3. View savings (typically 50-70%)

### Backup
1. Navigate to Monitoring page
2. Select date range or full backup
3. Download SQL dump

### Archiving (Manual)
```bash
cd ~/log/backend
node dist/archive.js
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify session token
- `POST /api/auth/logout` - User logout

### User Management (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Log Management
- `GET /api/status` - System heartbeat (authenticated)
- `GET /api/logs` - Fetch logs with filters (authenticated)
- `GET /api/stats?date=YYYY-MM-DD` - Statistics (authenticated)
- `GET /api/monitoring` - Database metrics (authenticated)
- `GET /api/export?date=YYYY-MM-DD&format=csv|xlsx` - Export (authenticated)

### Database Operations (Admin Only)
- `GET /api/backup?start_date=&end_date=` - Database backup
- `POST /api/compress-tables` - Compress tables
- `POST /api/delete-logs` - Batch deletion

## 🔐 First Time Setup

After installation, the system creates a default admin user:
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change the default password immediately after first login!

1. Login with default credentials
2. Navigate to **Settings** (admin only)
3. Edit your admin user
4. Set a strong new password

## 🔄 Updates

```bash
cd ~/log
git pull
npm install
npm run build
pm2 restart clm-frontend

cd backend
npm install
npm run build
pm2 restart clm-backend
```

## 📈 Version History

### v3.0.0 (2025-12-20) - Security & UX Update
- 🔐 **Authentication System**: Secure login with session management
- 👥 **User Management**: Admin interface for creating/managing users
- 🛡️ **Role-Based Access Control**: Admin and User roles with different permissions
- ✨ **Settings Page**: User administration interface (admin only)
- 🎨 **Improved Compression Feedback**: Toast notifications instead of alerts
- 📄 **Log Tables Pagination**: 25 items per page for better performance
- 🔒 **Protected API Endpoints**: All routes now require authentication
- 🎯 **User Session Display**: Show logged-in user and logout option in header
- ⚠️ **Admin-Only Operations**: Compression and deletion restricted to admins
- 📝 **Security**: SHA-256 password hashing with 24-hour session expiration

### v2.0.1 (2025-12-19)
- 🐛 Monitoring Fixes + DB Optimization (Compression)

### v2.0.0 (2025-12-18)
- ✨ Statistics dashboard with charts
- ✨ Database monitoring page
- ✨ Excel export (XLSX)
- ✨ Database backup (full & date range)
- ✨ One-click table compression
- ✨ Batch deletion with confirmations
- ✨ Schema optimization
- ✨ InnoDB compression support
- 🔧 Optimized column types
- 🔧 Backward-compatible migrations

### v1.0.1 (2025-12-17)
- ✨ CSV export functionality
- ✨ System status indicators
- ✨ PPPoE username extraction
- 🐛 Build fixes
- 🎨 UI optimizations

### v1.0.0 (2025-12-16)
- 🎉 Initial release
- ✨ Real-time log reception
- ✨ Dynamic daily tables
- ✨ Search and filtering
- ✨ Modern UI

## 📄 License

MIT License

## 👤 Author

AIRBAND - Network Log Management System

## 🔗 Links

- **Repository**: https://github.com/FingaDZ/log
- **Issues**: https://github.com/FingaDZ/log/issues
