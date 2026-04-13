const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'elfakher_super_secret_key_2026'; // يجب وضع هذا في ملف .env

function authMiddleware(req, res, next) {
    // استخراج التوكن من الهيدر
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'غير مصرح للوصول: يرجى تسجيل الدخول'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'جلسة تسجيل الدخول منتهية الصلاحية أو غير صالحة'
            });
        }

        // إضافة معلومات المستخدم (مثل admin role) إلى الطلب
        req.user = user;
        next();
    });
}

function generateToken(user) {
    return jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

module.exports = { authMiddleware, generateToken };
