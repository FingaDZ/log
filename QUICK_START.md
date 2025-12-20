# Quick Start Guide - AIRBAND CLM v3.0.0

## 🚀 New User? Start Here!

### Step 1: First Login
1. Open your browser and navigate to: `http://your-server-ip:8080`
2. You'll see the login page
3. Enter the default credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
4. Click "Sign In"

### Step 2: Change Your Password (IMPORTANT!)
1. After login, click **Settings** in the top navigation
2. Find the "admin" user in the table
3. Click the pencil (edit) icon
4. Enter a new strong password in the "New Password" field
5. Click "Update User"
6. You'll use this new password for future logins

### Step 3: Create Additional Users (Optional)
1. In the Settings page, click **"Add User"**
2. Fill in the form:
   - **Username**: Unique identifier (e.g., john.doe)
   - **Password**: Initial password for the user
   - **Full Name**: Display name (e.g., John Doe)
   - **Role**: Choose `Admin` or `User`
3. Click "Create User"

### Step 4: Explore the Features

#### 📋 Logs Page (Home)
- View real-time connection logs
- Filter by date, username, IP, protocol
- Export logs to CSV or Excel
- Default view shows today's logs

#### 📊 Statistics Page
- View top 10 active users
- See protocol distribution (pie chart)
- Analyze top destination IPs
- Select different dates for historical data

#### 💾 Monitoring Page
- View database size and health
- See all log tables with sizes
- **NEW**: Navigate through tables with pagination (25 per page)
- Compress tables to save space (Admin only)
- Download database backups
- Delete old logs (Admin only)

#### ⚙️ Settings Page (Admin Only)
- Manage user accounts
- Create new users
- Edit user information
- Delete users (cannot delete last admin)
- View last login times

## 🔐 Understanding Roles

### Admin Role
**Can do everything**:
✅ View and search logs
✅ View statistics
✅ View monitoring
✅ Export logs and backups
✅ Compress database tables
✅ Delete old logs
✅ Manage users (create, edit, delete)
✅ Access Settings page

### User Role
**Read-only access**:
✅ View and search logs
✅ View statistics
✅ View monitoring
✅ Export logs and backups
❌ Cannot compress tables
❌ Cannot delete logs
❌ Cannot manage users
❌ Cannot access Settings

## 💡 Tips & Tricks

### Compression Tips
- Compress tables monthly to save disk space
- Typical space savings: 50-70%
- Safe operation - no data loss
- **NEW**: Better feedback with notifications showing actual MB saved

### Search Tips
- Use specific dates for faster searches
- Leave filters empty to see all logs
- Protocol filter options: TCP, UDP, ICMP, Any
- Username filter is case-insensitive

### Export Tips
- CSV: Opens in Excel, good for basic analysis
- Excel (XLSX): Better formatting, recommended
- Exports respect the currently selected date

### Database Management
- Monitor disk space regularly
- Set up alerts when DB > 1GB
- Archive old logs before deletion
- Backup before major operations

## 🔄 Daily Workflow

### For Administrators:
1. Login to check system status
2. Review Mikrotik connection indicator (green = online)
3. Check database size in Monitoring
4. Review any alerts
5. Perform maintenance if needed (compress, backup)

### For Regular Users:
1. Login to access the system
2. Search logs by date/user/IP
3. Export data for reports
4. View statistics for usage patterns

## ⚠️ Important Notes

### Security
- Always use strong passwords
- Don't share login credentials
- Logout when finished (especially on shared computers)
- Change passwords regularly

### Maintenance
- Regular database backups recommended
- Compress tables monthly
- Delete old logs after archiving
- Monitor disk space usage

### Support
- Contact your administrator for:
  - Password resets
  - New user accounts
  - Access issues
  - Feature requests

## 🐛 Troubleshooting

### Can't Login?
- Check username and password (case-sensitive)
- Verify backend is running: `pm2 status`
- Check browser console for errors
- Contact admin for password reset

### "Unauthorized" Errors?
- Your session expired (24 hours)
- Logout and login again
- Clear browser cache if persistent

### Missing Settings Page?
- Settings is only for admin users
- Contact your administrator if you need admin access

### Compression Shows No Savings?
- Tables might already be compressed
- Check if tables use InnoDB Compressed format
- Recent tables may not compress much (new data)

### Pagination Not Working?
- Refresh the page
- Check if you have tables in the database
- Browser console may show errors

## 📱 Mobile Access
- The interface is responsive
- Works on tablets and phones
- Some features better on desktop
- Recommend landscape mode on phones

## 🔗 Quick Links

- **Logs**: `http://your-server:8080/`
- **Statistics**: `http://your-server:8080/stats`
- **Monitoring**: `http://your-server:8080/monitoring`
- **Settings**: `http://your-server:8080/settings` (Admin only)

## 📚 Need More Help?

- Read the full README.md
- Check CHANGELOG.md for recent changes
- See IMPLEMENTATION_SUMMARY.md for technical details
- Open an issue on GitHub for bugs

---

**Welcome to AIRBAND CLM v3.0.0!** 🎉

Your secure, feature-rich log management solution.
