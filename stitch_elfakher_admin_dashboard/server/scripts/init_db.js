const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function executeSqlFile(filePath) {
    const fullPath = path.resolve(__dirname, '../../database', filePath);
    console.log(`Executing: ${filePath}...`);
    try {
        const sql = fs.readFileSync(fullPath, 'utf8');
        await pool.query(sql);
        console.log(`✓ Successfully executed ${filePath}`);
    } catch (error) {
        console.error(`✗ Error executing ${filePath}:`, error.message);
        throw error;
    }
}

async function initDB() {
    console.log('Starting Database Initialization...');
    try {
        // Order based on database/install.sql
        const filesToExecute = [
            'schema.sql',
            'tables/core.sql',
            'tables/catalog.sql',
            'tables/shipping.sql',
            'tables/orders.sql',
            'seeds/wilayas.sql',
            'views_functions.sql'
        ];

        for (const file of filesToExecute) {
            await executeSqlFile(file);
        }

        console.log('=== Database initialization completed successfully! ===');
    } catch (error) {
        console.error('=== Database initialization failed! ===');
        console.error(error);
        process.exit(1);
    } finally {
        // End the database connection pool
        await pool.end();
    }
}

initDB();
