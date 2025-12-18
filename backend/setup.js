const mysql = require('mysql2/promise');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (str) => new Promise(resolve => rl.question(str, resolve));

async function setup() {
    console.log("--- Log Server Database Setup ---");

    // 1. Get Configuration
    const dbHost = await question("Enter MariaDB Host (default: localhost): ") || 'localhost';
    const dbName = await question("Enter Database Name (default: logser): ") || 'logser';
    const dbUser = await question("Enter App User (default: adel): ") || 'adel';
    const dbPass = await question("Enter App Password (default: secure_password): ") || 'secure_password';

    // 2. Try to Administer (Optional)
    const doAdmin = await question("Do you want to create the DB/User now? (y/n, default: y): ");

    if (doAdmin.toLowerCase() !== 'n') {
        const rootUser = await question("Enter Root/Admin User (default: root): ") || 'root';
        const rootPass = await question("Enter Root/Admin Password: ");

        try {
            const connection = await mysql.createConnection({
                host: dbHost,
                user: rootUser,
                password: rootPass
            });
            console.log("Connected as Admin!");

            console.log(`Creating Database '${dbName}'...`);
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);

            // Only try to create user if different from root
            if (dbUser !== rootUser) {
                console.log(`Creating User '${dbUser}'...`);
                // Note: This might fail if user exists, but we catch it.
                // We use IF NOT EXISTS logic implicitly by catching or 'CREATE USER IF NOT EXISTS'
                try {
                    await connection.query(`CREATE USER IF NOT EXISTS '${dbUser}'@'%' IDENTIFIED BY '${dbPass}';`);
                    await connection.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'%';`);
                    await connection.query(`FLUSH PRIVILEGES;`);
                    console.log("User created/granted successfully.");
                } catch (e) {
                    console.log("Warning: Could not create/grant user (might already exist or permission denied). Continuing...");
                }
            }

            await connection.end();
        } catch (error) {
            console.error("Admin Setup skipped/failed:", error.message);
            console.log("Assuming Database and User already exist. Proceeding to config...");
        }
    }

    // 3. Write .env file
    const envContent = `DB_HOST=${dbHost}
DB_USER=${dbUser}
DB_PASSWORD=${dbPass}
DB_NAME=${dbName}
PORT=3000
SYSLOG_PORT=4950
`;

    fs.writeFileSync(path.join(__dirname, '.env'), envContent);
    console.log("\n--- Success ---");
    console.log("Created .env file with your configuration.");
    console.log("Note: Tables are created AUTOMATICALLY when the first log is received.");

    rl.close();
}

setup();
