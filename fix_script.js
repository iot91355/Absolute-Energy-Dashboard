const fs = require('fs');
const fixBars = fs.readFileSync('fix_bars.sql', 'utf8');
const dropStmts = `
DROP FUNCTION IF EXISTS meter_bar_readings_unit(integer[], integer, integer, timestamp, timestamp) CASCADE;
DROP FUNCTION IF EXISTS group_bar_readings_unit(integer[], integer, integer, timestamp, timestamp) CASCADE;
`;

function processFile(path, replaceCode) {
    let content = fs.readFileSync(path, 'utf8');
    let idx = content.indexOf('CREATE OR REPLACE FUNCTION meter_bar_readings_unit');
    if (idx !== -1) {
        if (replaceCode) {
            content = content.substring(0, idx) + dropStmts + fixBars;
        } else {
            content = content.substring(0, idx) + dropStmts + content.substring(idx);
        }
        fs.writeFileSync(path, content);
        console.log('Updated ' + path);
    } else {
        console.log('Could not find function in ' + path);
    }
}

processFile('src/server/sql/reading/create_reading_views.sql', true);
processFile('src/server/migrations/0.8.0-1.0.0/sql/readings/create_reading_views.sql', false);
