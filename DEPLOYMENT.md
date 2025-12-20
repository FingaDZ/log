# 🚀 Deployment Guide - AIRBAND CLM v3.0.0

## ✅ Build Status
- ✅ Backend compiled successfully
- ✅ Frontend built successfully (dist/ folder ready)
- ✅ No TypeScript errors
- ✅ All features implemented

## 📋 Pre-Deployment Checklist

### 1. Verify Database Configuration
Check `backend/.env` file exists with correct credentials:
```env
DB_HOST=127.0.0.1
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=logser
PORT=3000
SYSLOG_PORT=4950
```

### 2. Verify Database is Running
```bash
# Check MariaDB/MySQL status
sudo systemctl status mariadb
# or
sudo systemctl status mysql
```

### 3. Update PM2 Configuration (if needed)
Edit `ecosystem.config.cjs` with your actual paths and credentials.

## 🔄 Deployment Steps

### Option A: Using PM2 (Recommended for Production)

#### 1. Stop Current Services (if running)
```powershell
pm2 stop all
```

#### 2. Deploy Built Files
The builds are ready:
- Frontend: `dist/` folder
- Backend: `backend/dist/` folder

#### 3. Start Services with PM2
```powershell
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # (optional, for auto-start on reboot)
```

#### 4. Verify Services are Running
```powershell
pm2 status
pm2 logs clm-backend --lines 50
pm2 logs clm-frontend --lines 50
```

### Option B: Development Mode

#### 1. Start Backend (Development)
```powershell
cd backend
npm run dev
```

#### 2. Start Frontend (Development)
```powershell
# In a new terminal
cd "f:\Code\Log Server"
npm run dev
```

## 🧪 Testing the Deployment

### 1. Check Backend is Running
```powershell
# Test API health
curl http://localhost:3000/api/auth/login -Method POST -Body '{"username":"admin","password":"admin123"}' -ContentType "application/json"
```

### 2. Access Frontend
Open browser and navigate to:
- **Production (PM2)**: `http://localhost:8080` or `http://your-server-ip:8080`
- **Development**: `http://localhost:5173`

### 3. Test Login
1. Navigate to the application
2. You should see the login page
3. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`

### 4. Verify Features

#### Test Authentication:
- ✅ Can login with correct credentials
- ✅ Error shown for incorrect credentials
- ✅ Redirects to logs page after login
- ✅ Can logout
- ✅ Redirects to login when accessing protected routes without auth

#### Test Monitoring Page:
- ✅ Navigate to Monitoring
- ✅ See database tables listed
- ✅ Tables pagination shows (if >25 tables)
- ✅ Click "Compress Tables" button
- ✅ Toast notification appears with actual MB saved
- ✅ No "undefined" values in toast

#### Test Settings Page (Admin):
- ✅ Navigate to Settings (should see link in header)
- ✅ See list of users
- ✅ Click "Add User" and create a test user
- ✅ Edit a user's details
- ✅ Try to delete a user (shows confirmation)

#### Test Regular User Access:
- ✅ Create a user with role="user"
- ✅ Logout and login as that user
- ✅ No Settings link in header
- ✅ Compression button disabled or hidden (admin only)
- ✅ Can view logs and statistics

## 🔍 Troubleshooting

### Backend Won't Start
```powershell
# Check logs
pm2 logs clm-backend

# Common issues:
# 1. Database not running
sudo systemctl start mariadb

# 2. Wrong credentials in .env
# Edit backend/.env

# 3. Port 3000 already in use
netstat -ano | findstr :3000
# Kill the process if needed
```

### Frontend Won't Load
```powershell
# Check if static files are being served
pm2 logs clm-frontend

# Verify dist folder exists
dir dist

# Rebuild if needed
npm run build
pm2 restart clm-frontend
```

### "Unauthorized" Errors
```powershell
# Check backend is running
pm2 status

# Verify auth endpoints work
curl http://localhost:3000/api/auth/login -Method POST -Body '{"username":"admin","password":"admin123"}' -ContentType "application/json"

# Check backend logs for errors
pm2 logs clm-backend --lines 100
```

### Database Connection Errors
```powershell
# Test database connection
mysql -u your_db_user -p your_password -e "SHOW DATABASES;"

# Check if logser database exists
mysql -u your_db_user -p your_password -e "USE logser; SHOW TABLES;"
```

### Users Table Not Created
The `users` table is created automatically on backend startup. If it's not created:

```powershell
# Restart backend
pm2 restart clm-backend

# Check logs for errors
pm2 logs clm-backend --lines 50

# Look for: "✅ Auth tables initialized" and "✅ Default admin user created"
```

## 🔐 Post-Deployment Security

### 1. Change Default Admin Password
**CRITICAL**: Do this immediately!
1. Login as admin
2. Go to Settings
3. Edit admin user
4. Set a strong password
5. Save changes

### 2. Create Real Users
1. Delete or disable the default admin (after creating a new admin)
2. Create individual accounts for each team member
3. Use appropriate roles (admin/user) based on needs

### 3. Network Security (if exposing to internet)
```bash
# Allow only necessary ports
sudo ufw allow 8080/tcp  # Frontend
sudo ufw allow 3000/tcp  # Backend API
sudo ufw allow 4950/udp  # Syslog receiver

# Enable firewall
sudo ufw enable
```

### 4. SSL/TLS (Production)
Consider setting up a reverse proxy with SSL:
```bash
# Example with Nginx
sudo apt install nginx certbot python3-certbot-nginx

# Configure Nginx as reverse proxy for port 8080
# Get free SSL certificate from Let's Encrypt
sudo certbot --nginx
```

## 📊 Monitoring in Production

### Check Service Health
```powershell
pm2 status
pm2 monit  # Real-time monitoring
```

### View Logs
```powershell
pm2 logs clm-backend --lines 100
pm2 logs clm-frontend --lines 100
```

### Restart if Needed
```powershell
pm2 restart clm-backend
pm2 restart clm-frontend
# or
pm2 restart all
```

## 🔄 Future Updates

When updating to newer versions:
```powershell
# 1. Stop services
pm2 stop all

# 2. Pull updates
git pull

# 3. Install dependencies (if package.json changed)
npm install
cd backend
npm install
cd ..

# 4. Rebuild
npm run build
cd backend
npm run build
cd ..

# 5. Restart services
pm2 restart all
```

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review logs: `pm2 logs`
3. Check [QUICK_START.md](QUICK_START.md) for usage help
4. Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for technical details
5. Open an issue on GitHub

## ✅ Deployment Complete!

Your AIRBAND CLM v3.0.0 is now deployed with:
- 🔐 Secure authentication
- 👥 User management
- 📊 Enhanced monitoring with pagination
- ✨ Improved compression feedback
- 📚 Complete documentation

**First Login**: `admin` / `admin123` (change immediately!)

**Access URL**: 
- Local: http://localhost:8080
- Network: http://your-server-ip:8080

---

**Status**: Ready for Production ✅  
**Version**: 3.0.0  
**Date**: December 20, 2025
