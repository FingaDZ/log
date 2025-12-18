const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (str) => new Promise(resolve => rl.question(str, resolve));

async function setup() {
    console.log("--- Log Server Database Setup ---");
    console.log("This script will create the database and user for you.");

    // 1. Connect as Root
    const rootHost = await question("Enter MySQL Host (default: localhost): ") || 'localhost';
    const rootUser = await question("Enter MySQL Root User (default: root): ") || 'root';
    const rootPass = await question("Enter MySQL Root Password: ");

    try {
        const connection = await mysql.createConnection({
            host: rootHost,
            user: rootUser,
            password: rootPass
        });

        console.log("Connected to MySQL!");

        // 2. Create DB and User
        const dbName = 'logser';
        const dbUser = 'adel';
        const dbPass = 'secure_password'; // In real app, ask for this or generate

        console.log(`Creating Database '${dbName}'...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);

        console.log(`Creating User '${dbUser}'...`);
        // Note: 'mysql_native_password' might be needed depending on MySQL version. 
        // For modern MySQL 8, caching_sha2_password is default.
        await connection.query(`CREATE USER IF NOT EXISTS '${dbUser}'@'%' IDENTIFIED BY '${dbPass}';`);

        console.log(`Granting privileges...`);
        await connection.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'%';`);
        await connection.query(`FLUSH PRIVILEGES;`);

        console.log("\n--- Setup Complete ---");
        console.log(`Database: ${dbName}`);
        console.log(`User:     ${dbUser}`);
        console.log(`Password: ${dbPass}`);
        console.log("\nPlease update your .env file with these credentials.");

        await connection.end();
    } catch (error) {
        console.error("Setup Failed:", error.message);
    }

    rl.close();
}

setup();
