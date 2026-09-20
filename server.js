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
    allowedHeaders: ['Content-Type', 'Authorization']
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

const clearSharedLegacyData = () => new Promise((resolve) => {
    db.query('DELETE FROM fridge_items WHERE user_id IS NULL', (fridgeErr) => {
        if (fridgeErr) console.error('Legacy fridge cleanup warning:', fridgeErr.message);
        db.query('DELETE FROM shopping_items WHERE user_id IS NULL', (shoppingErr) => {
            if (shoppingErr) console.error('Legacy shopping cleanup warning:', shoppingErr.message);
            resolve();
        });
    });
});

const normalizeProductLabel = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).replace(/\s+/g, ' ').trim();
};

const getAuthenticatedUser = (req, res) => {
    if (!req.session || !req.session.user) {
        res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนใช้งานข้อมูลส่วนตัว' });
        return null;
    }

    return req.session.user;
};

const stripDataUrlPrefix = (imageValue) => {
    if (!imageValue) return '';
    const content = String(imageValue).trim();
    if (!content) return '';
    const commaIndex = content.indexOf(',');
    if (commaIndex >= 0) return content.slice(commaIndex + 1).trim();
    return content;
};

const detectImageMimeType = (imageValue) => {
    if (!imageValue) return 'image/jpeg';
    const content = String(imageValue).trim();
    if (/^data:/i.test(content)) {
        const match = content.match(/^data:([^;,]+)/i);
        if (match && match[1]) return match[1].toLowerCase();
    }
    return 'image/jpeg';
};

const parseVisionLabels = (payload) => {
    const candidateNames = [];

    if (!payload || typeof payload !== 'object') return candidateNames;

    const append = (value) => {
        const normalized = normalizeProductLabel(value);
        if (normalized && !candidateNames.includes(normalized)) candidateNames.push(normalized);
    };

    if (Array.isArray(payload.tags)) {
        payload.tags.forEach((tag) => append(tag?.name || tag?.label));
    }

    if (Array.isArray(payload.objects)) {
        payload.objects.forEach((obj) => append(obj?.object || obj?.name));
    }

    if (Array.isArray(payload.description?.tags)) {
        payload.description.tags.forEach((tag) => append(tag));
    }

    if (Array.isArray(payload.description?.captions)) {
        payload.description.captions.forEach((caption) => append(caption?.text));
    }

    if (payload.name) append(payload.name);
    if (payload.label) append(payload.label);

    if (!candidateNames.length && Array.isArray(payload.items)) {
        payload.items.forEach((item) => append(item?.name || item?.label || item?.title));
    }

    return candidateNames;
};

async function analyzeImageWithAzure(imageDataUrl) {
    const endpoint = process.env.AZURE_VISION_ENDPOINT;
    const key = process.env.AZURE_VISION_KEY;
    if (!endpoint || !key) return null;

    const url = `${endpoint.replace(/\/$/, '')}/computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=tags,description,objects`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': key,
            'Content-Type': 'application/octet-stream'
        },
        body: Buffer.from(stripDataUrlPrefix(imageDataUrl), 'base64')
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Azure Vision failed: ${response.status} ${text}`);
    }

    const payload = await response.json();
    const names = parseVisionLabels(payload);
    return {
        success: names.length > 0,
        provider: 'azure-vision',
        items: names.slice(0, 3).map((name, index) => ({
            name,
            category: index === 0 ? 'อื่นๆ' : 'อื่นๆ',
            confidence: 84 - index * 8,
            emoji: '🧺'
        }))
    };
}

async function analyzeImageWithGemini(imageDataUrl) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const data = stripDataUrlPrefix(imageDataUrl).trim();
    const mimeType = detectImageMimeType(imageDataUrl);

    if (!data || data.length < 64 || data.length > 12_000_000) {
        throw new Error('Gemini image payload was missing or too large to process');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: 'Identify the main food item in this image. Return JSON only in the exact format: {"items":["name1","name2"]}. Use only the main food item visible in the image, maximum 3 entries, in Thai or English.'
                        },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: 'application/json'
            }
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gemini Vision failed: ${response.status} ${text}`);
    }

    const payload = await response.json();
    const rawText = payload?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text || '')
        .join('') || '';
    const cleanedText = String(rawText).replace(/```json|```/g, '').trim();

    let parsed = null;
    try {
        parsed = JSON.parse(cleanedText);
    } catch (error) {
        const fallbackMatch = cleanedText.match(/\[\s*"([^"]+)"/);
        if (fallbackMatch && fallbackMatch[1]) {
            parsed = { items: [fallbackMatch[1]] };
        }
    }

    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    const names = items
        .map((item) => normalizeProductLabel(item))
        .filter(Boolean)
        .slice(0, 3);

    if (!names.length) {
        throw new Error('Gemini did not return usable food names');
    }

    return {
        success: true,
        provider: 'gemini-vision',
        items: names.map((name, index) => ({
            name,
            category: 'อื่นๆ',
            confidence: 90 - index * 6,
            emoji: '🧺'
        }))
    };
}

