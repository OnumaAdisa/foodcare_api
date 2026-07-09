const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json());
app.use(cors());

// เชื่อมต่อ DB
const db = mysql.createPool({ 
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'foodcare_db',
    waitForConnections: true,
    connectionLimit: 10
});

db.getConnection((err, conn) => {
    if (err) console.error("Database Connection Failed!", err);
    else { console.log("Database Connected!"); conn.release(); }
});

// ✅ Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ success: false, message: "กรุณากรอก username และ password" });

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], async (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (results.length === 0)
            return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้งานนี้" });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(401).json({ success: false, message: "รหัสผ่านไม่ถูกต้อง" });

        res.json({ 
            success: true, 
            message: "เข้าสู่ระบบสำเร็จ", 
            user: {
                user_id: user.id,
                username: user.username,
                household_id: user.household_id || null
            }
        });
    });
});

// ✅ Signup
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) 
        return res.status(400).json({ success: false, message: "กรุณากรอก username และ password" });

    if (password.length < 6)
        return res.status(400).json({ success: false, message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.query(sql, [username, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY')
                    return res.status(409).json({ success: false, message: "Username นี้มีอยู่แล้ว" });
                return res.status(500).json({ success: false, error: err.message });
            }
            res.json({ success: true, message: "สมัครสมาชิกสำเร็จ" });
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ✅ Register
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password) 
        return res.status(400).json({ success: false, message: "กรุณากรอก username และ password" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
        db.query(sql, [username, hashedPassword, email], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY')
                    return res.status(409).json({ success: false, message: "Username นี้มีอยู่แล้ว" });
                return res.status(500).json({ success: false, error: err.message });
            }
            res.json({ success: true, message: "สมัครสมาชิกสำเร็จ" });
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ✅ เพิ่มวัตถุดิบ
app.post('/api/fridge/add', (req, res) => {
    const { itemName, quantity, category, expiryDate, householdId } = req.body;
    const hId = householdId || 1; 
    const expiry = expiryDate || null;
    const sql = 'INSERT INTO fridge_items (household_id, item_name, quantity, category, expiry_date, remaining_percent) VALUES (?, ?, ?, ?, ?, 100)';
    db.query(sql, [hId, itemName, quantity, category, expiry], (err, result) => {
        if (err) {
            console.error("SQL Error:", err);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, message: "บันทึกข้อมูลสำเร็จ" });
    });
});

// ✅ ดึงข้อมูลตู้เย็น
app.get('/api/fridge', (req, res) => {
    db.query('SELECT * FROM fridge_items', (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: results });
    });
});

// ✅ อัปเดต remaining_percent
app.put('/api/fridge/update/:id', (req, res) => {
  const { id } = req.params;
  const { remaining_percent } = req.body;
  db.query('UPDATE fridge_items SET remaining_percent = ? WHERE item_id = ?', [remaining_percent, id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: "อัปเดตสำเร็จ" });
  });
});

// ✅ ลบวัตถุดิบ
app.delete('/api/fridge/delete/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM fridge_items WHERE item_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: "ลบสำเร็จ" });
  });
});

// ✅ ดึงรายการช้อปปิ้ง
app.get('/api/shopping', (req, res) => {
  const { householdId } = req.query;
  const sql = householdId
    ? 'SELECT * FROM shopping_items WHERE household_id = ?'
    : 'SELECT * FROM shopping_items';
  const params = householdId ? [householdId] : [];
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: results });
  });
});

// ✅ เพิ่มรายการช้อปปิ้ง — แก้ไข: รองรับทั้ง item_name และ name เผื่อมีหลายจุดเรียก
app.post('/api/shopping/add', (req, res) => {
  const { householdId, item_name, name, quantity, qty, reason } = req.body;
  const finalName = item_name || name;
  const finalQty = quantity || qty || '1 ชิ้น';

  if (!finalName) {
    return res.status(400).json({ success: false, message: "กรุณาส่งชื่อสินค้ามาด้วย" });
  }

  const sql = 'INSERT INTO shopping_items (household_id, item_name, quantity, reason, is_checked) VALUES (?, ?, ?, ?, 0)';
  db.query(sql, [householdId || 1, finalName, finalQty, reason || 'manual'], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'เพิ่มรายการสำเร็จ' });
  });
});

// ✅ toggle เช็ค/ไม่เช็ค — แก้ไข: แปลง isChecked เป็น 0/1 ก่อนบันทึกเสมอ
app.post('/api/shopping/toggle', (req, res) => {
  const { shopId, isChecked } = req.body;
  const checkedValue = isChecked ? 1 : 0;
  db.query('UPDATE shopping_items SET is_checked = ? WHERE shop_id = ?', [checkedValue, shopId], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

// ✅ ลบรายการช้อปปิ้ง
app.post('/api/shopping/delete', (req, res) => {
  const { shopId } = req.body;
  db.query('DELETE FROM shopping_items WHERE shop_id = ?', [shopId], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

app.listen(8080, () => console.log("🚀 Server is running on port 8080"));