# Ubuntu 22.04 Deployment Guide for CLM (v1.0.1)

This guide assumes you have a clean Ubuntu Server 22.04 at `192.168.20.48`.

## 1. Prerequisites (On Server)
SSH into your server:
```bash
ssh adel@192.168.20.48
```

### Install Node.js, NPM, and MariaDB
```bash
# Update System
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs

# Verify
node -v 
npm -v

# Install MariaDB
sudo apt install -y mariadb-server
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Secure MariaDB (Set root password if strictly needed, or rely on sudo)
sudo mysql_secure_installation
```

## 2. Deploy Code via GitHub
Since you requested to use GitHub as the source:

```bash
# 1. Clone the Repo
git clone https://github.com/FingaDZ/Log-Server-AIRBAND.git
cd Log-Server-AIRBAND

# 2. Setup Backend
cd backend
npm install
npm run build # (Configured in package.json to compile TS)

# 3. Setup Frontend
cd ..
npm install
npm run build
```

## 3. Database Setup
We will use the included setup script to create the `logser` database and `adel` user.

```bash
# In /logserver directory
node backend/setup.js
# Enter your MariaDB root password when prompted.
```

## 4. Run with PM2 (Process Manager)
We use `pm2` to keep the server running in the background.

```bash
# Install PM2
sudo npm install -g pm2

# Start Backend
cd backend
pm2 start dist/server.js --name "clm-backend"

# Start Frontend (Serving Build)
# We need a static file server. 'serve' is good.
sudo npm install -g serve
cd ..
pm2 start "serve -s dist -l 8080" --name "clm-frontend"

# Save list
pm2 save
pm2 startup
```

## 5. Firewall Config
Ensure UDP 4950 and TCP 8080 are open.

```bash
sudo ufw allow 4950/udp
sudo ufw allow 8080/tcp
sudo ufw allow ssh
sudo ufw enable
```

Access the app at `http://192.168.20.48:8080`.
