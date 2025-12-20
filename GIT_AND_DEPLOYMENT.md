# Git Push and Production Update Guide

## 🔄 Step 1: Push Changes to GitHub

### Check Current Status
```powershell
cd "f:\Code\Log Server"
git status
```

### Stage All Changes
```powershell
# Add all new and modified files
git add .

# Verify what will be committed
git status
```

### Commit Changes
```powershell
git commit -m "Release v3.0.0: Authentication, User Management, Pagination & UX Improvements

Major Updates:
- Added complete authentication system with login page
- Implemented user management with Settings page
- Added role-based access control (Admin/User)
- Fixed compression dialog (toast notifications with actual values)
- Added pagination to Log Tables (25 items per page)
- Updated all API endpoints with authentication middleware
- SHA-256 password hashing with 24-hour session expiration
- Default admin credentials: admin/admin123

New Features:
- Login page with AIRBAND branding
- Settings page for user CRUD operations
- Protected routes with session verification
- User session display in header with logout
- Toast notifications for better UX

Security:
- All endpoints now require authentication
- Admin-only operations (compression, deletion, user management)
- Cannot delete last admin user
- Password hashing with SHA-256

Documentation:
- Updated README.md with v3.0.0 features
- Created CHANGELOG.md
- Created DEPLOYMENT.md
- Created QUICK_START.md
- Created IMPLEMENTATION_SUMMARY.md

Breaking Changes:
- All API endpoints now require authentication token

Files Created: 7
Files Modified: 11
Version: 2.0.1 → 3.0.0"
```

### Push to GitHub
```powershell
# Push to main branch
git push origin main

# Or if you're on master branch
git push origin master

# If you get authentication errors, you may need to set up credentials
# Use Personal Access Token if you have 2FA enabled on GitHub
```

### Create a Release Tag (Optional but Recommended)
```powershell
# Create annotated tag for v3.0.0
git tag -a v3.0.0 -m "Version 3.0.0 - Authentication & User Management"

# Push the tag
git push origin v3.0.0

# Or push all tags
git push --tags
```

---

## 🚀 Step 2: Update Production Server

### A. Preparation on Production Server

#### 1. SSH into Your Production Server
```bash
ssh your-username@your-server-ip
```

#### 2. Navigate to Application Directory
```bash
cd ~/log
# or wherever your app is installed
# e.g., cd /home/adel/log
```

#### 3. Backup Current Installation (Important!)
```bash
# Create backup directory
mkdir -p ~/backups

# Backup current version
tar -czf ~/backups/log-backup-$(date +%Y%m%d-%H%M%S).tar.gz ~/log

# Backup database
mysqldump -u adel -p logser > ~/backups/logser-backup-$(date +%Y%m%d-%H%M%S).sql
```

### B. Update Application

#### 4. Stop Services
```bash
pm2 stop all
# or specifically:
# pm2 stop clm-backend
# pm2 stop clm-frontend
```

#### 5. Pull Latest Changes from GitHub
```bash
cd ~/log

# Fetch latest changes
git fetch origin

# Pull the changes
git pull origin main
# or: git pull origin master

# Verify you're on v3.0.0
git log --oneline -n 5
git describe --tags
```

#### 6. Install Dependencies (Frontend)
```bash
# Install any new dependencies
npm install

# Build frontend
npm run build

# Verify build succeeded
ls -lh dist/
```

#### 7. Install Dependencies (Backend)
```bash
cd backend

# Install any new dependencies
npm install

# Build backend
npm run build

# Verify build succeeded
ls -lh dist/

cd ..
```

### C. Database Setup (Automatic)

The `users` table will be created automatically when the backend starts.
No manual database migration needed!

### D. Start Services

#### 8. Start with PM2
```bash
# Start all services
pm2 start ecosystem.config.cjs

# Or restart if already configured
pm2 restart all

# Save PM2 configuration
pm2 save
```

#### 9. Verify Services are Running
```bash
# Check status
pm2 status

# Should show:
# ┌─────┬───────────────────┬─────────┬─────────┐
# │ id  │ name              │ status  │ restart │
# ├─────┼───────────────────┼─────────┼─────────┤
# │ 0   │ clm-frontend      │ online  │ 0       │
# │ 1   │ clm-backend       │ online  │ 0       │
# └─────┴───────────────────┴─────────┴─────────┘

# Check logs for any errors
pm2 logs clm-backend --lines 50

# Look for these messages:
# "API Server running on port 3000"
# "✅ Auth tables initialized"
# "✅ Default admin user created (username: admin, password: admin123)"
# "Syslog UDP Server listening on 0.0.0.0:4950"
```

### E. Verification & Testing

#### 10. Test Backend API
```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Should return:
# {"success":true,"token":"...","user":{"username":"admin","role":"admin"}}
```

