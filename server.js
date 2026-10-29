const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-Household-Id']
}));

app.use(session({
    secret: process.env.SESSION_SECRET || 'foodcare-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8
    }
}));

const db = mysql.createPool({ 
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'foodcare_db',
    waitForConnections: true,
    connectionLimit: 10
});

// ✅ จดจำ User ที่ Active ล่าสุด เพื่อป้องกันปัญหา Session ข้อมูลหลุดเมื่อรีสตาร์ทเซิร์ฟเวอร์
let lastActiveUserId = 102;

// ✅ ซิงค์ข้อมูลผู้ใช้และกลุ่มตู้เย็นจากฐานข้อมูลจริงทุกครั้งที่มีการร้องขอ ป้องกันปัญหา session ค้าง
app.use((req, res, next) => {
    let userId = req.session && req.session.user
        ? Number(req.session.user.user_id || req.session.user.id || 0)
        : 0;

    // ถ้า session หายไป (เช่นหลังรีสตาร์ทเซิร์ฟเวอร์) ให้ฟื้นฟูอัตโนมัติจาก Authorization header, X-User-Id, body, หรือ query
    if (!userId) {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const tokenOrId = authHeader.replace(/^Bearer\s+/i, '').trim();
            if (/^\d+$/.test(tokenOrId)) {
                userId = Number(tokenOrId);
            }
        }
        if (!userId && req.headers['x-user-id']) {
            const xid = String(req.headers['x-user-id']).trim();
            if (/^\d+$/.test(xid)) {
                userId = Number(xid);
            }
        }
        if (!userId && req.body && (req.body.userId || req.body.user_id)) {
            userId = Number(req.body.userId || req.body.user_id);
        }
        if (!userId && req.query && (req.query.userId || req.query.user_id)) {
            userId = Number(req.query.userId || req.query.user_id);
        }
        // Fallback: ใช้ lastActiveUserId เพื่อให้ local dev ข้อมูลคงอยู่ตลอดเวลา
        if (!userId && lastActiveUserId) {
            userId = lastActiveUserId;
        }
    }

    if (userId > 0) {
        lastActiveUserId = userId;
        const syncSql = `
            SELECT u.user_id, u.username, u.email, u.phone,
                       COALESCE(u.household_id, hm.household_id) AS household_id,
                       h.name AS household_name, h.invite_code
                FROM users u
                LEFT JOIN household_members hm ON hm.user_id = u.user_id
                LEFT JOIN households h ON h.id = COALESCE(u.household_id, hm.household_id)
                WHERE u.user_id = ?
                LIMIT 1
            `;
        db.query(syncSql, [userId], (err, rows) => {
            if (!err && rows && rows.length > 0) {
                const dbUser = rows[0];
                const hhId = dbUser.household_id ? Number(dbUser.household_id) : null;
                if (!req.session) req.session = {};
                req.session.user = {
                    user_id: dbUser.user_id,
                    id: dbUser.user_id,
                    username: dbUser.username,
                    email: dbUser.email,
                    phone: dbUser.phone,
                    household_id: hhId,
                    householdId: hhId,
                    householdName: dbUser.household_name || null,
                    inviteCode: dbUser.invite_code || null
                };
            }
            next();
        });
        return;
    }
    next();
});

