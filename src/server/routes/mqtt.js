const express = require('express');
const { getConnection } = require('../db');
const { startMqttClient } = require('../mqttKwhFiltered'); // We will export this from the file
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const db = getConnection();
        const sources = await db.any('SELECT * FROM mqtt_sources ORDER BY id DESC LIMIT 1');
        if (sources.length > 0) {
            res.json(sources[0]);
        } else {
            res.json(null);
        }
    } catch (error) {
        console.error('Error fetching MQTT source:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/', async (req, res) => {
    try {
        const { broker_url, topic, client_id, username, password, filters } = req.body;
        const db = getConnection();
        
        // As requested: "only one mqtt at a time"
        // We will clear the existing ones and insert the new one
        await db.none('TRUNCATE TABLE mqtt_sources CASCADE');
        
        const newSource = await db.one(
            `INSERT INTO mqtt_sources (broker_url, topic, client_id, username, password, filters) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [broker_url, topic, client_id, username, password, filters]
        );
        
        // Restart the MQTT client with the new settings
        await startMqttClient();
        
        res.json(newSource);
    } catch (error) {
        console.error('Error saving MQTT source:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.delete('/', async (req, res) => {
    try {
        const db = getConnection();
        await db.none('TRUNCATE TABLE mqtt_sources CASCADE');
        
        // Stop the MQTT client
        await startMqttClient();
        
        res.sendStatus(200);
    } catch (error) {
        console.error('Error removing MQTT source:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
