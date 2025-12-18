# AIRBAND Customers Log Management (CLM)

CLM is a full-stack log management system designed to receive, parse, and store Syslog messages from Mikrotik routers. It features a React frontend for visualization and a Node.js backend with MariaDB for storage.

## Features
- **Syslog Receiver**: Listens on UDP Port 4950 for Mikrotik logs.
- **Log Parsing**: Automatically extracts Source/Dest IP, Ports, and Protocols.
- **Daily Storage**: Rotates database tables daily (e.g., `logs_20231218`).
- **Web Dashboard**: Real-time searching and filtering of connection logs.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS, Shadcn UI
- **Backend**: Node.js (Express), UDP Dgram
- **Database**: MariaDB / MySQL

## Installation & Deployment

### Ubuntu 22.04 LTS (Production)
See the detailed [Deployment Guide](UBUNTU_DEPLOY.md).

Quick Start:
```bash
git clone https://github.com/FingaDZ/Log-Server-AIRBAND.git
cd Log-Server-AIRBAND

# Setup Backend
cd backend
npm install
node setup.js # Follow prompts to create DB
npm run dev

# Setup Frontend
cd ..
npm install
npm run dev
```

## Configuration
- **Syslog Port**: 4950 (UDP)
- **Database**: `logser` (User: `adel`)
