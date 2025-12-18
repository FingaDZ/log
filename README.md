# AIRBAND Customers Log Management (CLM)

**Version:** 2.0.0  
**Status:** Production Ready ✅

A comprehensive log management system for Mikrotik/RADIUS logs with real-time monitoring, analytics, and database optimization.

## 🚀 Features

### Core Functionality
- **Real-time Log Reception**: UDP syslog server (port 4950)
- **Dynamic Daily Tables**: Automatic table creation per day
- **PPPoE Username Extraction**: Parse and store usernames from Mikrotik logs
- **Advanced Search & Filtering**: Filter by date, IP, user, protocol
- **Responsive UI**: Modern dark theme with glassmorphism

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
  - Table-level metrics

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
  - Delete logs by date range
  - Double confirmation required
  - Safety warnings

### Optimization
- **InnoDB Compression**:
  - One-click table compression
  - 50-70% space reduction
  - Automatic for new tables
- **Schema Optimization**:
  - Optimized column types
  - Efficient indexing
  - Backward compatible
- **Archiving System**:
  - Monthly log archiving
  - Gzip compression
  - Archive search (planned)

### System Status
- **Live Indicators**:
  - Mikrotik connection status (green/gray)
  - Auto-refresh every 5 seconds
  - Last log timestamp
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

- `GET /api/status` - System heartbeat
- `GET /api/logs` - Fetch logs with filters
- `GET /api/stats?date=YYYY-MM-DD` - Statistics
- `GET /api/monitoring` - Database metrics
- `GET /api/export?date=YYYY-MM-DD&format=csv|xlsx` - Export
- `GET /api/backup?start_date=&end_date=` - Database backup
- `POST /api/compress-tables` - Compress tables
- `POST /api/delete-logs` - Batch deletion

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
