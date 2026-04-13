const db = require('../config/database');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seedAdmin() {
    try {
        console.log('🔄 جاري التحقق من وجود حساب مدير...');

        const result = await db.query(`SELECT id FROM core.users WHERE role IN ('admin', 'super_admin') LIMIT 1`);

        if (result.rows.length > 0) {
            console.log('✅ يوجد حساب مدير بالفعل، لا حاجة لإنشاء حساب جديد.');
            return;
        }

        console.log('⚠️ لم يتم العثور على حساب مدير. جاري إنشاء حساب افتراضي...');

        // تشفير كلمة المرور الافتراضية
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // إنشاء المستخدم
        await db.query(`
            INSERT INTO core.users (
                first_name, 
                last_name, 
                phone, 
                email, 
                password_hash, 
                role, 
                is_active, 
                is_verified
            ) VALUES (
                'System',
                'Admin',
                '0555000000',
                'admin@elfakher.dz',
                $1,
                'super_admin',
                true,
                true
            )
        `, [hashedPassword]);

        console.log('🎉 تم إنشاء حساب المدير بنجاح!');
        console.log('-----------------------------------');
        console.log('اسم المستخدم للتسجيل: admin@elfakher.dz (أو 0555000000)');
        console.log('كلمة المرور: admin123');
        console.log('-----------------------------------');
        console.log('⚠️ تنبيه مهم: يرجى تغيير كلمة المرور بعد أول تسجيل دخول لأسباب أمنية.');

    } catch (error) {
        console.error('❌ حدث خطأ أثناء إنشاء حساب المدير:', error);
    } finally {
        process.exit();
    }
}

seedAdmin();