#### 11. Test Frontend
```bash
# Check if frontend is accessible
curl -I http://localhost:8080

# Should return: HTTP/1.1 200 OK
```

#### 12. Browser Testing
Open browser and test:
1. Navigate to `http://your-server-ip:8080`
2. Should see login page (not logs page!)
3. Login with `admin` / `admin123`
4. Verify redirect to logs page
5. Check header shows username and logout button
6. Navigate to Settings (should appear for admin)
7. Test creating a user
8. Test compression with toast notification

### F. Post-Deployment Security

#### 13. Change Default Admin Password (CRITICAL!)
```bash
# Login to application via browser
# 1. Go to Settings
# 2. Edit admin user
# 3. Set strong password
# 4. Save

# Verify new password works by logging out and back in
```

#### 14. Create Real Admin User (Optional)
```bash
# In Settings page:
# 1. Create new user with admin role
# 2. Use your real name and secure password
# 3. Logout and login with new admin
# 4. Delete or disable the default "admin" user
```

---

## 📊 Monitoring After Update

### Check Service Health
```bash
pm2 monit  # Real-time monitoring
pm2 status # Status overview
```

### View Logs
```bash
# Backend logs (auth, syslog, API)
pm2 logs clm-backend --lines 100

# Frontend logs (static serving)
pm2 logs clm-frontend --lines 50

# Follow logs in real-time
pm2 logs --lines 100
```

### Check for Errors
```bash
# Backend errors
pm2 logs clm-backend --err --lines 50

# If you see errors about database connection:
sudo systemctl status mariadb
mysql -u adel -p -e "SHOW DATABASES;"
```

---

## 🔄 Rollback Plan (If Something Goes Wrong)

### Quick Rollback
```bash
# 1. Stop services
pm2 stop all

# 2. Restore from backup
cd ~
tar -xzf ~/backups/log-backup-YYYYMMDD-HHMMSS.tar.gz -C ~/

# 3. Restore database (if needed)
mysql -u adel -p logser < ~/backups/logser-backup-YYYYMMDD-HHMMSS.sql

# 4. Restart old version
cd ~/log
pm2 restart all
```

---

## 📋 Post-Update Checklist

- [ ] GitHub repository updated with v3.0.0
- [ ] Production server pulled latest changes
- [ ] Frontend built successfully
- [ ] Backend built successfully
- [ ] PM2 services running
- [ ] Users table created automatically
- [ ] Can access login page
- [ ] Can login with admin/admin123
- [ ] Settings page accessible (admin)
- [ ] Changed default admin password
- [ ] Created real user accounts
- [ ] Tested compression toast notification
- [ ] Tested log table pagination
- [ ] Verified Mikrotik logs still being received
- [ ] Database backups configured

---

## 🆘 Troubleshooting Production Issues

### Issue: "Cannot find module 'auth'"
```bash
# Backend not built properly
cd ~/log/backend
npm run build
pm2 restart clm-backend
```

### Issue: Login page shows error
```bash
# Check backend is running
pm2 logs clm-backend

# Test API directly
curl http://localhost:3000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Issue: Frontend shows old version
```bash
# Clear browser cache (Ctrl+Shift+R)
# Or rebuild frontend
cd ~/log
npm run build
pm2 restart clm-frontend
```

### Issue: Database connection failed
```bash
# Check MariaDB is running
sudo systemctl status mariadb
sudo systemctl start mariadb

# Verify credentials in backend/.env
cat backend/.env

# Test database connection
mysql -u adel -p logser -e "SELECT 1;"
```

### Issue: Port 3000 already in use
```bash
# Find process using port 3000
sudo lsof -i :3000
# or
sudo netstat -tlnp | grep :3000

# Kill the process if it's not PM2
sudo kill -9 <PID>

# Restart PM2
pm2 restart clm-backend
```

---

## 📞 Support

If issues persist:
1. Check logs: `pm2 logs`
2. Review [DEPLOYMENT.md](DEPLOYMENT.md)
3. Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
4. Open GitHub Issue: https://github.com/FingaDZ/log/issues

---

## ✅ Success Indicators

You'll know the update is successful when:

1. ✅ `git log` shows your v3.0.0 commit
2. ✅ GitHub repository shows updated files
3. ✅ `pm2 status` shows both services online
4. ✅ Backend logs show "Auth tables initialized"
5. ✅ Browser redirects to login page (not logs)
6. ✅ Can login with admin credentials
7. ✅ Header shows username and logout button
8. ✅ Settings page accessible (admin only)
9. ✅ Compression shows toast with actual MB saved
10. ✅ Log tables have pagination controls

---

**Update Complete!** 🎉

Your production server is now running AIRBAND CLM v3.0.0 with full authentication and user management!

**Important**: Change the default admin password immediately after deployment!
