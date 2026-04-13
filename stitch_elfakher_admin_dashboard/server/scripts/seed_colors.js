const { pool } = require('../config/database');

const colors = [
    { name_en: 'White', name_ar: 'أبيض', hex_code: '#FFFFFF', sort_order: 1 },
    { name_en: 'Navy', name_ar: 'كحلي', hex_code: '#1A232E', sort_order: 2 },
    { name_en: 'Blue', name_ar: 'أزرق', hex_code: '#1E40AF', sort_order: 3 },
    { name_en: 'Grey', name_ar: 'رمادي', hex_code: '#6B7280', sort_order: 4 },
    { name_en: 'Beige', name_ar: 'بيج', hex_code: '#F5F5DC', sort_order: 5 },
    { name_en: 'Black', name_ar: 'أسود', hex_code: '#000000', sort_order: 6 },
    { name_en: 'Brown', name_ar: 'بني', hex_code: '#5D4037', sort_order: 7 },
    { name_en: 'Green', name_ar: 'أخضر', hex_code: '#166534', sort_order: 8 },
    { name_en: 'Dark Red', name_ar: 'أحمر داكن', hex_code: '#991B1B', sort_order: 9 }
];

async function seedColors() {
    try {
        console.log('🌱 Starting color seeding...');

        for (const color of colors) {
            // Check if color exists by hex or name
            const check = await pool.query(
                'SELECT id FROM catalog.colors WHERE hex_code = $1 OR name_en = $2',
                [color.hex_code, color.name_en]
            );

            if (check.rows.length === 0) {
                console.log(`Adding new color: ${color.name_en}`);
                await pool.query(
                    `INSERT INTO catalog.colors (name_en, name_ar, hex_code, sort_order, is_active)
                     VALUES ($1, $2, $3, $4, true)`,
                    [color.name_en, color.name_ar, color.hex_code, color.sort_order]
                );
            } else {
                console.log(`Color already exists: ${color.name_en} (ID: ${check.rows[0].id})`);
            }
        }

        console.log('✅ Color seeding completed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding colors:', err);
        process.exit(1);
    }
}

seedColors();