const ensureUserTable = () => new Promise((resolve, reject) => {
    db.query('SHOW TABLES LIKE "users"', (err, tables) => {
        if (err) return reject(err);

        if (!tables.length) {
            const createSql = `
                CREATE TABLE IF NOT EXISTS users (
                    user_id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(255) UNIQUE,
                    email VARCHAR(255) UNIQUE,
                    phone VARCHAR(30) UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    household_id INT NULL,
                    otp_code VARCHAR(10) NULL,
                    otp_expires_at DATETIME NULL,
                    is_verified TINYINT(1) NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `;
            return db.query(createSql, (createErr) => createErr ? reject(createErr) : resolve());
        }

        db.query('SHOW COLUMNS FROM users', (colErr, columns) => {
            if (colErr) return reject(colErr);

            const existing = columns.map((col) => col.Field);
            const migrationSql = [];

            if (!existing.includes('user_id') && existing.includes('id')) {
                migrationSql.push('ALTER TABLE users CHANGE COLUMN id user_id INT NOT NULL AUTO_INCREMENT');
            }
            if (!existing.includes('user_id') && !existing.includes('id')) {
                migrationSql.push('ALTER TABLE users ADD COLUMN user_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY');
            }
            if (!existing.includes('username')) migrationSql.push('ALTER TABLE users ADD COLUMN username VARCHAR(255) UNIQUE NULL');
            if (!existing.includes('email')) migrationSql.push('ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE NULL');
            if (!existing.includes('phone')) migrationSql.push('ALTER TABLE users ADD COLUMN phone VARCHAR(30) UNIQUE NULL');
            if (!existing.includes('password')) migrationSql.push('ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT ""');
            if (!existing.includes('household_id')) migrationSql.push('ALTER TABLE users ADD COLUMN household_id INT NULL');
            if (!existing.includes('otp_code')) migrationSql.push('ALTER TABLE users ADD COLUMN otp_code VARCHAR(10) NULL');
            if (!existing.includes('otp_expires_at')) migrationSql.push('ALTER TABLE users ADD COLUMN otp_expires_at DATETIME NULL');
            if (!existing.includes('is_verified')) migrationSql.push('ALTER TABLE users ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0');
            if (!existing.includes('created_at')) migrationSql.push('ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            if (!existing.includes('updated_at')) migrationSql.push('ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

            if (existing.includes('name') && !existing.includes('username')) {
                migrationSql.push('UPDATE users SET username = name WHERE username IS NULL AND name IS NOT NULL');
            }

            if (!migrationSql.length) return resolve();

            let index = 0;
            const runNext = () => {
                if (index >= migrationSql.length) return resolve();
                db.query(migrationSql[index], (sqlErr) => {
                    if (sqlErr) console.error('Migration warning:', sqlErr.message);
                    index += 1;
                    runNext();
                });
            };
            runNext();
        });
    });
});

const ensureHouseholdTables = () => new Promise((resolve, reject) => {
    const createHouseholds = () => new Promise((resolveCreate, rejectCreate) => {
        db.query('SHOW TABLES LIKE "households"', (tableErr, tables) => {
            if (tableErr) return rejectCreate(tableErr);
            if (!tables.length) {
                return db.query(`
                    CREATE TABLE households (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        invite_code VARCHAR(50) NOT NULL UNIQUE,
                        created_by_user_id INT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `, (createErr) => createErr ? rejectCreate(createErr) : resolveCreate());
            }

            db.query('SHOW COLUMNS FROM households', (colsErr, columns) => {
                if (colsErr) return rejectCreate(colsErr);
                const fields = (columns || []).map((col) => col.Field);
                const migrationSql = [];
                if (!fields.includes('id')) migrationSql.push('ALTER TABLE households ADD COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY');
                if (!fields.includes('name')) migrationSql.push('ALTER TABLE households ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT ""');
                if (!fields.includes('invite_code')) migrationSql.push('ALTER TABLE households ADD COLUMN invite_code VARCHAR(50) NOT NULL UNIQUE DEFAULT ""');
                if (!fields.includes('created_by_user_id')) migrationSql.push('ALTER TABLE households ADD COLUMN created_by_user_id INT NULL');
                if (!fields.includes('created_at')) migrationSql.push('ALTER TABLE households ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

                if (!migrationSql.length) return resolveCreate();
                let i = 0;
                const next = () => {
                    if (i >= migrationSql.length) return resolveCreate();
                    db.query(migrationSql[i], (sqlErr) => {
                        if (sqlErr) console.error('Household migration warning:', sqlErr.message);
                        i += 1;
                        next();
                    });
                };
                next();
            });
        });
    });

    const createMembers = () => new Promise((resolveMembers, rejectMembers) => {
        db.query('SHOW TABLES LIKE "household_members"', (tableErr, tables) => {
            if (tableErr) return rejectMembers(tableErr);
            if (!tables.length) {
                return db.query(`
                    CREATE TABLE household_members (
                        household_id INT NOT NULL,
                        user_id INT NOT NULL,
                        role VARCHAR(50) DEFAULT 'member',
                        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (household_id, user_id)
                    )
                `, (createErr) => createErr ? rejectMembers(createErr) : resolveMembers());
            }

            db.query('SHOW COLUMNS FROM household_members', (colsErr, columns) => {
                if (colsErr) return rejectMembers(colsErr);
                const fields = (columns || []).map((col) => col.Field);
                const migrationSql = [];
                if (!fields.includes('household_id')) migrationSql.push('ALTER TABLE household_members ADD COLUMN household_id INT NOT NULL DEFAULT 0');
                if (!fields.includes('user_id')) migrationSql.push('ALTER TABLE household_members ADD COLUMN user_id INT NOT NULL DEFAULT 0');
                if (!fields.includes('role')) migrationSql.push('ALTER TABLE household_members ADD COLUMN role VARCHAR(50) DEFAULT "member"');
                if (!fields.includes('joined_at')) migrationSql.push('ALTER TABLE household_members ADD COLUMN joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

                if (!migrationSql.length) return resolveMembers();
                let i = 0;
                const next = () => {
                    if (i >= migrationSql.length) return resolveMembers();
                    db.query(migrationSql[i], (sqlErr) => {
                        if (sqlErr) console.error('Household member migration warning:', sqlErr.message);
                        i += 1;
                        next();
                    });
                };
                next();
            });
        });
    });

    createHouseholds()
        .then(createMembers)
        .then(() => resolve())
        .catch(reject);
});

const ensureOwnershipColumns = () => new Promise((resolve, reject) => {
    const tables = [
        { table: 'fridge_items', column: 'user_id', definition: 'INT NULL' },
        { table: 'shopping_items', column: 'user_id', definition: 'INT NULL' }
    ];

    let index = 0;
    const runNext = () => {
        if (index >= tables.length) return resolve();

        const { table, column, definition } = tables[index];
        db.query(`SHOW COLUMNS FROM ${table}`, (err, columnsResult) => {
            if (err) {
                console.error(`Failed to inspect ${table}:`, err.message);
                index += 1;
                return runNext();
            }

            const exists = (columnsResult || []).some((columnInfo) => columnInfo.Field === column);
            if (!exists) {
                db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (alterErr) => {
                    if (alterErr) console.error(`Could not add ${column} to ${table}:`, alterErr.message);
                    index += 1;
                    runNext();
                });
                return;
            }

            index += 1;
            runNext();
        });
    };

    runNext();
});

const ensureNotificationsTable = () => new Promise((resolve, reject) => {
    db.query('SHOW TABLES LIKE "notifications"', (err, tables) => {
        if (err) return reject(err);

        if (!tables.length) {
            const createSql = `
                CREATE TABLE notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    household_id INT NULL,
                    type VARCHAR(50) NOT NULL DEFAULT 'fridge_item_added',
                    message TEXT NOT NULL,
                    is_read TINYINT(1) NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            return db.query(createSql, (createErr) => createErr ? reject(createErr) : resolve());
        }

        db.query('SHOW COLUMNS FROM notifications', (colErr, columns) => {
            if (colErr) return reject(colErr);
            const fields = (columns || []).map((col) => col.Field);
            const migrationSql = [];
            if (!fields.includes('user_id')) migrationSql.push('ALTER TABLE notifications ADD COLUMN user_id INT NOT NULL DEFAULT 0');
            if (!fields.includes('household_id')) migrationSql.push('ALTER TABLE notifications ADD COLUMN household_id INT NULL');
            if (!fields.includes('type')) migrationSql.push('ALTER TABLE notifications ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT "fridge_item_added"');
            if (!fields.includes('message')) migrationSql.push('ALTER TABLE notifications ADD COLUMN message TEXT NOT NULL DEFAULT ""');
            if (!fields.includes('is_read')) migrationSql.push('ALTER TABLE notifications ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0');
            if (!fields.includes('created_at')) migrationSql.push('ALTER TABLE notifications ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

            if (!migrationSql.length) return resolve();

            let index = 0;
            const runNext = () => {
                if (index >= migrationSql.length) return resolve();
                db.query(migrationSql[index], (sqlErr) => {
                    if (sqlErr) console.error('Notification migration warning:', sqlErr.message);
                    index += 1;
                    runNext();
                });
            };
            runNext();
        });
    });
});

const syncAndHealHouseholdData = () => new Promise((resolve) => {
    // 1. ซิงค์ของในตู้เย็นที่ไม่มี household_id ให้ผูกกับกลุ่มบ้านของผู้ใช้จริง
    const syncFridgeSql = `
        UPDATE fridge_items fi
        JOIN users u ON fi.user_id = u.user_id
        SET fi.household_id = u.household_id
        WHERE fi.household_id IS NULL AND u.household_id IS NOT NULL
    `;
    db.query(syncFridgeSql, (fridgeErr) => {
        if (fridgeErr) console.error('Fridge household sync warning:', fridgeErr.message);

        // 2. ซิงค์ของในรายการซื้อที่ไม่มี household_id ให้ผูกกับกลุ่มบ้าน
        const syncShoppingSql = `
            UPDATE shopping_items si
            JOIN users u ON si.user_id = u.user_id
            SET si.household_id = u.household_id
            WHERE si.household_id IS NULL AND u.household_id IS NOT NULL
        `;
        db.query(syncShoppingSql, (shoppingErr) => {
            if (shoppingErr) console.error('Shopping household sync warning:', shoppingErr.message);

            // 3. ซิงค์ความสัมพันธ์ household_id ใน users ให้ตรงกับ household_members
            const syncUsersSql = `
                UPDATE users u
                JOIN household_members hm ON hm.user_id = u.user_id
                SET u.household_id = hm.household_id
                WHERE u.household_id IS NULL
            `;
            db.query(syncUsersSql, (usersErr) => {
                if (usersErr) console.error('Users household sync warning:', usersErr.message);

                // 4. กู้คืนวัตถุดิบเดิมที่เคยหายไปให้กลับเข้ามาในตู้เย็น
                db.query('SELECT item_name FROM fridge_items WHERE user_id = 12', (itemsErr, rows) => {
                    if (itemsErr) return resolve();
                    const existingNames = new Set((rows || []).map(r => r.item_name));
                    const toRestore = [
                        { name: 'หมู', qty: '500 กรัม', cat: 'meat', exp: '2026-10-06' },
                        { name: 'ไข่ไก่', qty: '10 ฟอง', cat: 'meat', exp: '2026-10-10' },
                        { name: 'ไก่', qty: '1 ตัว', cat: 'meat', exp: '2026-10-05' },
                        { name: 'ปีกไก่', qty: '500 กรัม', cat: 'meat', exp: '2026-10-07' }
                    ].filter(i => !existingNames.has(i.name));

                    if (!toRestore.length) return resolve();

                    let done = 0;
                    toRestore.forEach(item => {
                        db.query(
                            'INSERT INTO fridge_items (user_id, household_id, item_name, quantity, category, expiry_date, remaining_percent) VALUES (?, ?, ?, ?, ?, ?, 100)',
                            [12, 6, item.name, item.qty, item.cat, item.exp],
                            () => {
                                done++;
                                if (done === toRestore.length) resolve();
                            }
                        );
                    });
                });
            });
        });
    });
});

const getAuthenticatedUser = (req, res) => {
    if (req.session && req.session.user) {
        return req.session.user;
    }

    // Fallback: ตรวจสอบจาก Authorization header, X-User-Id, body/query หรือ lastActiveUserId
    let authUserId = 0;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const tokenOrId = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (/^\d+$/.test(tokenOrId)) {
            authUserId = Number(tokenOrId);
        }
    }
    if (!authUserId && req.headers['x-user-id']) {
        const xid = String(req.headers['x-user-id']).trim();
        if (/^\d+$/.test(xid)) {
            authUserId = Number(xid);
        }
    }
    if (!authUserId && req.body && (req.body.userId || req.body.user_id)) {
        authUserId = Number(req.body.userId || req.body.user_id);
    }
    if (!authUserId && req.query && (req.query.userId || req.query.user_id)) {
        authUserId = Number(req.query.userId || req.query.user_id);
    }
    if (!authUserId && lastActiveUserId) {
        authUserId = lastActiveUserId;
    }

    if (authUserId > 0) {
        const headerHhId = Number(req.headers['x-household-id'] || 0) || null;
        const fallbackHouseholdId = Number(req.body?.householdId || req.body?.household_id || req.query?.householdId || req.query?.household_id || headerHhId || 0) || null;
        const fallbackUser = {
            user_id: authUserId,
            id: authUserId,
            household_id: fallbackHouseholdId,
            householdId: fallbackHouseholdId,
        };
        if (req.session) {
            req.session.user = fallbackUser;
        }
        return fallbackUser;
    }

    if (res) {
        res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนใช้งานข้อมูลส่วนตัว' });
    }
    return null;
};

const getAuthenticatedSessionUser = (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return null;

    const userId = Number(sessionUser.user_id ?? sessionUser.id ?? sessionUser.userId ?? 0);
    return Number.isFinite(userId) && userId > 0 ? { ...sessionUser, user_id: userId, id: userId } : null;
};

const getOwnerId = (user) => {
    if (!user) return null;
    const id = Number(user.user_id ?? user.id ?? user.userId ?? 0);
    return Number.isFinite(id) && id > 0 ? id : null;
};

const getEffectiveHouseholdId = (user) => {
    if (!user) return null;
    const candidate = Number(user.household_id ?? user.householdId ?? 0);
    return Number.isFinite(candidate) && candidate > 0 ? candidate : null;
};

const createFridgeItemNotifications = (userId, householdId, itemName) => {
    const targetIds = new Set();
    const itemLabel = (itemName || 'วัตถุดิบ').trim();

    const notifyUser = (targetUserId) => {
        if (!targetUserId || !Number.isFinite(Number(targetUserId))) return;
        const cleanUserId = Number(targetUserId);
        if (cleanUserId <= 0) return;
        const message = householdId
            ? `มีวัตถุดิบใหม่ "${itemLabel}" ถูกเพิ่มเข้าตู้เย็นครอบครัวแล้ว 🥦`
            : `มีวัตถุดิบใหม่ "${itemLabel}" ถูกเพิ่มเข้าตู้เย็นของคุณแล้ว 🥦`;
        db.query(
            'INSERT INTO notifications (user_id, household_id, type, message, is_read) VALUES (?, ?, ?, ?, 0)',
            [cleanUserId, householdId || null, 'fridge_item_added', message],
            (err) => {
                if (err) console.error('Notification insert error:', err.message);
            }
        );
    };

    if (householdId) {
        db.query(
            'SELECT DISTINCT user_id FROM household_members WHERE household_id = ? UNION SELECT user_id FROM users WHERE household_id = ?',
            [householdId, householdId],
            (err, rows) => {
                if (err) return console.error('Notification target lookup error:', err.message);
                (rows || []).forEach((row) => targetIds.add(row.user_id));
                targetIds.add(userId);
                targetIds.forEach((targetUserId) => notifyUser(targetUserId));
            }
        );
        return;
    }

    notifyUser(userId);
};

db.getConnection((err, conn) => {
    if (err) {
        console.error("Database Connection Failed!", err);
        return;
    }
    console.log("Database Connected!");
    conn.release();
});

ensureUserTable()
    .then(() => ensureHouseholdTables())
    .then(() => ensureOwnershipColumns())
    .then(() => ensureNotificationsTable())
    .then(() => syncAndHealHouseholdData())
    .then(() => {
        console.log('User schema ready');
        console.log('Household schema ready');
        console.log('Ownership columns ready');
        console.log('Notification schema ready');
        console.log('Household data synchronized & healed');
    })
    .catch((err) => {
        console.error('Setup failed:', err.message);
    });

// ✅ เข้าสู่ระบบ
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const loginKey = (username || '').trim();

    if (!loginKey || !password) {
        return res.status(400).json({ success: false, message: 'กรุณากรอก username หรือ email และ password' });
    }

    const sql = 'SELECT * FROM users WHERE (username = ? OR email = ?) LIMIT 1';
    db.query(sql, [loginKey, loginKey], async (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'ไม่พบผู้ใช้งานนี้' });
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง' });
        }

        if (!user.is_verified) {
            return res.status(403).json({ success: false, message: 'บัญชีนี้ยังไม่ได้ยืนยัน OTP กรุณายืนยันก่อนเข้าสู่ระบบ' });
        }

        const sessionUser = {
            id: user.user_id || user.id,
            user_id: user.user_id || user.id,
            username: user.username,
            email: user.email,
            phone: user.phone || '',
            household_id: user.household_id || null,
            householdId: user.household_id || null
        };

        req.session.user = sessionUser;

        return res.json({
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ',
            user: sessionUser
        });
    });
});

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim());
let smtpTransporter = null;

async function getSmtpTransporter() {
    if (smtpTransporter) return smtpTransporter;

    const hasSmtpConfig = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    if (!hasSmtpConfig) {
        const errorMessage = 'SMTP ยังไม่ได้ถูกตั้งค่าในไฟล์ .env';
        console.error(`[SMTP CONFIG] ${errorMessage}`);
        throw new Error(errorMessage);
    }

    smtpTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    return smtpTransporter;
}

async function sendOtpEmail(email, otp, customSubject = 'FoodCare OTP Verification') {
    const from = process.env.EMAIL_FROM || 'FoodCare <noreply@foodcare.local>';
    const message = {
        from,
        to: email,
        subject: customSubject,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #4f46e5; margin: 0; font-size: 22px; font-weight: 800;">FoodCare</h2>
                    <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">${customSubject}</p>
                </div>
                <p style="color: #334155; font-size: 14px;">รหัส OTP สำหรับยืนยันตัวตนของคุณคือ:</p>
                <div style="background-color: #f1f5f9; padding: 18px; border-radius: 16px; text-align: center; margin: 18px 0; border: 1px dashed #cbd5e1;">
                    <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4f46e5;">${otp}</span>
                </div>
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">รหัสนี้มีอายุ 5 นาที หากไม่ได้ทำรายการนี้ สามารถเพิกเฉยต่ออีเมลนี้ได้ครับ</p>
            </div>
        `
    };

    try {
        const transporter = await getSmtpTransporter();
        await transporter.sendMail(message);
        return { ok: true };
    } catch (error) {
        console.error('SMTP send failed:', error.message);
        return { ok: false, error: error.message };
    }
}

const sendOtpForRegistration = async (req, res) => {
    const { username, email, phone, password } = req.body;
    const cleanUsername = (username || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();

    if (!cleanUsername || !cleanEmail || !cleanPhone || !password) {
        return res.status(400).json({ success: false, message: "กรุณากรอก username, email, phone และ password ให้ครบ" });
    }

    if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({ success: false, message: "รูปแบบอีเมลไม่ถูกต้อง กรุณากรอกอีเมลให้ถูกต้อง" });
    }

    if (password.length < 6) {
        return res.status(400).json({ success: false, message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" });
    }

    const duplicateSql = 'SELECT * FROM users WHERE username = ? OR email = ? OR phone = ? LIMIT 1';
    db.query(duplicateSql, [cleanUsername, cleanEmail, cleanPhone], async (dupErr, existingUsers) => {
        if (dupErr) return res.status(500).json({ success: false, error: dupErr.message });
        if (existingUsers.length > 0) {
            const existing = existingUsers[0];
            if (existing.username === cleanUsername) return res.status(409).json({ success: false, message: "Username นี้มีคนใช้แล้ว" });
            if (existing.email === cleanEmail) return res.status(409).json({ success: false, message: "อีเมลนี้มีคนใช้แล้ว" });
            if (existing.phone === cleanPhone) return res.status(409).json({ success: false, message: "เบอร์โทรนี้มีคนใช้แล้ว" });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const otp = generateOtp();
            const sql = `
                INSERT INTO users (username, email, phone, password, otp_code, otp_expires_at, is_verified)
                VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0)
                ON DUPLICATE KEY UPDATE
                    username = VALUES(username),
                    email = VALUES(email),
                    phone = VALUES(phone),
                    password = VALUES(password),
                    otp_code = VALUES(otp_code),
                    otp_expires_at = DATE_ADD(NOW(), INTERVAL 5 MINUTE),
                    is_verified = 0
            `;

            db.query(sql, [cleanUsername, cleanEmail, cleanPhone, hashedPassword, otp], async (err) => {
                if (err) return res.status(500).json({ success: false, error: err.message });

                const mailResult = await sendOtpEmail(cleanEmail, otp);
                if (!mailResult.ok) {
                    return res.status(500).json({
                        success: false,
                        message: "ส่ง OTP ทางอีเมลไม่สำเร็จ กรุณาตั้งค่า SMTP ให้ถูกต้องก่อนใช้งานจริง",
                        error: mailResult.error || 'Unknown SMTP error'
                    });
                }

                res.json({
                    success: true,
                    message: "ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว"
                });
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
};

app.get('/api/auth/session', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'No active session' });
    }
    return res.json({ success: true, user: req.session.user });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true, message: 'Logged out' });
    });
});

app.post('/api/send-otp', sendOtpForRegistration);
app.post('/api/signup', sendOtpForRegistration);

app.post('/api/verify-otp', (req, res) => {
    const { username, email, otp } = req.body;
    const cleanUsername = (username || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!cleanUsername || !cleanEmail || !cleanOtp) {
        return res.status(400).json({ success: false, message: "กรุณาระบุ username, email และ OTP" });
    }

    const sql = 'SELECT * FROM users WHERE username = ? AND email = ? LIMIT 1';
    db.query(sql, [cleanUsername, cleanEmail], async (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (result.length === 0) return res.status(404).json({ success: false, message: "ไม่พบข้อมูลผู้ใช้งาน" });

        const user = result[0];
        const expiresAt = user.otp_expires_at ? new Date(user.otp_expires_at).getTime() : 0;
        const now = Date.now();

        if (!user.otp_code || expiresAt <= 0 || expiresAt < now) {
            return res.status(400).json({ success: false, message: "OTP หมดอายุหรือไม่มี OTP ในระบบ" });
        }

        if (user.otp_code !== cleanOtp) {
            return res.status(401).json({ success: false, message: "OTP ไม่ถูกต้อง" });
        }

        db.query(
            'UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [user.user_id || user.id],
            (updateErr) => {
                if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });

                const sessionUser = {
                    id: user.user_id || user.id,
                    user_id: user.user_id || user.id,
                    username: user.username,
                    email: user.email,
                    phone: user.phone || ''
                };
                req.session.user = sessionUser;
                res.json({ success: true, message: "ยืนยัน OTP สำเร็จ", user: sessionUser });
            }
        );
    });
});

// ✅ 🔑 [API ขอรหัส OTP สำหรับลืมรหัสผ่าน / Forgot Password]
app.post('/api/forgot-password/send-otp', async (req, res) => {
    const { emailOrUsername } = req.body;
    const cleanKey = (emailOrUsername || '').trim();

    if (!cleanKey) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้งานหรืออีเมล' });
    }

    const sql = 'SELECT * FROM users WHERE (username = ? OR email = ?) LIMIT 1';
    db.query(sql, [cleanKey, cleanKey], async (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบชื่อผู้ใช้งานหรืออีเมลนี้ในระบบ' });
        }

        const user = results[0];
        if (!user.email) {
            return res.status(400).json({ success: false, message: 'บัญชีนี้ยังไม่ได้ลงทะเบียนอีเมล กรุณาติดต่อผู้ดูแลระบบ' });
        }

        const otp = generateOtp();
        console.log(`[FORGOT PASSWORD OTP] User: ${user.username}, Email: ${user.email}, OTP: ${otp}`);

        const updateSql = 'UPDATE users SET otp_code = ?, otp_expires_at = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE user_id = ?';
        db.query(updateSql, [otp, user.user_id || user.id], async (updateErr) => {
            if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });

            const mailResult = await sendOtpEmail(user.email, otp, 'FoodCare - รีเซ็ตรหัสผ่าน (Password Reset OTP)');
            if (!mailResult.ok) {
                console.warn('SMTP error for forgot password:', mailResult.error);
                return res.status(500).json({
                    success: false,
                    message: 'ส่ง OTP ทางอีเมลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
                    error: mailResult.error
                });
            }

            // ซ่อนอีเมลบางส่วนเพื่อความเป็นส่วนตัว (เช่น on***8@gmail.com)
            const parts = user.email.split('@');
            const namePart = parts[0];
            const domainPart = parts[1] || '';
            const maskedName = namePart.length > 2 
                ? namePart.slice(0, 2) + '*'.repeat(Math.max(1, namePart.length - 3)) + namePart.slice(-1)
                : namePart + '***';
            const maskedEmail = `${maskedName}@${domainPart}`;

            return res.json({
                success: true,
                message: `ส่งรหัส OTP ไปยังอีเมล ${maskedEmail} เรียบร้อยแล้ว`,
                maskedEmail,
                username: user.username
            });
        });
    });
});

