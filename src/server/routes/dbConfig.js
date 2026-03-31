const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const ENV_PATH = path.join(__dirname, '..', '..', '..', '.env');

// Read current env vars (from process.env, which is set by docker-compose)
router.get('/', (req, res) => {
    res.json({
        host: process.env.OED_DB_HOST || '',
        port: process.env.OED_DB_PORT || '5432',
        user: process.env.OED_DB_USER || '',
        password: process.env.OED_DB_PASSWORD || '',
        database: process.env.OED_DB_DATABASE || ''
    });
});

// Write database config to .env file so it persists on next restart
router.post('/', (req, res) => {
    try {
        const { host, port, user, password, database } = req.body;

        // Read existing .env or start blank
        let envContent = '';
        try {
            envContent = fs.readFileSync(ENV_PATH, 'utf8');
        } catch {
            // no .env yet, create fresh
        }

        const updates = {
            OED_DB_HOST: host,
            OED_DB_PORT: port,
            OED_DB_USER: user,
            OED_DB_PASSWORD: password,
            OED_DB_DATABASE: database
        };

        // Update or insert each key
        for (const [key, value] of Object.entries(updates)) {
            const regex = new RegExp(`^${key}=.*$`, 'm');
            const line = `${key}=${value}`;
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, line);
            } else {
                envContent += `\n${line}`;
            }
        }

        fs.writeFileSync(ENV_PATH, envContent.trim() + '\n', 'utf8');

        // Also update current process env so subsequent restart picks it up
        process.env.OED_DB_HOST = host;
        process.env.OED_DB_PORT = port;
        process.env.OED_DB_USER = user;
        process.env.OED_DB_PASSWORD = password;
        process.env.OED_DB_DATABASE = database;

        res.json({ ok: true, message: 'Database config saved to .env. Restart the server to apply changes.' });
    } catch (error) {
        console.error('Error saving DB config:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
