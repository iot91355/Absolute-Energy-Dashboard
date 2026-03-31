const mqtt = require('mqtt');
const { getConnection } = require('./db');
const { refreshAllReadingViews } = require('./services/refreshAllReadingViews');

/* =====================================================
   UNIT HANDLING
===================================================== */

async function getOrCreateUnit(unitName = 'unitless') {
  const db = getConnection();
  let row = await db.oneOrNone(
    `SELECT id FROM units WHERE name = $1`,
    [unitName]
  );

  if (row) return row.id;

  row = await db.one(
    `INSERT INTO units
      (name, identifier, unit_represent, type_of_unit, displayable, preferred_display)
     VALUES
      ($1, $2, 'quantity', 'unit', 'all', true)
     RETURNING id`,
    [
      unitName,
      unitName.toLowerCase().replace(/\s+|°|\/|\(|\)/g, '_')
    ]
  );

  return row.id;
}

/* =====================================================
   ✅ FIXED UNIT DETECTION (ONLY CHANGE)
===================================================== */

function parseIdentifierMetadata(identifier) {
  const text = identifier.toLowerCase();

  const UNIT_TOKENS = [
    // ENERGY (longest wins)
    { token: 'kvarh', unit: 'kVArh' },
    { token: 'kvah', unit: 'kVAh' },
    { token: 'kwh', unit: 'kWh' },

    // POWER
    { token: 'kvar', unit: 'kVAr' },
    { token: 'kva', unit: 'kVA' },
    { token: 'kw', unit: 'kW' },

    // ELECTRICAL
    { token: 'voltage', unit: 'V' },
    { token: 'current', unit: 'A' },
    { token: 'freq', unit: 'Hz' },

    // OTHER
    { token: 'pf', unit: 'PF' },
    { token: 'thd', unit: '%' },
    { token: 'temp', unit: '°C' },
    { token: 'flow', unit: 'm³/h' },
    { token: 'pressure', unit: 'Pa' },
    { token: 'level', unit: 'level' },
    { token: 'status', unit: 'status' },
    { token: 'running', unit: 'status' }
  ];

  const matches = UNIT_TOKENS.filter(u => text.includes(u.token));

  if (matches.length === 0) {
    return {
      unit: 'unitless',
      meterType: 'other',
      displayName: identifier
    };
  }

  // 🔑 Longest token wins → kWh beats kW
  matches.sort((a, b) => b.token.length - a.token.length);

  return {
    unit: matches[0].unit,
    meterType: 'other',
    displayName: identifier
  };
}

/* =====================================================
   METER REGISTRATION
===================================================== */

async function registerMeterIfNeeded(identifier, sourceId) {
  const db = getConnection();
  const row = await db.oneOrNone(
    `SELECT id, unit_id, meter_type FROM meters WHERE identifier = $1`,
    [identifier]
  );

  // 🔒 DO NOT mutate existing unit
  if (row) {
    // Optionally update source_id if it's missing or different, but we'll leave it as is.
    return row;
  }

  const metadata = parseIdentifierMetadata(identifier);
  const unitId = await getOrCreateUnit(metadata.unit);

  return await db.one(
    `INSERT INTO meters
      (name, identifier, enabled, displayable,
       meter_type, unit_id, default_graphic_unit, reading_frequency, mqtt_source_id)
     VALUES
      ($1, $2, true, true, $3, $4, $4, '00:15:00', $5)
     RETURNING id, unit_id, meter_type`,
    [identifier, identifier, metadata.meterType, unitId, sourceId]
  );
}

/* =====================================================
   READINGS
===================================================== */

async function insertReading(meterId, value) {
  const db = getConnection();
  await db.none(
    `INSERT INTO readings
      (meter_id, reading, start_timestamp, end_timestamp)
     VALUES
      ($1, $2,
       CURRENT_TIMESTAMP - INTERVAL '1 second',
       CURRENT_TIMESTAMP)
     ON CONFLICT (meter_id, start_timestamp) DO NOTHING`,
    [meterId, value]
  );
}

/* =====================================================
   MQTT SETUP AND LOGIC
===================================================== */

let currentClient = null;

async function startMqttClient() {
  if (currentClient) {
    console.log('Stopping existing MQTT client...');
    currentClient.end(true);
    currentClient = null;
  }

  try {
    const db = getConnection();
    const sources = await db.any('SELECT * FROM mqtt_sources ORDER BY id DESC LIMIT 1');
    
    if (sources.length === 0) {
      console.log('No MQTT sources configured. Idle.');
      return;
    }

    const config = sources[0];
    const sourceId = config.id;
    let brokerUrl = config.broker_url || '';
    
    // Auto-prefix mqtt:// or mqtts:// if missing
    if (!brokerUrl.includes('://')) {
        brokerUrl = (config.port === 8883 ? 'mqtts://' : 'mqtt://') + brokerUrl;
    }

    let urlObj;
    try {
        urlObj = new URL(brokerUrl);
    } catch(err) {
        console.error('Invalid MQTT Broker URL:', brokerUrl);
        return;
    }

    const options = {
      host: urlObj.hostname,
      port: parseInt(urlObj.port || (urlObj.protocol === 'mqtts:' ? 8883 : 1883)),
      protocol: urlObj.protocol.replace(':', ''),
      username: config.username,
      password: config.password,
      clientId: config.client_id || 'OED_MQTT_Client_' + Math.random().toString(16).substr(2, 8),
      rejectUnauthorized: false
    };

    console.log(`Starting MQTT client for broker: ${options.host}:${options.port}...`);
    currentClient = mqtt.connect(options);

    const TOPIC = config.topic || '#';
    const filtersText = config.filters || '';
    const filterList = filtersText.split(',').map(f => f.trim()).filter(f => f.length > 0);

    const meterMap = {};
    let lastRefreshTime = 0;
    const REFRESH_INTERVAL = 60000;

    currentClient.on('connect', () => {
      console.log('MQTT CONNECTED to', options.host);
      currentClient.subscribe(TOPIC);
    });

    currentClient.on('message', async (_, message) => {
      let payload;

      try {
        payload = JSON.parse(message.toString());
      } catch {
        return;
      }

      if (Array.isArray(payload)) {
        payload = Object.assign({}, ...payload);
      }

      for (const [key, value] of Object.entries(payload)) {
        // Apply custom filters
        let skip = false;
        for (const f of filterList) {
            if (key.startsWith(f)) {
                skip = true;
                break;
            }
        }
        if (skip) continue;

        const num = Number(value);
        if (Number.isNaN(num)) continue;

        if (!meterMap[key]) {
          meterMap[key] = await registerMeterIfNeeded(key, sourceId);
        }

        await insertReading(meterMap[key].id, num);
      }

      const now = Date.now();
      if (now - lastRefreshTime > REFRESH_INTERVAL) {
        lastRefreshTime = now;
        try {
            await refreshAllReadingViews();
        } catch(err) {
            console.error('refreshAllReadingViews error:', err);
        }
      }
    });

    currentClient.on('error', e => console.error('MQTT error:', e.message));
    currentClient.on('close', () => console.log('MQTT closed'));
    currentClient.on('reconnect', () => console.log('MQTT reconnecting'));

  } catch (error) {
     console.error('Error starting MQTT client:', error);
  }
}

// Automatically start if called directly or on require
startMqttClient();

module.exports = {
    startMqttClient
};