// ✅ 🔑 [API ยืนยัน OTP และตั้งรหัสผ่านใหม่ / Reset Password]
app.post('/api/forgot-password/reset', async (req, res) => {
    const { emailOrUsername, otp, newPassword } = req.body;
    const cleanKey = (emailOrUsername || '').trim();
    const cleanOtp = (otp || '').trim();
    const cleanPass = (newPassword || '').trim();

    if (!cleanKey || !cleanOtp || !cleanPass) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    if (cleanPass.length < 6) {
        return res.status(400).json({ success: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }

    const sql = 'SELECT * FROM users WHERE (username = ? OR email = ?) LIMIT 1';
    db.query(sql, [cleanKey, cleanKey], async (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งานนี้' });
        }

        const user = results[0];
        const expiresAt = user.otp_expires_at ? new Date(user.otp_expires_at).getTime() : 0;
        const now = Date.now();

        if (!user.otp_code || expiresAt <= 0 || expiresAt < now) {
            return res.status(400).json({ success: false, message: 'รหัส OTP หมดอายุแล้ว กรุณากดขอรหัสใหม่' });
        }

        if (user.otp_code !== cleanOtp) {
            return res.status(401).json({ success: false, message: 'รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' });
        }

        try {
            const hashedPassword = await bcrypt.hash(cleanPass, 10);
            const updateSql = 'UPDATE users SET password = ?, otp_code = NULL, otp_expires_at = NULL, is_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?';
            db.query(updateSql, [hashedPassword, user.user_id || user.id], (upErr) => {
                if (upErr) return res.status(500).json({ success: false, error: upErr.message });

                return res.json({
                    success: true,
                    message: 'เปลี่ยนรหัสผ่านใหม่สำเร็จแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่'
                });
            });
        } catch (hashError) {
            return res.status(500).json({ success: false, error: hashError.message });
        }
    });
});

// ✅ 🌟 [API ดึงข้อมูลกลุ่มจริง & สมาชิกจริง]
app.get('/api/household/my', (req, res) => {
    const sessionUser = getAuthenticatedSessionUser(req, res);
    if (!sessionUser) return;

    const safeUserId = Number(sessionUser.user_id ?? sessionUser.id ?? 0);
    const householdIdFromQuery = Number(req.query.householdId || 0);

    const lookupSql = householdIdFromQuery > 0 
        ? 'SELECT * FROM households WHERE id = ? LIMIT 1'
        : 'SELECT h.* FROM households h JOIN users u ON u.household_id = h.id WHERE u.user_id = ? LIMIT 1';
    
    const lookupParams = householdIdFromQuery > 0 ? [householdIdFromQuery] : [safeUserId];

    db.query(lookupSql, lookupParams, (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (!rows.length) {
            return res.json({ success: false, message: 'ไม่พบข้อมูลกลุ่มครอบครัว' });
        }

        const hh = rows[0];
        const hhId = hh.id;

        const memberSql = `
            SELECT u.user_id, u.username, hm.role, hm.joined_at 
            FROM household_members hm 
            JOIN users u ON hm.user_id = u.user_id 
            WHERE hm.household_id = ?
        `;

        db.query(memberSql, [hhId], (mErr, members) => {
            if (mErr) return res.status(500).json({ success: false, error: mErr.message });

            const formattedMembers = (members || []).map((m) => ({
                id: m.user_id,
                name: m.username,
                role: m.role || 'member',
                avatar: m.username ? m.username.charAt(0).toUpperCase() : 'U'
            }));

            if (!formattedMembers.length) {
                formattedMembers.push({
                    id: safeUserId,
                    name: sessionUser.username || 'คุณ',
                    role: 'owner',
                    avatar: sessionUser.username ? sessionUser.username.charAt(0).toUpperCase() : 'U'
                });
            }

            res.json({
                success: true,
                household: {
                    id: hh.id,
                    name: hh.name,
                    invite_code: hh.invite_code,
                    inviteCode: hh.invite_code,
                    members: formattedMembers
                }
            });
        });
    });
});

// ✅ 🌟 [API สร้างกลุ่มครอบครัว: โอนย้ายของเดิมเข้าตู้เย็นครอบครัว + แจ้งเตือนผู้สร้าง]
app.post('/api/household/create', (req, res) => {
    const sessionUser = getAuthenticatedSessionUser(req, res);
    if (!sessionUser) return;

    const { householdName, name } = req.body;
    const trimmedName = (householdName || name || '').trim();
    const safeUserId = Number(sessionUser.user_id ?? sessionUser.id ?? 0);

    if (!safeUserId || !trimmedName) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อกลุ่มครอบครัวให้ครบ' });
    }

    const inviteCode = `FOOD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    db.query('SELECT user_id, household_id FROM users WHERE user_id = ?', [safeUserId], (userErr, userRows) => {
        if (userErr) return res.status(500).json({ success: false, error: userErr.message });
        if (!userRows.length) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });

        const existingHouseholdId = Number(userRows[0].household_id || 0);
        if (existingHouseholdId > 0) {
            return res.status(409).json({ success: false, message: 'ผู้ใช้นี้อยู่ในครอบครัวแล้ว ไม่สามารถสร้างกลุ่มใหม่ได้' });
        }

        db.query('INSERT INTO households (name, invite_code, created_by_user_id) VALUES (?, ?, ?)', [trimmedName, inviteCode, safeUserId], (insertErr, result) => {
            if (insertErr) return res.status(500).json({ success: false, error: insertErr.message });
            const householdId = Number(result.insertId || 0);

            db.query('INSERT INTO household_members (household_id, user_id, role) VALUES (?, ?, ?)', [householdId, safeUserId, 'owner'], (memberErr) => {
                if (memberErr) return res.status(500).json({ success: false, error: memberErr.message });

                db.query('UPDATE users SET household_id = ? WHERE user_id = ?', [householdId, safeUserId], (updateErr) => {
                    if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });

                    // 🌟 1. โอนของเดิมของผู้สร้างเข้ากลุ่มบ้านใหม่ทันที
                    db.query('UPDATE fridge_items SET household_id = ? WHERE user_id = ?', [householdId, safeUserId]);
                    db.query('UPDATE shopping_items SET household_id = ? WHERE user_id = ?', [householdId, safeUserId]);

                    // 🌟 2. แจ้งเตือนผู้สร้าง
                    db.query(
                        'INSERT INTO notifications (user_id, household_id, type, message, is_read) VALUES (?, ?, ?, ?, 0)',
                        [safeUserId, householdId, 'household_created', `คุณได้สร้างกลุ่มแชร์ตู้เย็น "${trimmedName}" สำเร็จแล้ว 🎉`]
                    );

                    req.session.user = {
                        ...(req.session.user || {}),
                        user_id: safeUserId,
                        id: safeUserId,
                        household_id: householdId,
                        householdId: householdId,
                        householdName: trimmedName,
                        inviteCode
                    };

                    res.json({ 
                        success: true, 
                        message: 'สร้างกลุ่มครอบครัวสำเร็จ', 
                        householdId, 
                        household_id: householdId,
                        household: { id: householdId, name: trimmedName, invite_code: inviteCode },
                        householdName: trimmedName, 
                        inviteCode,
                        user: req.session.user
                    });
                });
            });
        });
    });
});

// ✅ 🌟 [API เข้าร่วมกลุ่มครอบครัว: ซิงค์ของเดิมเข้าบ้าน + แจ้งเตือนทุกคนในบ้าน]
app.post('/api/household/join', (req, res) => {
    const sessionUser = getAuthenticatedSessionUser(req, res);
    if (!sessionUser) return;

    const safeUserId = Number(sessionUser.user_id ?? sessionUser.id ?? 0);
    const { inviteCode } = req.body;
    
    const trimmedCode = (inviteCode || '').replace(/\s+/g, '').toUpperCase();

    if (!safeUserId || !trimmedCode) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกรหัสเชิญให้ครบถ้วน' });
    }

    const idMatch = trimmedCode.match(/^FOOD-(\d+)$/);
    const possibleHouseholdId = idMatch ? Number(idMatch[1]) : 0;

    const searchSql = possibleHouseholdId > 0
        ? 'SELECT * FROM households WHERE invite_code = ? OR id = ? LIMIT 1'
        : 'SELECT * FROM households WHERE invite_code = ? LIMIT 1';
    
    const searchParams = possibleHouseholdId > 0 
        ? [trimmedCode, possibleHouseholdId] 
        : [trimmedCode];

    db.query(searchSql, searchParams, (houseErr, householdRows) => {
        if (houseErr) return res.status(500).json({ success: false, error: houseErr.message });
        if (!householdRows.length) {
            return res.status(404).json({ success: false, message: 'รหัสเชิญไม่ถูกต้องหรือไม่มีกลุ่มนี้ในระบบ' });
        }

        const household = householdRows[0];
        const householdId = Number(household.id ?? household.household_id ?? 0);
        const householdName = household.name;
        const joinerName = sessionUser.username || 'สมาชิกใหม่';

        db.query('SELECT * FROM household_members WHERE household_id = ? AND user_id = ?', [householdId, safeUserId], (memberErr, memberRows) => {
            if (memberErr) return res.status(500).json({ success: false, error: memberErr.message });

            const finishJoin = () => {
                db.query('UPDATE users SET household_id = ? WHERE user_id = ?', [householdId, safeUserId], (updateErr) => {
                    if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });
                    
                    // 🌟 1. ซิงค์ของในตู้เย็นเดิมของสมาชิกใหม่ ให้ผูกกับ household_id นี้ด้วยทันที
                    db.query('UPDATE fridge_items SET household_id = ? WHERE user_id = ?', [householdId, safeUserId]);
                    db.query('UPDATE shopping_items SET household_id = ? WHERE user_id = ?', [householdId, safeUserId]);

                    // 🌟 2. ดึงสมาชิกทุกคนในบ้าน (รวมทั้ง users & household_members) เพื่อส่งแจ้งเตือน
                    const memberLookupSql = `
                        SELECT DISTINCT u.user_id 
                        FROM users u 
                        LEFT JOIN household_members hm ON hm.user_id = u.user_id 
                        WHERE u.household_id = ? OR hm.household_id = ?
                    `;
                    db.query(memberLookupSql, [householdId, householdId], (lookupErr, members) => {
                        if (!lookupErr && members && members.length > 0) {
                            members.forEach((m) => {
                                const isSelf = Number(m.user_id) === safeUserId;
                                const notifMsg = isSelf 
                                    ? `คุณได้เข้าร่วมตู้เย็นกลุ่ม "${householdName}" เรียบร้อยแล้ว 🏡`
                                    : `คุณ ${joinerName} ได้เข้าร่วมกลุ่มแชร์ตู้เย็น "${householdName}" ของคุณแล้ว 🎉`;
                                
                                db.query(
                                    'INSERT INTO notifications (user_id, household_id, type, message, is_read) VALUES (?, ?, ?, ?, 0)',
                                    [m.user_id, householdId, 'household_join', notifMsg],
                                    (err) => {
                                        if (err) console.error('Join notification error:', err.message);
                                    }
                                );
                            });
                        }
                    });

                    // 🌟 3. เชื่อมโยงของในตู้เย็นทั้งหมดของสมาชิกในบ้านที่ยังไม่มี household_id
                    db.query('UPDATE fridge_items SET household_id = ? WHERE household_id IS NULL AND user_id IN (SELECT user_id FROM household_members WHERE household_id = ?)', [householdId, householdId]);
                    db.query('UPDATE shopping_items SET household_id = ? WHERE household_id IS NULL AND user_id IN (SELECT user_id FROM household_members WHERE household_id = ?)', [householdId, householdId]);

                    req.session.user = { 
                        ...(req.session.user || {}), 
                        user_id: safeUserId, 
                        id: safeUserId, 
                        household_id: householdId, 
                        householdId: householdId,
                        householdName,
                        inviteCode: household.invite_code 
                    };

                    return res.json({ 
                        success: true, 
                        message: `เข้าร่วมกลุ่ม "${householdName}" สำเร็จแล้ว!`, 
                        householdId, 
                        householdName, 
                        inviteCode: household.invite_code,
                        user: req.session.user
                    });
                });
            };

            if (!memberRows.length) {
                db.query('INSERT INTO household_members (household_id, user_id, role) VALUES (?, ?, ?)', [householdId, safeUserId, 'member'], (insertErr) => {
                    if (insertErr) return res.status(500).json({ success: false, error: insertErr.message });
                    finishJoin();
                });
            } else {
                finishJoin();
            }
        });
    });
});

// ✅ ออกจากกลุ่มครอบครัว
app.post('/api/household/leave', (req, res) => {
    const sessionUser = getAuthenticatedSessionUser(req, res);
    if (!sessionUser) return;

    const safeUserId = Number(sessionUser.user_id ?? sessionUser.id ?? 0);
    if (!safeUserId) {
        return res.status(400).json({ success: false, message: 'ไม่พบผู้ใช้ที่ต้องการออกจากกลุ่ม' });
    }

    db.query('SELECT household_id FROM users WHERE user_id = ? LIMIT 1', [safeUserId], (userErr, userRows) => {
        if (userErr) return res.status(500).json({ success: false, error: userErr.message });
        if (!userRows.length) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });

        const householdId = Number(userRows[0].household_id || 0);
        if (!householdId) {
            return res.json({ success: true, message: 'ผู้ใช้นี้ไม่ได้อยู่ในกลุ่มใด ๆ' });
        }

        db.query('DELETE FROM household_members WHERE household_id = ? AND user_id = ?', [householdId, safeUserId], (deleteErr) => {
            if (deleteErr) return res.status(500).json({ success: false, error: deleteErr.message });
            db.query('UPDATE users SET household_id = NULL WHERE user_id = ?', [safeUserId], (updateErr) => {
                if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });
                req.session.user = { ...(req.session.user || {}), user_id: safeUserId, id: safeUserId, household_id: null, householdId: null, householdName: null };
                res.json({ 
                    success: true, 
                    message: 'ออกจากกลุ่มครอบครัวแล้ว',
                    user: req.session.user 
                });
            });
        });
    });
});

// ✅ 🌟 [API ดึงข้อมูลตู้เย็น: แชร์ของร่วมกันทุกคนในบ้าน พร้อมชื่อผู้เพิ่ม]
app.get('/api/fridge', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    if (!ownerId) {
        return res.status(401).json({ success: false, message: 'ข้อมูลผู้ใช้ไม่ถูกต้อง' });
    }

    const householdId = getEffectiveHouseholdId(sessionUser);

    let query = '';
    let params = [];

    if (householdId) {
        // ดึงของใน household หรือของสมาชิกทุกคนในบ้าน รวมทั้งของที่ตัวเองเพิ่ม
        query = `
            SELECT fi.*, u.username as added_by_name 
            FROM fridge_items fi
            LEFT JOIN users u ON fi.user_id = u.user_id
            WHERE fi.household_id = ? 
               OR fi.user_id IN (SELECT user_id FROM household_members WHERE household_id = ?)
               OR fi.user_id IN (SELECT user_id FROM users WHERE household_id = ?)
               OR fi.user_id = ?
            ORDER BY fi.item_id DESC
        `;
        params = [householdId, householdId, householdId, ownerId];
    } else {
        query = `
            SELECT fi.*, u.username as added_by_name 
            FROM fridge_items fi 
            LEFT JOIN users u ON fi.user_id = u.user_id 
            WHERE fi.user_id = ? 
            ORDER BY fi.item_id DESC
        `;
        params = [ownerId];
    }

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        
        // ลบรายการซ้ำ
        const uniqueItems = [];
        const seenIds = new Set();
        (results || []).forEach(item => {
            if (!seenIds.has(item.item_id)) {
                seenIds.add(item.item_id);
                uniqueItems.push(item);
            }
        });

        res.json({ 
            success: true, 
            data: uniqueItems, 
            householdId: householdId || null,
            householdName: sessionUser.householdName || null 
        });
    });
});

// ✅ สถิติวัตถุดิบใช้ประจำ
app.get('/api/fridge/frequent', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    const householdId = getEffectiveHouseholdId(sessionUser);
    
    let query = '';
    let params = [];

    if (householdId) {
        query = `
            SELECT item_name as name, COUNT(*) as useCount 
            FROM fridge_items 
            WHERE household_id = ? 
               OR user_id IN (SELECT user_id FROM household_members WHERE household_id = ?)
               OR user_id IN (SELECT user_id FROM users WHERE household_id = ?)
            GROUP BY item_name 
            ORDER BY useCount DESC 
            LIMIT 6
        `;
        params = [householdId, householdId, householdId];
    } else {
        query = 'SELECT item_name as name, COUNT(*) as useCount FROM fridge_items WHERE user_id = ? GROUP BY item_name ORDER BY useCount DESC LIMIT 6';
        params = [ownerId];
    }

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: results });
    });
});

// ✅ เพิ่มวัตถุดิบ (ผูกเข้ากลุ่มตู้เย็นอัตโนมัติ)
app.post('/api/fridge/add', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    if (!ownerId) return res.status(401).json({ success: false, message: 'ข้อมูลผู้ใช้ไม่ถูกต้อง' });

    const { itemName, name, item_name, quantity, qty, amount, category, expiryDate, exp_date, expiry_date, householdId: bodyHouseholdId } = req.body;
    const cleanItemName = (itemName || name || item_name || '').trim();
    if (!cleanItemName) return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อวัตถุดิบ' });

    const rawExpiry = expiryDate || exp_date || expiry_date;
    let safeExpiryDate = null;
    if (rawExpiry && String(rawExpiry).trim()) {
        const rawDate = String(rawExpiry).trim();
        if (rawDate.includes('/')) {
            const parts = rawDate.split('/');
            if (parts.length === 3) {
                if (parts[2].length === 4) {
                    safeExpiryDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                } else {
                    safeExpiryDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                }
            }
        } else {
            safeExpiryDate = rawDate.split('T')[0];
        }
    }

    const cleanQty = quantity || qty || amount || '1';
    const householdId = getEffectiveHouseholdId(sessionUser) || (bodyHouseholdId ? Number(bodyHouseholdId) : null);
    const sql = 'INSERT INTO fridge_items (user_id, household_id, item_name, quantity, category, expiry_date, remaining_percent) VALUES (?, ?, ?, ?, ?, ?, 100)';
    db.query(sql, [ownerId, householdId, cleanItemName, cleanQty, category || 'อื่นๆ', safeExpiryDate], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        createFridgeItemNotifications(ownerId, householdId, cleanItemName);
        res.json({ 
            success: true, 
            message: 'บันทึกข้อมูลสำเร็จ', 
            itemId: result ? result.insertId : null,
            id: result ? result.insertId : null,
            householdId 
        });
    });
});

app.put('/api/fridge/update/:id', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    const householdId = getEffectiveHouseholdId(sessionUser);
    const { id } = req.params;
    const { remaining_percent } = req.body;

    const updateQuery = householdId
        ? 'UPDATE fridge_items SET remaining_percent = ? WHERE item_id = ? AND (household_id = ? OR user_id = ?)'
        : 'UPDATE fridge_items SET remaining_percent = ? WHERE item_id = ? AND user_id = ?';
    const updateParams = householdId ? [remaining_percent, id, householdId, ownerId] : [remaining_percent, id, ownerId];

    db.query(updateQuery, updateParams, (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: 'อัปเดตสำเร็จ' });
    });
});

app.put('/api/fridge/deduct/:id', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    const householdId = getEffectiveHouseholdId(sessionUser);
    const { id } = req.params;
    const { deductPercent = 40 } = req.body;

    const lookupQuery = householdId
        ? 'SELECT item_id, remaining_percent FROM fridge_items WHERE item_id = ? AND (household_id = ? OR user_id = ?) LIMIT 1'
        : 'SELECT item_id, remaining_percent FROM fridge_items WHERE item_id = ? AND user_id = ? LIMIT 1';
    const lookupParams = householdId ? [id, householdId, ownerId] : [id, ownerId];

    db.query(lookupQuery, lookupParams, (lookupErr, rows) => {
        if (lookupErr) return res.status(500).json({ success: false, error: lookupErr.message });
        if (!rows.length) return res.status(404).json({ success: false, message: 'ไม่พบวัตถุดิบนี้' });

        const currentPercent = rows[0].remaining_percent ?? 100;
        const newPercent = Math.max(0, currentPercent - Number(deductPercent));

        if (newPercent <= 0) {
            const deleteQuery = householdId
                ? 'DELETE FROM fridge_items WHERE item_id = ? AND (household_id = ? OR user_id = ?)'
                : 'DELETE FROM fridge_items WHERE item_id = ? AND user_id = ?';
            db.query(deleteQuery, lookupParams, (delErr) => {
                if (delErr) return res.status(500).json({ success: false, error: delErr.message });
                res.json({ success: true, message: 'วัตถุดิบหมดเกลี้ยงแล้ว', removed: true });
            });
        } else {
            const updateQuery = householdId
                ? 'UPDATE fridge_items SET remaining_percent = ? WHERE item_id = ? AND (household_id = ? OR user_id = ?)'
                : 'UPDATE fridge_items SET remaining_percent = ? WHERE item_id = ? AND user_id = ?';
            const updateParams = householdId
                ? [newPercent, id, householdId, ownerId]
                : [newPercent, id, ownerId];
            db.query(updateQuery, updateParams, (upErr) => {
                if (upErr) return res.status(500).json({ success: false, error: upErr.message });
                res.json({ success: true, message: `ตัดสต็อกสำเร็จ เหลือ ${newPercent}%`, remaining_percent: newPercent, removed: false });
            });
        }
    });
});

app.delete('/api/fridge/clear', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    const householdId = getEffectiveHouseholdId(sessionUser);

    const deleteQuery = householdId
        ? 'DELETE FROM fridge_items WHERE (household_id = ? OR user_id = ?)'
        : 'DELETE FROM fridge_items WHERE user_id = ?';
    const deleteParams = householdId ? [householdId, ownerId] : [ownerId];

    db.query(deleteQuery, deleteParams, (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: 'ล้างข้อมูลตู้เย็นทั้งหมดสำเร็จ', affectedRows: result.affectedRows });
    });
});

app.delete('/api/fridge/delete/:id', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    const householdId = getEffectiveHouseholdId(sessionUser);
    const { id } = req.params;

    const deleteQuery = householdId
        ? 'DELETE FROM fridge_items WHERE item_id = ? AND (household_id = ? OR user_id = ?)'
        : 'DELETE FROM fridge_items WHERE item_id = ? AND user_id = ?';
    const deleteParams = householdId ? [id, householdId, ownerId] : [id, ownerId];

    db.query(deleteQuery, deleteParams, (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'ไม่พบรายการที่สามารถลบได้' });
        res.json({ success: true, message: 'ลบสำเร็จ' });
    });
});

// ✅ รายการช้อปปิ้ง
app.get('/api/shopping', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    const householdId = getEffectiveHouseholdId(sessionUser) || Number(req.query.householdId || ownerId);
    
    let query = '';
    let params = [];

    if (householdId) {
        query = `
            SELECT * FROM shopping_items 
            WHERE household_id = ? 
               OR user_id IN (SELECT user_id FROM household_members WHERE household_id = ?)
            ORDER BY shop_id DESC
        `;
        params = [householdId, householdId];
    } else {
        query = 'SELECT * FROM shopping_items WHERE user_id = ? ORDER BY shop_id DESC';
        params = [ownerId];
    }

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: results });
    });
});

app.post('/api/shopping/add', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    const { item_name, name, quantity, qty, reason } = req.body;
    const finalName = (item_name || name || '').trim();
    const finalQty = quantity || qty || '1 ชิ้น';
    const householdId = getEffectiveHouseholdId(sessionUser) || ownerId;

    if (!finalName) return res.status(400).json({ success: false, message: 'กรุณาส่งชื่อสินค้า' });

    const sql = 'INSERT INTO shopping_items (user_id, household_id, item_name, quantity, reason, is_checked) VALUES (?, ?, ?, ?, ?, 0)';
    db.query(sql, [ownerId, householdId, finalName, finalQty, reason || 'manual'], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ 
            success: true, 
            message: 'เพิ่มรายการสำเร็จ', 
            shopId: result ? result.insertId : null,
            id: result ? result.insertId : null 
        });
    });
});

app.post('/api/shopping/toggle', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    const householdId = getEffectiveHouseholdId(sessionUser);
    const targetShopId = req.body.shopId || req.body.id;
    const targetChecked = typeof req.body.isChecked !== 'undefined' 
        ? req.body.isChecked 
        : (typeof req.body.completed !== 'undefined' ? req.body.completed : 1);

    const updateQuery = householdId
        ? 'UPDATE shopping_items SET is_checked = ? WHERE shop_id = ? AND (household_id = ? OR user_id = ?)'
        : 'UPDATE shopping_items SET is_checked = ? WHERE shop_id = ? AND user_id = ?';
    const updateParams = householdId ? [targetChecked ? 1 : 0, targetShopId, householdId, ownerId] : [targetChecked ? 1 : 0, targetShopId, ownerId];

    db.query(updateQuery, updateParams, (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/shopping/delete', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    const householdId = getEffectiveHouseholdId(sessionUser);
    const targetShopId = req.body.shopId || req.body.id;

    const deleteQuery = householdId
        ? 'DELETE FROM shopping_items WHERE shop_id = ? AND (household_id = ? OR user_id = ?)'
        : 'DELETE FROM shopping_items WHERE shop_id = ? AND user_id = ?';
    const deleteParams = householdId ? [targetShopId, householdId, ownerId] : [targetShopId, ownerId];

    db.query(deleteQuery, deleteParams, (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

// ✅ 🌟 [API ดึงรายการแจ้งเตือน: ดึงทั้งส่วนตัวและแจ้งเตือนของบ้าน]
app.get('/api/notifications', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    const householdId = getEffectiveHouseholdId(sessionUser);

    const query = householdId
        ? `SELECT DISTINCT n.* 
           FROM notifications n 
           WHERE n.user_id = ? OR (n.household_id = ? AND n.household_id IS NOT NULL) 
           ORDER BY n.created_at DESC LIMIT 30`
        : `SELECT DISTINCT n.* 
           FROM notifications n 
           WHERE n.user_id = ? 
           ORDER BY n.created_at DESC LIMIT 30`;
    const params = householdId ? [ownerId, householdId] : [ownerId];

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        
        const uniqueNotes = [];
        const seenIds = new Set();
        (results || []).forEach(n => {
            if (!seenIds.has(n.id)) {
                seenIds.add(n.id);
                uniqueNotes.push(n);
            }
        });

        const unreadCount = uniqueNotes.filter(n => !n.is_read).length;
        res.json({ success: true, data: uniqueNotes, unreadCount });
    });
});

app.post('/api/notifications/read', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    const householdId = getEffectiveHouseholdId(sessionUser);

    const readSql = householdId
        ? 'UPDATE notifications SET is_read = 1 WHERE user_id = ? OR (household_id = ? AND user_id = ?)'
        : 'UPDATE notifications SET is_read = 1 WHERE user_id = ?';
    const params = householdId ? [ownerId, householdId, ownerId] : [ownerId];

    db.query(readSql, params, (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: 'อ่านแจ้งเตือนแล้ว' });
    });
});

// ✅ 📷 [API วิเคราะห์รูปภาพวัตถุดิบอาหารด้วย AI Vision (Google Gemini)]
app.post('/api/vision/analyze', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ success: false, message: 'กรุณาส่งข้อมูลรูปภาพเพื่อทำการวิเคราะห์' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, message: 'ระบบ AI Vision ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน .env' });
        }

        let mimeType = 'image/jpeg';
        let base64 = image;
        if (image.includes(',')) {
            const parts = image.split(',');
            const match = parts[0].match(/:(.*?);/);
            if (match) mimeType = match[1];
            base64 = parts[1];
        }

        const models = [
            process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
            'gemini-3.1-flash-lite',
            'gemini-3.5-flash'
        ];

        let parsedItems = null;
        let lastError = null;

        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const geminiRes = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { 
                                    text: 'คุณคือระบบ AI ผู้เชี่ยวชาญด้านอาหารของ FoodCare มีหน้าที่วิเคราะห์รูปภาพนี้เพื่อตรวจจับและระบุ "วัตถุดิบอาหาร" (Food Ingredients) ทั้งหมดที่เห็นในภาพ\nให้ตอบกลับเป็น JSON Format เท่านั้น โดยมีโครงสร้างดังนี้:\n{\n  "items": [\n    {\n      "name": "ชื่อวัตถุดิบภาษาไทยที่ตรวจพบ เช่น มะเขือเทศ, อกไก่, นมสด, ไข่ไก่, ผักกาด",\n      "category": "หมวดหมู่ (ผัก, ผลไม้, เนื้อสัตว์, เครื่องดื่ม, หรือ อื่นๆ)",\n      "emoji": "emoji ที่เข้ากันได้ดีที่สุด เช่น 🍅, 🍗, 🥛, 🥚, 🥬",\n      "confidence": 95\n    }\n  ]\n}\nหากพบวัตถุดิบหลายชนิด ให้ใส่รายการทั้งหมดใน array items โดยเรียงจากสิ่งที่เด่นชัดที่สุด' 
                                },
                                { inlineData: { mimeType, data: base64 } }
                            ]
                        }],
                        generationConfig: {
                            responseMimeType: 'application/json'
                        }
                    })
                });

                const data = await geminiRes.json();
                if (!geminiRes.ok) {
                    throw new Error(data.error?.message || `HTTP ${geminiRes.status}`);
                }

                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    const parsed = JSON.parse(text);
                    if (Array.isArray(parsed.items) && parsed.items.length > 0) {
                        parsedItems = parsed.items;
                        break;
                    }
                }
            } catch (modelErr) {
                console.warn(`[AI VISION] Model ${model} failed:`, modelErr.message);
                lastError = modelErr;
            }
        }

        if (parsedItems && parsedItems.length > 0) {
            return res.json({
                success: true,
                items: parsedItems
            });
        }

        // หาก AI ไม่พบรายการใดๆ หรือเกิดข้อผิดพลาด ให้ส่ง JSON ตอบกลับอย่างปลอดภัย
        return res.json({
            success: false,
            message: lastError ? `ไม่สามารถวิเคราะห์ภาพได้: ${lastError.message}` : 'ไม่พบวัตถุดิบอาหารที่ระบุได้ชัดเจนในภาพนี้',
            items: []
        });

    } catch (err) {
        console.error('[AI VISION ERROR]:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ',
            items: []
        });
    }
});

// 🍲 ฟังก์ชันเมนูสำรองกรณี AI ขัดข้องหรือไม่มีอินเทอร์เน็ต
const getFallbackRecipes = (cleanIngredients = []) => {
    const mainIng = cleanIngredients[0] || 'ไข่ไก่';
    const secondIng = cleanIngredients[1] || 'ผักสด';
    return [
        {
            id: `fb-${Date.now()}-1`,
            title: `ผัด${mainIng}ใส่${secondIng}`,
            time: '15 นาที',
            level: 'ง่าย',
            tone: 'from-amber-400 to-orange-500',
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80',
            description: `เมนูผัดหอมกลิ่นกระทะ ปรุงรสกลมกล่อมด้วย ${mainIng} ที่มีในตู้เย็นของคุณ`,
            requiredIngredients: [
                { name: mainIng, category: 'เนื้อสัตว์' },
                { name: secondIng, category: 'ผัก' }
            ],
            ingredients: [
                { name: mainIng, qty: '200 กรัม', have: true },
                { name: secondIng, qty: '1 ถ้วย', have: true }
            ],
            seasonings: [
                { name: 'น้ำมันพืชสำหรับผัด', qty: '2 ช้อนโต๊ะ' },
                { name: 'ซอสหอยนางรม', qty: '1 ช้อนโต๊ะ' },
                { name: 'ซีอิ๊วขาว', qty: '1 ช้อนโต๊ะ' },
                { name: 'น้ำตาลทราย', qty: '1/2 ช้อนชา' },
                { name: 'พริกไทยป่น', qty: 'เล็กน้อย' }
            ],
            steps: [
                `หั่นและเตรียม ${mainIng} และ ${secondIng} ให้เรียบร้อย`,
                'ตั้งกระทะใส่น้ำมันพืชให้ร้อน ผัดกระเทียมสับจนส่งกลิ่นหอม',
                `ใส่ ${mainIng} ลงไปผัดจนสุก ตามด้วย ${secondIng}`,
                'ปรุงรสด้วยซอสหอยนางรม ซีอิ๊วขาว น้ำตาลทราย และพริกไทยป่น ผัดคลุกเคล้าให้เข้ากัน',
                'ตักเสิร์ฟพร้อมข้าวสวยร้อนๆ'
            ]
        },
        {
            id: `fb-${Date.now()}-2`,
            title: `ต้มจืด${mainIng}ซดคล่องคอ`,
            time: '20 นาที',
            level: 'ง่ายมาก',
            tone: 'from-emerald-400 to-teal-500',
            image: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=700&q=80',
            description: `ซุปต้มจืดอุ่นๆ หอมกรุ่น ใช้วัตถุดิบ ${mainIng} ให้เกิดประโยชน์สูงสุด`,
            requiredIngredients: [
                { name: mainIng, category: 'เนื้อสัตว์' }
            ],
            ingredients: [
                { name: mainIng, qty: '150 กรัม', have: true }
            ],
            seasonings: [
                { name: 'ซีอิ๊วขาว', qty: '1.5 ช้อนโต๊ะ' },
                { name: 'เกลือป่น', qty: '1/2 ช้อนชา' },
                { name: 'ผงปรุงรสซุป', qty: '1 ช้อนชา' },
                { name: 'พริกไทยป่น', qty: '1/4 ช้อนชา' }
            ],
            steps: [
                'ต้มน้ำสะอาดในหม้อจนเดือด',
                `ใส่ ${mainIng} ลงไปต้มด้วยไฟปานกลางจนสุกนุ่ม`,
                'ปรุงรสด้วยซีอิ๊วขาว เกลือป่น และผงปรุงรสตามชอบ',
                'โรยพริกไทยป่นและต้นหอมผักชีก่อนปิดเตา พร้อมรับประทาน'
            ]
        }
    ];
};

// ✅ 🍳 [API แนะนำเมนูอาหารสร้างสรรค์ด้วย AI Chef (Google Gemini)]
app.post('/api/recipes/suggest', async (req, res) => {
    try {
        const { ingredients = [] } = req.body;
        if (!Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({ success: false, message: 'กรุณาส่งรายชื่อวัตถุดิบอาหารที่ต้องการให้แนะนำเมนู' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        const cleanIngredients = ingredients.map(i => String(i).trim()).filter(Boolean);

        if (!apiKey) {
            return res.json({
                success: true,
                recipes: getFallbackRecipes(cleanIngredients)
            });
        }

        const models = [
            process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
            'gemini-3.1-flash-lite',
            'gemini-3.5-flash'
        ];

        let generatedRecipes = null;
        let lastError = null;

        const prompt = `คุณคือ AI เชฟมืออาชีพและผู้เชี่ยวชาญด้านอาหารตัวจริงของแอป FoodCare 
หน้าที่ของคุณคือคิดสูตรเมนูอาหารไทยหรืออาหารสากลที่ทำได้จริง 2-3 เมนู โดยอิงจากวัตถุดิบหลักที่มีในตู้เย็นของผู้ใช้: ${cleanIngredients.join(', ')}

เกณฑ์สำคัญมากสำหรับวัตถุดิบและเครื่องปรุง (ต้องถูกต้องและครบถ้วนตามหลักการทำอาหารจริง 100%):
1. วัตถุดิบ (ingredients): ต้องระบุวัตถุดิบหลักและส่วนประกอบที่ใช้จริง เช่น เนื้อหมู, ไข่ไก่, ผักกาด, กระเทียม, พริก พร้อมระบุปริมาณที่สมจริง (เช่น 2 ฟอง, 200 กรัม, 3 กลีบ)
2. เครื่องปรุงรส (seasonings): ต้องใส่เครื่องปรุงที่จำเป็นสำหรับการทำอาหารเมนูนั้นให้ครบถ้วนเสมอ เช่น:
   - เมนูผัดหรือทอด: ต้องมี "น้ำมันพืชสำหรับผัด" หรือ "น้ำมันพืชสำหรับทอด" เสมอ พร้อมซอสปรุงรสที่สมจริง เช่น ซอสหอยนางรม, ซีอิ๊วขาว, น้ำปลา, น้ำตาลทราย, พริกไทยป่น
   - เมนูต้มหรือซุป: ต้องมี ซีอิ๊วขาว, น้ำปลา, เกลือป่น, พริกไทยป่น หรือ ผงปรุงรส
   - ระบุชื่อเครื่องปรุงให้ชัดเจน ไม่เขียนแค่ "ซอส" สั้นๆ
   - ระบุปริมาณช้อนชา / ช้อนโต๊ะ อย่างสมเหตุสมผล

ตอบกลับเป็น JSON Format เดียวเท่านั้น โครงสร้าง:
{
  "recipes": [
    {
      "id": "ai-1",
      "title": "ชื่อเมนูภาษาไทยที่น่ากิน",
      "time": "15 นาที",
      "level": "ง่าย",
      "tone": "from-amber-400 to-orange-500",
      "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80",
      "description": "คำอธิบายเมนูสั้นๆ 1 ประโยคชวนน่าทาน",
      "requiredIngredients": [
        { "name": "ชื่อวัตถุดิบหลัก", "category": "ผัก / เนื้อสัตว์ / ไข่ / อื่นๆ" }
      ],
      "ingredients": [
        { "name": "ชื่อวัตถุดิบ", "qty": "ปริมาณ เช่น 200 กรัม", "have": true }
      ],
      "seasonings": [
        { "name": "ชื่อเครื่องปรุง เช่น ซอสหอยนางรม, น้ำมันพืชสำหรับผัด, น้ำปลาแท้", "qty": "1 ช้อนโต๊ะ" }
      ],
      "steps": [
        "ขั้นตอนที่ 1...",
        "ขั้นตอนที่ 2..."
      ]
    }
  ]
}`;

        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const geminiRes = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            responseMimeType: 'application/json'
                        }
                    })
                });

                const data = await geminiRes.json();
                if (!geminiRes.ok) {
                    throw new Error(data.error?.message || `HTTP ${geminiRes.status}`);
                }

                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    const parsed = JSON.parse(text);
                    if (Array.isArray(parsed.recipes) && parsed.recipes.length > 0) {
                        generatedRecipes = parsed.recipes.map((r, idx) => ({
                            id: `ai-${Date.now()}-${idx + 1}`,
                            title: r.title || `เมนูจาก ${cleanIngredients[0]}`,
                            time: r.time || '20 นาที',
                            level: r.level || 'ง่าย',
                            tone: r.tone || 'from-indigo-500 to-blue-600',
                            image: r.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80',
                            description: r.description || 'เมนูแนะนำจาก AI เชฟประจำตู้เย็นของคุณ',
                            requiredIngredients: Array.isArray(r.requiredIngredients) ? r.requiredIngredients : [],
                            ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
                            seasonings: Array.isArray(r.seasonings) ? r.seasonings : [],
                            steps: Array.isArray(r.steps) ? r.steps : ['เตรียมวัตถุดิบและปรุงรสตามชอบ']
                        }));
                        break;
                    }
                }
            } catch (err) {
                console.warn(`[AI CHEF] Model ${model} failed:`, err.message);
                lastError = err;
            }
        }

        if (generatedRecipes && generatedRecipes.length > 0) {
            return res.json({
                success: true,
                recipes: generatedRecipes
            });
        }

        // Fallback if AI call failed
        console.warn('[AI CHEF] Falling back to template recipes:', lastError?.message);
        return res.json({
            success: true,
            recipes: getFallbackRecipes(cleanIngredients),
            notice: 'แสดงเมนูจากฐานข้อมูลเนื่องจากระบบ AI มีผู้ใช้งานหนาแน่นชั่วคราว'
        });

    } catch (err) {
        console.error('[AI CHEF ERROR]:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'เกิดข้อผิดพลาดในการประมวลผลเมนูอาหาร'
        });
    }
});

app.listen(8080, () => console.log("🚀 Server is running on port 8080"));