async function analyzeImageWithOpenAI(imageDataUrl) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
            temperature: 0.2,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Analyze this food image. Return JSON only with a single key "items" whose value is an array of product names in Thai or English. Use only the main food item visible in the image, maximum 3 entries.'
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageDataUrl
                            }
                        }
                    ]
                }
            ]
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`OpenAI Vision failed: ${response.status} ${text}`);
    }

    const payload = await response.json();
    const rawText = payload?.choices?.[0]?.message?.content || '';
    const parsed = (() => {
        try {
            return JSON.parse(rawText);
        } catch (error) {
            return null;
        }
    })();

    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    const names = items
        .map((item) => normalizeProductLabel(item?.name || item?.label || item?.title || item))
        .filter(Boolean)
        .slice(0, 3);

    if (!names.length) {
        throw new Error('OpenAI did not return usable food names');
    }

    return {
        success: true,
        provider: 'openai-vision',
        items: names.map((name, index) => ({
            name,
            category: 'อื่นๆ',
            confidence: 86 - index * 8,
            emoji: '🧺'
        }))
    };
}

async function analyzeImageWithConfiguredProvider(imageDataUrl) {
    const providers = [analyzeImageWithOpenAI, analyzeImageWithAzure, analyzeImageWithGemini];

    for (const provider of providers) {
        try {
            const result = await provider(imageDataUrl);
            if (result && result.success) return result;
        } catch (error) {
            console.warn('Vision provider failed:', error.message);
        }
    }

    return {
        success: false,
        provider: 'manual',
        items: [
            { name: '', category: 'อื่นๆ', confidence: 0, emoji: '🧺' }
        ],
        message: 'ยังไม่ได้ตั้งค่า AI Vision API ในสภาพแวดล้อมนี้ กรุณากรอกชื่อวัตถุดิบเองจากภาพที่ถ่าย'
    };
}

app.post('/api/vision/analyze', async (req, res) => {
    const imageDataUrl = req.body?.image;
    if (!imageDataUrl) {
        return res.status(400).json({ success: false, message: 'ไม่พบข้อมูลภาพที่ถ่ายจากกล้อง' });
    }

    try {
        const result = await analyzeImageWithConfiguredProvider(imageDataUrl);
        if (!result?.success) {
            return res.json({
                success: false,
                message: result?.message || 'ไม่สามารถระบุชื่อวัตถุดิบจากภาพได้ กรุณากรอกด้วยตนเอง',
                items: [{ name: '', category: 'อื่นๆ', confidence: 0, emoji: '🧺' }],
                provider: result?.provider || 'manual'
            });
        }

        return res.json({
            success: true,
            provider: result.provider,
            items: result.items,
            message: 'ตรวจจับวัตถุดิบจากภาพสำเร็จ'
        });
    } catch (error) {
        console.error('Vision analyze error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'ระบบ AI Vision ล้มเหลว กรุณากรอกชื่อวัตถุดิบด้วยตนเอง',
            provider: 'manual',
            items: [{ name: '', category: 'อื่นๆ', confidence: 0, emoji: '🧺' }]
        });
    }
});

