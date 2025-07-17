const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// Load config from environment variables
const REGION = process.env.AWS_REGION || 'ap-south-1';
const SECRET_NAME = process.env.DB_SECRET_NAME;
const RDS_ENDPOINT = process.env.DB_HOST;

if (!SECRET_NAME || !RDS_ENDPOINT) {
    console.error("❌ Missing required environment variables: DB_SECRET_NAME or DB_HOST");
    process.exit(1);
}

AWS.config.update({ region: REGION });
const secretsManager = new AWS.SecretsManager();

async function getDbConnection() {
    try {
        const secretData = await secretsManager.getSecretValue({
            SecretId: SECRET_NAME
        }).promise();

        const { username, password } = JSON.parse(secretData.SecretString);

        return mysql.createConnection({
            host: RDS_ENDPOINT,
            user: username,
            password: password,
            database: "mydb"
        });
    } catch (err) {
        console.error("❌ Failed to retrieve secrets or connect to DB:", err.message);
        throw err;
    }
}

async function initializeDatabase() {
    try {
        const db = await getDbConnection();

        await db.execute(`
            CREATE TABLE IF NOT EXISTS items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("✅ Database table initialized");
        await db.end();
    } catch (err) {
        console.error("❌ Initialization error:", err.message);
        process.exit(1);
    }
}

// API Endpoints (same as before) ...

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).send('OK');
});

// Start server
const PORT = process.env.PORT || 3000;
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
});
