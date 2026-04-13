const db = require('./config/database');

async function checkSettings() {
    try {
        const result = await db.query('SELECT key FROM core.settings');
        console.log('Current keys:', result.rows.map(r => r.key));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSettings();