const getAuthenticatedSessionUser = (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return null;

    const userId = Number(sessionUser.user_id ?? sessionUser.id ?? sessionUser.userId ?? 0);
    return Number.isFinite(userId) && userId > 0 ? { ...sessionUser, user_id: userId, id: userId } : null;
};

const getOwnerId = (user) => {
    if (!user) return null;
    const id = Number(user.user_id ?? user.id ?? user.userId ?? user.household_id ?? 0);
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
            ? `มีวัตถุดิบใหม่ "${itemLabel}" ถูกเพิ่มเข้าตู้เย็นครอบครัวแล้ว`
            : `มีวัตถุดิบใหม่ "${itemLabel}" ถูกเพิ่มเข้าตู้เย็นของคุณแล้ว`;
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
                targetIds.forEach((targetUserId) => notifyUser(targetUserId));
                notifyUser(userId);
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
    .then(() => clearSharedLegacyData())
    .then(() => {
        console.log('User schema ready');
        console.log('Household schema ready');
        console.log('Ownership columns ready');
        console.log('Notification schema ready');
        console.log('Legacy anonymous records cleared');
    })
    .catch((err) => {
        console.error('User schema setup failed:', err.message);
    });

// ✅ Login (single canonical login flow)
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
        const errorMessage = 'SMTP ยังไม่ได้ถูกตั้งค่าในไฟล์ .env กรุณาเพิ่ม SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS และ EMAIL_FROM ก่อนส่ง OTP จริง';
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

async function sendOtpEmail(email, otp) {
    const from = process.env.EMAIL_FROM || 'FoodCare <noreply@foodcare.local>';
    const message = {
        from,
        to: email,
        subject: 'FoodCare OTP Verification',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2>FoodCare OTP Verification</h2>
                <p>รหัส OTP สำหรับยืนยันตัวตนของคุณคือ:</p>
                <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #4f46e5;">${otp}</p>
                <p>รหัสนี้มีอายุ 5 นาที</p>
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
                    message: "ส่งรหัส OTP ไปยังอีเมลที่คุณกรอกแล้ว กรุณาตรวจสอบอีเมลและยืนยันในหน้านี้"
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

app.post('/api/household/create', (req, res) => {
    const sessionUser = getAuthenticatedSessionUser(req, res);
    if (!sessionUser) return;

    const { householdName } = req.body;
    const trimmedName = (householdName || '').trim();
    const safeUserId = Number(sessionUser.user_id ?? sessionUser.id ?? 0);

    if (!safeUserId || !trimmedName) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อกลุ่มครอบครัวให้ครบ' });
    }

    const inviteCode = `FOOD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    db.query('SELECT user_id, household_id FROM users WHERE user_id = ?', [safeUserId], (userErr, userRows) => {
        if (userErr) return res.status(500).json({ success: false, error: userErr.message });
        if (!userRows.length) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานที่ระบุ' });

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

                    req.session.user = {
                        ...(req.session.user || {}),
                        user_id: safeUserId,
                        id: safeUserId,
                        household_id: householdId,
                        householdId: householdId
                    };

                    res.json({ success: true, message: 'สร้างกลุ่มครอบครัวสำเร็จ', householdId, inviteCode });
                });
            });
        });
    });
});

app.post('/api/household/join', (req, res) => {
    const sessionUser = getAuthenticatedSessionUser(req, res);
    if (!sessionUser) return;

    const safeUserId = Number(sessionUser.user_id ?? sessionUser.id ?? 0);
    const { inviteCode } = req.body;
    const trimmedCode = (inviteCode || '').trim().toUpperCase();

    if (!safeUserId || !trimmedCode) {
        return res.status(400).json({ success: false, message: 'กรุณาให้รหัสเชิญให้ครบ' });
    }

    db.query('SELECT * FROM households WHERE invite_code = ? LIMIT 1', [trimmedCode], (houseErr, householdRows) => {
        if (houseErr) return res.status(500).json({ success: false, error: houseErr.message });
        if (!householdRows.length) return res.status(404).json({ success: false, message: 'รหัสเชิญไม่ถูกต้องหรือหมดอายุ' });

        const household = householdRows[0];
        const householdId = Number(household.id ?? household.household_id ?? 0);

        db.query('SELECT * FROM household_members WHERE household_id = ? AND user_id = ?', [householdId, safeUserId], (memberErr, memberRows) => {
            if (memberErr) return res.status(500).json({ success: false, error: memberErr.message });
            if (!memberRows.length) {
                db.query('INSERT INTO household_members (household_id, user_id, role) VALUES (?, ?, ?)', [householdId, safeUserId, 'member'], (insertErr) => {
                    if (insertErr) return res.status(500).json({ success: false, error: insertErr.message });
                    db.query('UPDATE users SET household_id = ? WHERE user_id = ?', [householdId, safeUserId], (updateErr) => {
                        if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });
                        req.session.user = { ...(req.session.user || {}), user_id: safeUserId, id: safeUserId, household_id: householdId, householdId: householdId };
                        return res.json({ success: true, message: 'เข้าร่วมกลุ่มครอบครัวสำเร็จ', householdId, inviteCode: household.invite_code });
                    });
                });
                return;
            }

            db.query('UPDATE users SET household_id = ? WHERE user_id = ?', [householdId, safeUserId], (updateErr) => {
                if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });
                req.session.user = { ...(req.session.user || {}), user_id: safeUserId, id: safeUserId, household_id: householdId, householdId: householdId };
                return res.json({ success: true, message: 'คุณอยู่ในกลุ่มนี้แล้ว', householdId, inviteCode: household.invite_code });
            });
        });
    });
});

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
                req.session.user = { ...(req.session.user || {}), user_id: safeUserId, id: safeUserId, household_id: null, householdId: null };
                res.json({ success: true, message: 'ออกจากกลุ่มครอบครัวแล้ว' });
            });
        });
    });
});

app.post('/api/auth/facebook', (req, res) => {
    const { name, email } = req.body;
    const fbName = (name || 'facebook-user').trim();
    const fbEmail = (email || `${fbName.replace(/\s+/g, '').toLowerCase()}@facebook.local`).toLowerCase();

    const usernameBase = fbName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'facebookuser';
    const username = `${usernameBase}_${Math.random().toString(36).slice(2, 7)}`;

    const findSql = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    db.query(findSql, [fbEmail], async (findErr, results) => {
        if (findErr) return res.status(500).json({ success: false, error: findErr.message });

        if (results.length > 0) {
            const user = results[0];
            const sessionUser = {
                id: user.user_id || user.id,
                user_id: user.user_id || user.id,
                username: user.username,
                email: user.email,
                phone: user.phone || ''
            };
            req.session.user = sessionUser;
            return res.json({ success: true, message:'Login with Facebook successful', user: sessionUser, provider: 'facebook' });
        }

        const passwordHash = await bcrypt.hash('facebook-oauth', 10);
        db.query(
            'INSERT INTO users (username, email, phone, password, is_verified, otp_code, otp_expires_at) VALUES (?, ?, ?, ?, 1, NULL, NULL)',
            [username, fbEmail, '', passwordHash],
            (insertErr, result) => {
                if (insertErr) return res.status(500).json({ success: false, error: insertErr.message });

                const sessionUser = {
                    id: result.insertId,
                    user_id: result.insertId,
                    username,
                    email: fbEmail,
                    phone: ''
                };

                req.session.user = sessionUser;

                res.json({ success: true, message:'Facebook registration successful', user: sessionUser, provider: 'facebook' });
            }
        );
    });
});

// ✅ Request OTP for signup
app.post('/api/send-otp', sendOtpForRegistration);

// ✅ Signup route compatible with frontend request
app.post('/api/signup', sendOtpForRegistration);

// ✅ Verify OTP and complete registration
app.post('/api/verify-otp', (req, res) => {
    const { username, email, otp } = req.body;
    const cleanUsername = (username || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!cleanUsername || !cleanEmail || !cleanOtp) {
        return res.status(400).json({ success: false, message: "กรุณาระบุ username, email และ OTP" });
    }

    if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({ success: false, message: "รูปแบบอีเมลไม่ถูกต้อง กรุณากรอกอีเมลให้ถูกต้อง" });
    }

    const sql = 'SELECT * FROM users WHERE username = ? AND email = ? LIMIT 1';
    db.query(sql, [cleanUsername, cleanEmail], async (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (result.length === 0) return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้งานที่ตรงกับ username และอีเมลที่คุณกรอกสำหรับยืนยัน OTP" });

        const user = result[0];
        if (user.is_verified) {
            const sessionUser = {
                id: user.user_id || user.id,
                user_id: user.user_id || user.id,
                username: user.username,
                email: user.email,
                phone: user.phone || ''
            };
            req.session.user = sessionUser;
            return res.status(200).json({ success: true, message: "บัญชีนี้ยืนยันแล้วแล้ว", user: sessionUser });
        }

        const expiresAt = user.otp_expires_at ? new Date(user.otp_expires_at).getTime() : 0;
        const now = Date.now();

        if (!user.otp_code || expiresAt <= 0 || expiresAt < now) {
            const dbNow = new Date();
            console.log('[OTP_DEBUG]', {
                username: user.username,
                otpCode: user.otp_code,
                expiresAt,
                now,
                dbNow: dbNow.toISOString(),
                stored: user.otp_expires_at
            });
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

                res.json({ success: true, message: "ยืนยัน OTP สำเร็จ สมัครสมาชิกเรียบร้อยแล้ว", user: sessionUser });
            }
        );
    });
});


// ✅ เพิ่มวัตถุดิบแบบผูกกับ user จริงของ session เท่านั้น
app.post('/api/fridge/add', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    if (!ownerId) {
        return res.status(401).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้ที่ปลอดภัยสำหรับการบันทึกข้อมูล' });
    }

    const { itemName, quantity, category, expiryDate } = req.body;
    const cleanItemName = (itemName || '').trim();
    const cleanQuantity = (quantity || '1').toString();
    const cleanCategory = (category || 'other').toString();
    const expiry = expiryDate || null;

    if (!cleanItemName) {
        return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อวัตถุดิบก่อนบันทึก' });
    }

    const householdId = getEffectiveHouseholdId(sessionUser) || null;
    const sql = 'INSERT INTO fridge_items (user_id, household_id, item_name, quantity, category, expiry_date, remaining_percent) VALUES (?, ?, ?, ?, ?, ?, 100)';
    db.query(sql, [ownerId, householdId, cleanItemName, cleanQuantity, cleanCategory, expiry], (err) => {
        if (err) {
            console.error('SQL Error:', err);
            return res.status(500).json({ success: false, error: err.message });
        }

        createFridgeItemNotifications(ownerId, householdId, cleanItemName);
        res.json({ success: true, message: 'บันทึกข้อมูลสำเร็จ', householdId });
    });
});

app.get('/api/notifications', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    if (!ownerId) {
        return res.status(401).json({ success: false, message: 'ข้อมูลผู้ใช้ไม่ถูกต้อง' });
    }

    db.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
        [ownerId],
        (err, results) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, data: results || [] });
        }
    );
});

app.post('/api/notifications/read', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    if (!ownerId) {
        return res.status(401).json({ success: false, message: 'ข้อมูลผู้ใช้ไม่ถูกต้อง' });
    }

    db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [ownerId], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: 'อ่านแจ้งเตือนแล้ว' });
    });
});

// ✅ ดึงข้อมูลตู้เย็นตาม household ที่สมาชิกร่วมกันเห็นได้
app.get('/api/fridge', (req, res) => {
    const sessionUser = getAuthenticatedUser(req, res);
    if (!sessionUser) return;

    const ownerId = getOwnerId(sessionUser);
    if (!ownerId) {
        return res.status(401).json({ success: false, message: 'ข้อมูลผู้ใช้ไม่ถูกต้อง' });
    }

    const householdId = getEffectiveHouseholdId(sessionUser);
    const query = householdId ? 'SELECT * FROM fridge_items WHERE household_id = ? ORDER BY item_id DESC' : 'SELECT * FROM fridge_items WHERE user_id = ? ORDER BY item_id DESC';
    const params = householdId ? [householdId] : [ownerId];

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: results });
    });
});

// ✅ อัปเดต remaining_percent สำหรับรายการภายใต้ household จริงหรือเจ้าของเดิม
app.put('/api/fridge/update/:id', (req, res) => {
  const sessionUser = getAuthenticatedUser(req, res);
  if (!sessionUser) return;

  const ownerId = getOwnerId(sessionUser);
  if (!ownerId) {
    return res.status(401).json({ success: false, message: 'ข้อมูลผู้ใช้ไม่ถูกต้อง' });
  }

  const householdId = getEffectiveHouseholdId(sessionUser);
  const { id } = req.params;
  const { remaining_percent } = req.body;

  const itemLookupQuery = householdId
    ? 'SELECT item_id FROM fridge_items WHERE item_id = ? AND household_id = ? LIMIT 1'
    : 'SELECT item_id FROM fridge_items WHERE item_id = ? AND user_id = ? LIMIT 1';
  const itemLookupParams = householdId ? [id, householdId] : [id, ownerId];

  db.query(itemLookupQuery, itemLookupParams, (lookupErr, lookupRows) => {
    if (lookupErr) return res.status(500).json({ success: false, error: lookupErr.message });
    if (!lookupRows.length) return res.status(404).json({ success: false, message: 'ไม่พบรายการนี้ในครอบครัวหรือเจ้าของของคุณ' });

    const updateQuery = householdId
      ? 'UPDATE fridge_items SET remaining_percent = ? WHERE item_id = ? AND household_id = ?'
      : 'UPDATE fridge_items SET remaining_percent = ? WHERE item_id = ? AND user_id = ?';
    const updateParams = householdId ? [remaining_percent, id, householdId] : [remaining_percent, id, ownerId];

    db.query(updateQuery, updateParams, (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'อัปเดตสำเร็จ' });
    });
  });
});

// ✅ ลบวัตถุดิบสำหรับ household จริงหรือเจ้าของเดิม
app.delete('/api/fridge/delete/:id', (req, res) => {
  const sessionUser = getAuthenticatedUser(req, res);
  if (!sessionUser) return;

  const ownerId = getOwnerId(sessionUser);
  if (!ownerId) {
    return res.status(401).json({ success: false, message: 'ข้อมูลผู้ใช้ไม่ถูกต้อง' });
  }

  const householdId = getEffectiveHouseholdId(sessionUser);
  const { id } = req.params;

  const deleteQuery = householdId
    ? 'DELETE FROM fridge_items WHERE item_id = ? AND household_id = ?'
    : 'DELETE FROM fridge_items WHERE item_id = ? AND user_id = ?';
  const deleteParams = householdId ? [id, householdId] : [id, ownerId];

  db.query(deleteQuery, deleteParams, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'ไม่พบรายการที่สามารถลบได้' });
    res.json({ success: true, message: 'ลบสำเร็จ' });
  });
});

// ✅ ดึงรายการช้อปปิ้งตาม user จริง
app.get('/api/shopping', (req, res) => {
  const sessionUser = getAuthenticatedUser(req, res);
  if (!sessionUser) return;

  const ownerId = getOwnerId(sessionUser);
  if (!ownerId) {
    return res.status(401).json({ success: false, message: 'ข้อมูลผู้ใช้ไม่ถูกต้อง' });
  }

  const householdId = getEffectiveHouseholdId(sessionUser) || Number(req.query.householdId || ownerId);
  const query = householdId ? 'SELECT * FROM shopping_items WHERE household_id = ? ORDER BY shop_id DESC' : 'SELECT * FROM shopping_items WHERE user_id = ? ORDER BY shop_id DESC';
  const params = householdId ? [householdId] : [ownerId];

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
});

// ✅ เพิ่มรายการช้อปปิ้งแบบผูกกับ household ของครอบครัวที่แชร์กัน
app.post('/api/shopping/add', (req, res) => {
  const sessionUser = getAuthenticatedUser(req, res);
  if (!sessionUser) return;

  const ownerId = getOwnerId(sessionUser);
  if (!ownerId) {
    return res.status(401).json({ success: false, message: 'ข้อมูลผู้ใช้ไม่ถูกต้อง' });
  }

  const { item_name, name, quantity, qty, reason } = req.body;
  const finalName = (item_name || name || '').trim();
  const finalQty = quantity || qty || '1 ชิ้น';
  const householdId = getEffectiveHouseholdId(sessionUser) || ownerId;

  if (!finalName) {
    return res.status(400).json({ success: false, message: 'กรุณาส่งชื่อสินค้ามาด้วย' });
  }

  const sql = 'INSERT INTO shopping_items (user_id, household_id, item_name, quantity, reason, is_checked) VALUES (?, ?, ?, ?, ?, 0)';
  db.query(sql, [ownerId, householdId, finalName, finalQty, reason || 'manual'], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'เพิ่มรายการสำเร็จ' });
  });
});

// ✅ toggle เช็ค/ไม่เช็ค สำหรับ household จริงหรือเจ้าของเดิม
app.post('/api/shopping/toggle', (req, res) => {
  const sessionUser = getAuthenticatedUser(req, res);
  if (!sessionUser) return;

  const ownerId = getOwnerId(sessionUser);
  if (!ownerId) {
    return res.status(401).json({ success: false, message: 'ข้อมูลผู้ใช้ไม่ถูกต้อง' });
  }

  const householdId = getEffectiveHouseholdId(sessionUser);
  const { shopId, isChecked } = req.body;
  const checkedValue = isChecked ? 1 : 0;

  const itemLookupQuery = householdId
    ? 'SELECT shop_id FROM shopping_items WHERE shop_id = ? AND household_id = ? LIMIT 1'
    : 'SELECT shop_id FROM shopping_items WHERE shop_id = ? AND user_id = ? LIMIT 1';
  const itemLookupParams = householdId ? [shopId, householdId] : [shopId, ownerId];

  db.query(itemLookupQuery, itemLookupParams, (lookupErr, lookupRows) => {
    if (lookupErr) return res.status(500).json({ success: false, error: lookupErr.message });
    if (!lookupRows.length) return res.status(404).json({ success: false, message: 'ไม่พบรายการนี้ใน household ของคุณ' });

    const updateQuery = householdId
      ? 'UPDATE shopping_items SET is_checked = ? WHERE shop_id = ? AND household_id = ?'
      : 'UPDATE shopping_items SET is_checked = ? WHERE shop_id = ? AND user_id = ?';
    const updateParams = householdId ? [checkedValue, shopId, householdId] : [checkedValue, shopId, ownerId];

    db.query(updateQuery, updateParams, (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true });
    });
  });
});

// ✅ ลบรายการช้อปปิ้งสำหรับ household จริงหรือเจ้าของเดิม
app.post('/api/shopping/delete', (req, res) => {
  const sessionUser = getAuthenticatedUser(req, res);
  if (!sessionUser) return;

  const ownerId = getOwnerId(sessionUser);
  if (!ownerId) {
    return res.status(401).json({ success: false, message: 'ข้อมูลผู้ใช้ไม่ถูกต้อง' });
  }

  const householdId = getEffectiveHouseholdId(sessionUser);
  const { shopId } = req.body;

  const deleteQuery = householdId
    ? 'DELETE FROM shopping_items WHERE shop_id = ? AND household_id = ?'
    : 'DELETE FROM shopping_items WHERE shop_id = ? AND user_id = ?';
  const deleteParams = householdId ? [shopId, householdId] : [shopId, ownerId];

  db.query(deleteQuery, deleteParams, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'ไม่พบรายการที่สามารถลบได้' });
    res.json({ success: true });
  });
});

app.listen(8080, () => console.log("🚀 Server is running on port 8080"));