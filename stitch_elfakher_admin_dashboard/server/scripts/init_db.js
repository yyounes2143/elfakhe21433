const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function executeSqlFile(filePath) {
    const fullPath = path.resolve(__dirname, '../../database', filePath);
    console.log(`Executing: ${filePath}...`);
    try {
        const sqlContent = fs.readFileSync(fullPath, 'utf8');

        try {
            await pool.query(sqlContent);
            console.log(`✓ Successfully executed ${filePath}`);
        } catch (err) {
            console.log(`Executing ${filePath} statement by statement due to conflicts...`);
            const statements = sqlContent.split(/;\s*$/m).filter(s => s.trim().length > 0);

            for (let stmt of statements) {
                try {
                    await pool.query(stmt);
                } catch (stmtErr) {
                    if (!['42P07', '42710', '23505', '42712', '42704'].includes(stmtErr.code)) {
                         console.warn(`Warning executing statement in ${filePath}:`, stmtErr.message);
                    }
                }
            }
            console.log(`✓ Finished processing ${filePath}`);
        }
    } catch (error) {
        console.error(`✗ File read error in ${filePath}:`, error.message);
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
            try {
                await executeSqlFile(file);
            } catch (err) {
                console.warn(`! Skipped or failed part of ${file}. Continuing...`);
            }
        }

        console.log('>>> Seeding default admin user...');
        const adminCheck = await pool.query('SELECT id FROM core.users WHERE phone = $1', ['0540107528']);

        if (adminCheck.rows.length > 0) {
            console.log('Admin user exists. Updating password and role...');
            await pool.query(`
                UPDATE core.users
                SET password_hash = $1, role = 'super_admin', is_active = true, is_verified = true
                WHERE phone = $2
            `, ['$2b$10$PP.p5bF1ZQJlH1KGDhQCFOK5GRTyI7yXkKAtKknvqt7h5GPU1unue', '0540107528']);
        } else {
            console.log('Admin user not found. Creating...');
            await pool.query(`
                INSERT INTO core.users (first_name, last_name, phone, password_hash, role, is_active, is_verified)
                VALUES ('Admin', 'User', '0540107528', '$2b$10$PP.p5bF1ZQJlH1KGDhQCFOK5GRTyI7yXkKAtKknvqt7h5GPU1unue', 'super_admin', true, true)
            `);
        }
        console.log('✓ Successfully created/updated default admin user (0540107528)');

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
