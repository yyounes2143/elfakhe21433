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

        console.log('>>> Seeding default admin user...');
        const adminQuery = `
            INSERT INTO core.users (
                first_name,
                last_name,
                phone,
                password_hash,
                role,
                is_active,
                is_verified
            ) VALUES (
                'Admin',
                'User',
                '0540107528',
                '$2b$10$PP.p5bF1ZQJlH1KGDhQCFOK5GRTyI7yXkKAtKknvqt7h5GPU1unue',
                'super_admin',
                true,
                true
            ) ON CONFLICT (phone) DO NOTHING;
        `;
        await pool.query(adminQuery);
        console.log('✓ Successfully created default admin user (0540107528)');

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
