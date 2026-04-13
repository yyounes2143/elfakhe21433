const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query } = require('../config/database');

async function checkSchema() {
    try {
        console.log('--- Order Items Columns ---');
        const result = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'orders' AND table_name = 'order_items'
        `);
        console.table(result.rows);

        console.log('--- Products Columns ---');
        const prodResult = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'catalog' AND table_name = 'products'
        `);
        console.table(prodResult.rows);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSchema();
