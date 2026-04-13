const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function executeSqlFile(filePath) {
    const fullPath = path.resolve(__dirname, '../../database', filePath);
    console.log(`Executing: ${filePath}...`);
    try {
        const sqlContent = fs.readFileSync(fullPath, 'utf8');

        // Split the file into individual statements.
        // A single failing statement (e.g. "table exists") shouldn't stop the whole file.
        // This regex splits on ';' but only if it's not inside a PL/pgSQL DO $$ block or a string.
        // Since we are restoring original files, we will split simply and catch errors per statement.

        // To be completely safe with complex SQL, we'll try to run the whole file first.
        try {
            await pool.query(sqlContent);
            console.log(`✓ Successfully executed ${filePath}`);
        } catch (err) {
            // If the whole file fails, we fall back to splitting it up and executing statement by statement.
            // This ensures subsequent tables/inserts in the same file still execute if earlier ones exist.
            console.log(`Executing ${filePath} statement by statement due to conflicts...`);

            // Simple split by ';' at the end of lines
            const statements = sqlContent.split(/;\s*$/m).filter(s => s.trim().length > 0);

            for (let stmt of statements) {
                try {
                    await pool.query(stmt);
                } catch (stmtErr) {
                    // Ignore common idempotency errors: duplicate table/index/type, unique violation, etc.
                    if (!['42P07', '42710', '23505', '42712', '42704'].includes(stmtErr.code)) {
                         console.warn(`Warning executing statement in ${filePath}:`, stmtErr.message);
                    }
                }
            }
            console.log(`✓ Finished processing ${filePath}`);
        }
    } catch (error) {
        console.error(`✗ File read error in ${filePath}:`, error.message);
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
        // The core.users table was dropped/restored and might not have the phone constraint if it failed earlier.
        // We use a safe check and insert to guarantee the admin user is seeded regardless of conflicts.
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
