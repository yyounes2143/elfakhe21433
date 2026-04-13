const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const { generateToken } = require('../middleware/auth');

// ===============================================
// POST /api/auth/login - تسجيل الدخول
// ===============================================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'يرجى إدخال اسم المستخدم وكلمة المرور'
            });
        }

        // البحث عن المستخدم باستخدام رقم الهاتف أو البريد الإلكتروني كـ username
        const result = await db.query(`
            SELECT id, first_name, last_name, role, password_hash, is_active
            FROM core.users
            WHERE (email = $1 OR phone = $1)
        `, [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'بيانات الدخول غير صحيحة'
            });
        }

        const user = result.rows[0];

        // التأكد من أن الحساب نشط وأنه مدير
        if (!user.is_active || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية للدخول إلى لوحة التحكم'
            });
        }

        // التحقق من كلمة المرور
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'بيانات الدخول غير صحيحة'
            });
        }

        // توليد التوكن
        const token = generateToken(user);

        // تحديث تاريخ آخر تسجيل دخول
        await db.query(`UPDATE core.users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            token: token,
            user: {
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تسجيل الدخول'
        });
    }
});

// ===============================================
// GET /api/auth/verify - التحقق من الجلسة الحالية
// ===============================================
const { authMiddleware } = require('../middleware/auth');
router.get('/verify', authMiddleware, (req, res) => {
    // إذا وصل الطلب إلى هنا فهذا يعني أن authMiddleware نجح
    res.json({
        success: true,
        user: req.user
    });
});

module.exports = router;
