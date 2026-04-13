const { query } = require('./config/database');

async function run() {
    try {
        console.log('Adding stock_quantity column to catalog.products...');
        await query('ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;');
        console.log('✅ Column added successfully or already exists.');
    } catch (e) {
        console.error('❌ Error adding column:', e);
    }
    process.exit();
}

run();
